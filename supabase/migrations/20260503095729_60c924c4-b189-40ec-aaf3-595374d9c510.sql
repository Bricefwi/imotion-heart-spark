
-- Grant cron schema usage via SECURITY DEFINER functions

CREATE OR REPLACE FUNCTION public.admin_list_cron_jobs()
RETURNS TABLE(
  jobid bigint,
  jobname text,
  schedule text,
  command text,
  active boolean,
  database text,
  username text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT j.jobid, j.jobname, j.schedule, j.command, j.active, j.database, j.username
  FROM cron.job j
  ORDER BY j.jobname;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_cron_runs(p_limit integer DEFAULT 100)
RETURNS TABLE(
  jobid bigint,
  jobname text,
  runid bigint,
  status text,
  return_message text,
  start_time timestamptz,
  end_time timestamptz,
  duration_ms numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    r.jobid,
    j.jobname,
    r.runid,
    r.status,
    r.return_message,
    r.start_time,
    r.end_time,
    EXTRACT(EPOCH FROM (r.end_time - r.start_time)) * 1000 AS duration_ms
  FROM cron.job_run_details r
  LEFT JOIN cron.job j ON j.jobid = r.jobid
  ORDER BY r.start_time DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_cron_jobs() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_cron_runs(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_cron_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_cron_runs(integer) TO authenticated;
