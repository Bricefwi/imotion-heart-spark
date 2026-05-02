CREATE OR REPLACE FUNCTION public.notify_admins_on_dead_letter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin RECORD;
  v_short_error TEXT;
  v_link TEXT;
  v_title TEXT;
  v_body TEXT;
BEGIN
  IF NEW.status <> 'dead_letter' OR OLD.status = 'dead_letter' THEN
    RETURN NEW;
  END IF;

  v_short_error := COALESCE(LEFT(NEW.last_error, 280), 'Erreur inconnue');
  v_link := '/admin/sync-queue?job=' || NEW.id::text;
  v_title := 'Job en dead-letter : ' || NEW.job_type;
  v_body := format(
    'Le job %s (%s) a atteint le dead-letter après %s tentatives. Dernière erreur : %s',
    NEW.job_type, NEW.id, NEW.attempts, v_short_error
  );

  FOR v_admin IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'::public.app_role
  LOOP
    INSERT INTO public.notifications (
      user_id, type, title, body, link,
      project_id, channels, sent_via
    ) VALUES (
      v_admin.user_id,
      'system',          -- whitelisted by notifications_type_check
      v_title,
      v_body,
      v_link,
      NEW.related_project_id,
      ARRAY['in_app']::text[],
      jsonb_build_object(
        'kind', 'sync_dead_letter',
        'job_id', NEW.id,
        'job_type', NEW.job_type,
        'attempts', NEW.attempts,
        'dedupe_key', NEW.dedupe_key
      )
    );
  END LOOP;

  -- Activity log entry (best-effort, don't block the trigger)
  BEGIN
    IF NEW.created_by IS NOT NULL THEN
      INSERT INTO public.activities (
        user_id, project_id, action, description, metadata, importance
      ) VALUES (
        NEW.created_by,
        NEW.related_project_id,
        'sync_job_dead_letter',
        format('Job %s en dead-letter', NEW.job_type),
        jsonb_build_object(
          'job_id', NEW.id,
          'job_type', NEW.job_type,
          'attempts', NEW.attempts,
          'last_error', v_short_error,
          'dedupe_key', NEW.dedupe_key
        ),
        'high'
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;
