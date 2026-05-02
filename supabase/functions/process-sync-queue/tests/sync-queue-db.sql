-- Tests d'intégration DB pour la sync_queue.
-- Couvre: backoff exponentiel, DLQ après max_attempts, permanent → DLQ immédiat,
--         partial ne consomme pas d'attempt, dedupe_key empêche les doublons.
--
-- Exécution (idempotent — nettoie ses propres données):
--   psql < supabase/functions/process-sync-queue/tests/sync-queue-db.sql
--
-- Toutes les assertions utilisent ASSERT (raise NOTICE si OK, exception si KO).

DO $$
DECLARE
  job_id uuid;
  job_id2 uuid;
  job RECORD;
  dt1 interval;
  dt2 interval;
  log_count int;
  dedupe_key_a text := 'pgtest-dedupe-' || gen_random_uuid()::text;
  test_user uuid := gen_random_uuid();
BEGIN
  RAISE NOTICE '========== Test 1: backoff exponentiel ==========';
  job_id := enqueue_sync_job(
    'marketing_webhook_forward',
    jsonb_build_object('url', 'https://example.invalid/hook', 'body', '{}'::jsonb),
    'pgtest-backoff-' || gen_random_uuid()::text,
    NULL,
    3
  );
  PERFORM fail_sync_job_classified(job_id, '503 upstream', 'transient', 100, 503, NULL, 'pgtest', NULL);
  SELECT * INTO job FROM sync_queue WHERE id = job_id;
  ASSERT job.attempts = 1, format('attempt #1 attendu, reçu %s', job.attempts);
  ASSERT job.status = 'pending', format('status pending attendu, reçu %s', job.status);
  dt1 := job.next_retry_at - now();
  ASSERT dt1 > interval '30 seconds', format('backoff #1 trop court: %s', dt1);

  PERFORM fail_sync_job_classified(job_id, '503 upstream', 'transient', 100, 503, NULL, 'pgtest', NULL);
  SELECT * INTO job FROM sync_queue WHERE id = job_id;
  ASSERT job.attempts = 2, format('attempt #2 attendu, reçu %s', job.attempts);
  dt2 := job.next_retry_at - now();
  ASSERT dt2 > dt1, format('backoff #2 (%s) doit être > #1 (%s)', dt2, dt1);
  RAISE NOTICE 'OK — backoff %s → %s', dt1, dt2;

  -- 3e échec → DLQ (max_attempts = 3)
  PERFORM fail_sync_job_classified(job_id, '503', 'transient', 50, 503, NULL, 'pgtest', NULL);
  SELECT * INTO job FROM sync_queue WHERE id = job_id;
  ASSERT job.attempts = 3, format('attempt 3 attendu, reçu %s', job.attempts);
  ASSERT job.status = 'dead_letter', format('DLQ attendu, reçu %s', job.status);
  SELECT count(*) INTO log_count FROM sync_logs WHERE job_id = job.id;
  ASSERT log_count = 3, format('3 logs attendus, reçu %s', log_count);
  RAISE NOTICE 'OK — DLQ après 3 échecs avec % logs persistés', log_count;
  DELETE FROM sync_logs WHERE job_id = job.id;
  DELETE FROM sync_queue WHERE id = job.id;

  RAISE NOTICE '========== Test 2: permanent → DLQ immédiat ==========';
  job_id := enqueue_sync_job(
    'marketing_webhook_forward',
    jsonb_build_object('url', 'https://example.invalid/perm'),
    'pgtest-perm-' || gen_random_uuid()::text,
    NULL, 5
  );
  PERFORM fail_sync_job_classified(job_id, '404 not found', 'permanent', 50, 404, NULL, 'pgtest', NULL);
  SELECT * INTO job FROM sync_queue WHERE id = job_id;
  ASSERT job.status = 'dead_letter', format('permanent → DLQ attendu, reçu %s', job.status);
  ASSERT job.attempts = 1, format('1 seul attempt attendu, reçu %s', job.attempts);
  RAISE NOTICE 'OK — permanent va directement en DLQ sans retry';
  DELETE FROM sync_logs WHERE job_id = job.id;
  DELETE FROM sync_queue WHERE id = job.id;

  RAISE NOTICE '========== Test 3: partial NE consomme PAS d''attempt ==========';
  job_id := enqueue_sync_job(
    'marketing_audit_merge',
    jsonb_build_object(
      'user_id', test_user::text,
      'audit', jsonb_build_object('score', 80)
    ),
    'pgtest-partial-' || gen_random_uuid()::text,
    NULL, 5
  );
  PERFORM fail_sync_job_classified(
    job_id, 'step 2 failed', 'partial', 50, NULL, NULL, 'pgtest',
    jsonb_build_object('audit_done', true, 'audit_id', gen_random_uuid()::text)
  );
  SELECT * INTO job FROM sync_queue WHERE id = job_id;
  ASSERT job.attempts = 0, format('partial NE doit PAS consommer attempt, reçu %s', job.attempts);
  ASSERT job.status = 'pending', format('pending attendu après partial, reçu %s', job.status);
  ASSERT (job.payload->'_progress'->>'audit_done')::boolean = true,
    format('checkpoint audit_done manquant: %s', job.payload);
  ASSERT job.next_retry_at - now() < interval '2 minutes',
    format('partial doit re-essayer rapidement (~30s), reçu %s', job.next_retry_at - now());
  RAISE NOTICE 'OK — partial requeue immédiat avec checkpoint persisté';
  DELETE FROM sync_logs WHERE job_id = job.id;
  DELETE FROM sync_queue WHERE id = job.id;

  RAISE NOTICE '========== Test 4: dedupe_key empêche les doublons ==========';
  job_id := enqueue_sync_job(
    'marketing_webhook_forward',
    jsonb_build_object('url', 'https://example.invalid/d', 'v', 1),
    dedupe_key_a, NULL, 5
  );
  job_id2 := enqueue_sync_job(
    'marketing_webhook_forward',
    jsonb_build_object('url', 'https://example.invalid/d', 'v', 2),
    dedupe_key_a, NULL, 5
  );
  ASSERT job_id = job_id2,
    format('même dedupe_key doit retourner même id, reçu % et %', job_id, job_id2);
  SELECT count(*) INTO log_count FROM sync_queue WHERE dedupe_key = dedupe_key_a;
  ASSERT log_count = 1, format('1 seul job attendu pour dedupe_key, reçu %s', log_count);
  RAISE NOTICE 'OK — dedupe_key garantit l''idempotence';
  DELETE FROM sync_queue WHERE dedupe_key = dedupe_key_a;

  RAISE NOTICE '========== ✅ TOUS LES TESTS DB SONT PASSÉS ==========';
END $$;
