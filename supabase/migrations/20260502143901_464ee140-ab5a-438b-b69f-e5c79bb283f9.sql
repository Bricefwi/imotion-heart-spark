-- Classified failure RPC: distinguishes transient (auto-retry, doesn't consume attempts beyond reason)
-- from permanent errors (immediate dead_letter), and supports partial success (auto-requeue with progress).

CREATE OR REPLACE FUNCTION public.fail_sync_job_classified(
  _job_id uuid,
  _error_message text,
  _error_kind text DEFAULT 'transient',  -- 'transient' | 'permanent' | 'partial'
  _duration_ms integer DEFAULT NULL,
  _response_code integer DEFAULT NULL,
  _response_snippet text DEFAULT NULL,
  _worker_id text DEFAULT NULL,
  _progress jsonb DEFAULT NULL  -- merged into payload._progress for partial retries
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job public.sync_queue%ROWTYPE;
  v_backoff interval;
  v_new_status public.sync_job_status;
  v_attempt_consumed boolean := true;
  v_log_status text;
BEGIN
  SELECT * INTO v_job FROM public.sync_queue WHERE id = _job_id;
  IF v_job.id IS NULL THEN
    RAISE EXCEPTION 'Job not found' USING ERRCODE = 'P0002';
  END IF;

  -- Classification
  IF _error_kind = 'permanent' THEN
    -- Permanent error: immediate dead_letter, no retry
    v_new_status := 'dead_letter';
    v_log_status := 'failure';
  ELSIF _error_kind = 'partial' THEN
    -- Partial success: auto-requeue with shorter backoff, do NOT consume attempt
    v_new_status := 'pending';
    v_log_status := 'partial';
    v_attempt_consumed := false;
  ELSE
    -- Transient error: standard exponential backoff
    v_new_status := CASE
      WHEN v_job.attempts >= v_job.max_attempts THEN 'dead_letter'::public.sync_job_status
      ELSE 'pending'::public.sync_job_status
    END;
    v_log_status := 'failure';
  END IF;

  -- Backoff calculation
  IF _error_kind = 'partial' THEN
    -- Quick retry for partial success (30s flat)
    v_backoff := interval '30 seconds';
  ELSE
    v_backoff := CASE v_job.attempts
      WHEN 1 THEN interval '1 minute'
      WHEN 2 THEN interval '5 minutes'
      WHEN 3 THEN interval '15 minutes'
      WHEN 4 THEN interval '1 hour'
      ELSE interval '6 hours'
    END;
  END IF;

  UPDATE public.sync_queue SET
    status = v_new_status,
    -- Refund attempt for partial success so progress doesn't exhaust retries
    attempts = CASE WHEN v_attempt_consumed THEN attempts ELSE GREATEST(0, attempts - 1) END,
    next_retry_at = CASE WHEN v_new_status = 'pending' THEN now() + v_backoff ELSE next_retry_at END,
    last_error = _error_message,
    locked_until = NULL,
    -- Persist progress checkpoint inside payload for resumable handlers
    payload = CASE
      WHEN _progress IS NOT NULL THEN
        COALESCE(payload, '{}'::jsonb) || jsonb_build_object('_progress', _progress)
      ELSE payload
    END,
    updated_at = now()
  WHERE id = _job_id;

  INSERT INTO public.sync_logs (
    job_id, attempt_number, status, duration_ms,
    error_message, response_code, response_snippet, worker_id
  ) VALUES (
    _job_id, v_job.attempts, v_log_status, _duration_ms,
    _error_message, _response_code, _response_snippet, _worker_id
  );

  RETURN jsonb_build_object(
    'status', v_new_status,
    'kind', _error_kind,
    'attempts', CASE WHEN v_attempt_consumed THEN v_job.attempts ELSE GREATEST(0, v_job.attempts - 1) END,
    'next_retry_at', CASE WHEN v_new_status = 'pending' THEN now() + v_backoff END,
    'attempt_consumed', v_attempt_consumed
  );
END;
$function$;

-- Allow 'partial' as a valid log status
ALTER TABLE public.sync_logs DROP CONSTRAINT IF EXISTS sync_logs_status_check;
ALTER TABLE public.sync_logs ADD CONSTRAINT sync_logs_status_check
  CHECK (status IN ('success', 'failure', 'partial'));
