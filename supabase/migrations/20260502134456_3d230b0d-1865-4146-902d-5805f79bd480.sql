-- ===========================================================================
-- SYNC QUEUE: persistent retry queue for cross-app sync (lovelib ↔ clarivi)
-- ===========================================================================

-- Status enum
DO $$ BEGIN
  CREATE TYPE public.sync_job_status AS ENUM (
    'pending', 'processing', 'success', 'failed', 'dead_letter'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Queue table
CREATE TABLE IF NOT EXISTS public.sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,                    -- e.g. 'marketing_audit_merge'
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.sync_job_status NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 5,
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  dedupe_key text,                           -- unique idempotency key (optional)
  created_by uuid,                           -- auth.uid() of enqueuer
  related_user_id uuid,                      -- user this job concerns
  related_project_id uuid,                   -- project this job concerns
  locked_until timestamptz,                  -- claim lease
  worker_id text,                            -- which worker holds the lease
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_queue_dedupe
  ON public.sync_queue(job_type, dedupe_key)
  WHERE dedupe_key IS NOT NULL AND status NOT IN ('success', 'dead_letter');

CREATE INDEX IF NOT EXISTS idx_sync_queue_ready
  ON public.sync_queue(next_retry_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_sync_queue_user ON public.sync_queue(related_user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON public.sync_queue(status);

-- Logs table
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.sync_queue(id) ON DELETE CASCADE,
  attempt_number int NOT NULL,
  status text NOT NULL,                      -- 'success' | 'failure'
  duration_ms int,
  error_message text,
  response_code int,
  response_snippet text,
  worker_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_job ON public.sync_logs(job_id, created_at);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_sync_queue_updated ON public.sync_queue;
CREATE TRIGGER trg_sync_queue_updated
  BEFORE UPDATE ON public.sync_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================================================
-- RLS
-- ===========================================================================
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages queue"
  ON public.sync_queue FOR ALL TO public
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins manage queue"
  ON public.sync_queue FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users read own jobs"
  ON public.sync_queue FOR SELECT TO authenticated
  USING (
    related_user_id = auth.uid()
    OR created_by = auth.uid()
    OR (related_project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = related_project_id
        AND (p.client_id = auth.uid() OR p.consultant_id = auth.uid())
    ))
  );

CREATE POLICY "Service role manages logs"
  ON public.sync_logs FOR ALL TO public
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins read logs"
  ON public.sync_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users read own job logs"
  ON public.sync_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sync_queue q
    WHERE q.id = sync_logs.job_id
      AND (q.related_user_id = auth.uid() OR q.created_by = auth.uid())
  ));

-- ===========================================================================
-- ENQUEUE: callable from authenticated client (idempotent via dedupe_key)
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.enqueue_sync_job(
  _job_type text,
  _payload jsonb,
  _dedupe_key text DEFAULT NULL,
  _related_project_id uuid DEFAULT NULL,
  _max_attempts int DEFAULT 5
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_job_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  -- Idempotent insert via partial unique index on (job_type, dedupe_key)
  INSERT INTO public.sync_queue (
    job_type, payload, dedupe_key, created_by,
    related_user_id, related_project_id, max_attempts
  ) VALUES (
    _job_type, COALESCE(_payload, '{}'::jsonb), _dedupe_key, v_user,
    v_user, _related_project_id, GREATEST(1, LEAST(_max_attempts, 10))
  )
  ON CONFLICT (job_type, dedupe_key)
    WHERE dedupe_key IS NOT NULL AND status NOT IN ('success', 'dead_letter')
  DO UPDATE SET updated_at = now()  -- no-op return existing
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enqueue_sync_job(text, jsonb, text, uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enqueue_sync_job(text, jsonb, text, uuid, int) TO authenticated;

-- ===========================================================================
-- CLAIM: worker atomically grabs ready jobs (lease-based, prevents doubles)
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.claim_sync_jobs(
  _worker_id text,
  _batch_size int DEFAULT 10,
  _lease_seconds int DEFAULT 60
)
RETURNS SETOF public.sync_queue
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ready AS (
    SELECT id FROM public.sync_queue
    WHERE status = 'pending'
      AND next_retry_at <= now()
      AND (locked_until IS NULL OR locked_until < now())
    ORDER BY next_retry_at
    LIMIT GREATEST(1, LEAST(_batch_size, 50))
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.sync_queue q
  SET status = 'processing',
      attempts = q.attempts + 1,
      locked_until = now() + make_interval(secs => _lease_seconds),
      worker_id = _worker_id,
      updated_at = now()
  FROM ready
  WHERE q.id = ready.id
  RETURNING q.*;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_sync_jobs(text, int, int) FROM PUBLIC, anon, authenticated;

-- ===========================================================================
-- COMPLETE: mark success + log
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.complete_sync_job(
  _job_id uuid,
  _duration_ms int DEFAULT NULL,
  _response_code int DEFAULT NULL,
  _response_snippet text DEFAULT NULL,
  _worker_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_attempts int;
BEGIN
  UPDATE public.sync_queue
  SET status = 'success',
      completed_at = now(),
      locked_until = NULL,
      last_error = NULL,
      updated_at = now()
  WHERE id = _job_id
  RETURNING attempts INTO v_attempts;

  INSERT INTO public.sync_logs (
    job_id, attempt_number, status, duration_ms,
    response_code, response_snippet, worker_id
  ) VALUES (
    _job_id, v_attempts, 'success', _duration_ms,
    _response_code, _response_snippet, _worker_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_sync_job(uuid, int, int, text, text) FROM PUBLIC, anon, authenticated;

-- ===========================================================================
-- FAIL: schedule retry with exponential backoff or send to dead-letter
-- Backoff: 1min, 5min, 15min, 1h, 6h
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.fail_sync_job(
  _job_id uuid,
  _error_message text,
  _duration_ms int DEFAULT NULL,
  _response_code int DEFAULT NULL,
  _response_snippet text DEFAULT NULL,
  _worker_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.sync_queue%ROWTYPE;
  v_backoff interval;
  v_new_status public.sync_job_status;
BEGIN
  SELECT * INTO v_job FROM public.sync_queue WHERE id = _job_id;
  IF v_job.id IS NULL THEN
    RAISE EXCEPTION 'Job not found' USING ERRCODE = 'P0002';
  END IF;

  v_backoff := CASE v_job.attempts
    WHEN 1 THEN interval '1 minute'
    WHEN 2 THEN interval '5 minutes'
    WHEN 3 THEN interval '15 minutes'
    WHEN 4 THEN interval '1 hour'
    ELSE interval '6 hours'
  END;

  IF v_job.attempts >= v_job.max_attempts THEN
    v_new_status := 'dead_letter';
  ELSE
    v_new_status := 'pending';
  END IF;

  UPDATE public.sync_queue SET
    status = v_new_status,
    next_retry_at = CASE WHEN v_new_status = 'pending' THEN now() + v_backoff ELSE next_retry_at END,
    last_error = _error_message,
    locked_until = NULL,
    updated_at = now()
  WHERE id = _job_id;

  INSERT INTO public.sync_logs (
    job_id, attempt_number, status, duration_ms,
    error_message, response_code, response_snippet, worker_id
  ) VALUES (
    _job_id, v_job.attempts, 'failure', _duration_ms,
    _error_message, _response_code, _response_snippet, _worker_id
  );

  RETURN jsonb_build_object(
    'status', v_new_status,
    'attempts', v_job.attempts,
    'next_retry_at', CASE WHEN v_new_status = 'pending' THEN now() + v_backoff END
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fail_sync_job(uuid, text, int, int, text, text) FROM PUBLIC, anon, authenticated;

-- ===========================================================================
-- REQUEUE: admin can manually retry a dead-letter job
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.requeue_sync_job(_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only' USING ERRCODE = '42501';
  END IF;

  UPDATE public.sync_queue SET
    status = 'pending',
    next_retry_at = now(),
    attempts = 0,
    last_error = NULL,
    locked_until = NULL,
    updated_at = now()
  WHERE id = _job_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.requeue_sync_job(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.requeue_sync_job(uuid) TO authenticated;