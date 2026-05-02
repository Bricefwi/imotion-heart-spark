-- Trigger function: on dead_letter transition, notify all admins
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
  -- Only fire when status transitions INTO dead_letter
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

  -- One notification per admin
  FOR v_admin IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'::public.app_role
  LOOP
    INSERT INTO public.notifications (
      user_id, type, title, body, link, link_type,
      project_id, channels, sent_via
    ) VALUES (
      v_admin.user_id,
      'sync_dead_letter',
      v_title,
      v_body,
      v_link,
      'admin_route',
      NEW.related_project_id,
      ARRAY['in_app']::text[],
      jsonb_build_object('job_id', NEW.id, 'job_type', NEW.job_type, 'attempts', NEW.attempts)
    );
  END LOOP;

  -- Activity log entry (best-effort, don't block the trigger)
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    -- Activities require user_id NOT NULL; skip silently if created_by is null
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_on_dead_letter ON public.sync_queue;

CREATE TRIGGER trg_notify_admins_on_dead_letter
AFTER UPDATE OF status ON public.sync_queue
FOR EACH ROW
WHEN (NEW.status = 'dead_letter' AND OLD.status IS DISTINCT FROM 'dead_letter')
EXECUTE FUNCTION public.notify_admins_on_dead_letter();
