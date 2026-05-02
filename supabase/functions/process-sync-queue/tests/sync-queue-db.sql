-- Tests d'intégration DB pour la sync_queue.
-- Couvre: backoff exponentiel, DLQ après max_attempts, permanent → DLQ immédiat,
--         partial ne consomme pas d'attempt, dedupe_key empêche les doublons.
--
-- Contrainte: le rôle d'exécution n'a pas UPDATE direct sur sync_queue (RLS).
-- On contourne en insérant des jobs avec `attempts` pré-set, puis en appelant
-- les RPC SECURITY DEFINER (fail_sync_job_classified, claim_sync_jobs).

DO $$
DECLARE
  job_a uuid; job_b uuid; job_c uuid; job_id uuid; job_id2 uuid;
  job RECORD;
  next_a timestamptz; next_b timestamptz; next_c timestamptz;
  log_count int;
  dedupe_key_a text := 'pgtest-dedupe-' || gen_random_uuid()::text;
  test_user uuid := gen_random_uuid();
BEGIN
  RAISE NOTICE '========== Test 1: backoff exponentiel (1m → 5m → 15m) ==========';
  -- 3 jobs avec attempts différents pour observer la progression du backoff
  INSERT INTO sync_queue (job_type, payload, dedupe_key, max_attempts, status, attempts, related_user_id)
  VALUES ('marketing_webhook_forward', '{}'::jsonb, 'pgtest-bo-a-' || gen_random_uuid(), 5, 'processing', 1, test_user)
  RETURNING id INTO job_a;
  INSERT INTO sync_queue (job_type, payload, dedupe_key, max_attempts, status, attempts, related_user_id)
  VALUES ('marketing_webhook_forward', '{}'::jsonb, 'pgtest-bo-b-' || gen_random_uuid(), 5, 'processing', 2, test_user)
  RETURNING id INTO job_b;
  INSERT INTO sync_queue (job_type, payload, dedupe_key, max_attempts, status, attempts, related_user_id)
  VALUES ('marketing_webhook_forward', '{}'::jsonb, 'pgtest-bo-c-' || gen_random_uuid(), 5, 'processing', 3, test_user)
  RETURNING id INTO job_c;

  PERFORM fail_sync_job_classified(job_a, '503', 'transient', 50, 503, NULL, 'pgtest', NULL);
  PERFORM fail_sync_job_classified(job_b, '503', 'transient', 50, 503, NULL, 'pgtest', NULL);
  PERFORM fail_sync_job_classified(job_c, '503', 'transient', 50, 503, NULL, 'pgtest', NULL);

  SELECT next_retry_at INTO next_a FROM sync_queue WHERE id = job_a;
  SELECT next_retry_at INTO next_b FROM sync_queue WHERE id = job_b;
  SELECT next_retry_at INTO next_c FROM sync_queue WHERE id = job_c;
  ASSERT next_b > next_a, format('backoff(2)=% doit être > backoff(1)=%', next_b - now(), next_a - now());
  ASSERT next_c > next_b, format('backoff(3)=% doit être > backoff(2)=%', next_c - now(), next_b - now());
  RAISE NOTICE 'OK — backoff exponentiel: 1m=%, 2m=%, 3m=%',
    next_a - now(), next_b - now(), next_c - now();
  DELETE FROM sync_logs sl WHERE sl.job_id IN (job_a, job_b, job_c);
  DELETE FROM sync_queue WHERE id IN (job_a, job_b, job_c);

  RAISE NOTICE '========== Test 2: DLQ quand attempts >= max_attempts ==========';
  -- Job avec attempts = max_attempts → prochain fail transient doit DLQ
  INSERT INTO sync_queue (job_type, payload, dedupe_key, max_attempts, status, attempts, related_user_id)
  VALUES ('marketing_webhook_forward', '{}'::jsonb, 'pgtest-dlq-' || gen_random_uuid(), 3, 'processing', 3, test_user)
  RETURNING id INTO job_id;
  PERFORM fail_sync_job_classified(job_id, '503 final', 'transient', 50, 503, NULL, 'pgtest', NULL);
  SELECT * INTO job FROM sync_queue WHERE id = job_id;
  ASSERT job.status = 'dead_letter', format('DLQ attendu, reçu %s', job.status);
  SELECT count(*) INTO log_count FROM sync_logs sl WHERE sl.job_id = job.id;
  ASSERT log_count = 1, format('1 log attendu, reçu %s', log_count);
  RAISE NOTICE 'OK — fail transient avec attempts >= max_attempts → DLQ';
  DELETE FROM sync_logs sl WHERE sl.job_id = job.id;
  DELETE FROM sync_queue WHERE id = job.id;

  RAISE NOTICE '========== Test 3: permanent → DLQ immédiat ==========';
  INSERT INTO sync_queue (job_type, payload, dedupe_key, max_attempts, status, attempts, related_user_id)
  VALUES ('marketing_webhook_forward', '{}'::jsonb, 'pgtest-perm-' || gen_random_uuid(), 5, 'processing', 1, test_user)
  RETURNING id INTO job_id;
  PERFORM fail_sync_job_classified(job_id, '404', 'permanent', 50, 404, NULL, 'pgtest', NULL);
  SELECT * INTO job FROM sync_queue WHERE id = job_id;
  ASSERT job.status = 'dead_letter', format('permanent → DLQ attendu, reçu %s (attempts=%s/max=%s)',
    job.status, job.attempts, job.max_attempts);
  RAISE NOTICE 'OK — permanent → DLQ même avec attempts=% < max=%', job.attempts, job.max_attempts;
  DELETE FROM sync_logs sl WHERE sl.job_id = job.id;
  DELETE FROM sync_queue WHERE id = job.id;

  RAISE NOTICE '========== Test 4: partial NE consomme PAS d''attempt + checkpoint ==========';
  INSERT INTO sync_queue (job_type, payload, dedupe_key, max_attempts, status, attempts, related_user_id)
  VALUES (
    'marketing_audit_merge',
    jsonb_build_object('user_id', test_user::text, 'audit', '{"score":80}'::jsonb),
    'pgtest-partial-' || gen_random_uuid(), 5, 'processing', 2, test_user
  ) RETURNING id INTO job_id;
  PERFORM fail_sync_job_classified(
    job_id, 'step 2 failed', 'partial', 50, NULL, NULL, 'pgtest',
    jsonb_build_object('audit_done', true, 'audit_id', gen_random_uuid()::text)
  );
  SELECT * INTO job FROM sync_queue WHERE id = job_id;
  ASSERT job.attempts = 1, format('partial doit rendre l''attempt (2 → 1), reçu %s', job.attempts);
  ASSERT job.status = 'pending', format('pending attendu après partial, reçu %s', job.status);
  ASSERT (job.payload->'_progress'->>'audit_done')::boolean = true,
    format('checkpoint audit_done manquant: %s', job.payload);
  ASSERT job.next_retry_at - now() < interval '2 minutes',
    format('partial doit re-essayer rapidement (~30s), reçu %s', job.next_retry_at - now());
  RAISE NOTICE 'OK — partial → attempt rendu, checkpoint persisté, retry dans %', job.next_retry_at - now();
  DELETE FROM sync_logs sl WHERE sl.job_id = job.id;
  DELETE FROM sync_queue WHERE id = job.id;

  RAISE NOTICE '========== Test 5: dedupe_key empêche les doublons ==========';
  INSERT INTO sync_queue (job_type, payload, dedupe_key, max_attempts, status, related_user_id)
  VALUES ('marketing_webhook_forward', '{"v":1}'::jsonb, dedupe_key_a, 5, 'pending', test_user)
  RETURNING id INTO job_id;
  BEGIN
    INSERT INTO sync_queue (job_type, payload, dedupe_key, max_attempts, status, related_user_id)
    VALUES ('marketing_webhook_forward', '{"v":2}'::jsonb, dedupe_key_a, 5, 'pending', test_user);
    RAISE EXCEPTION 'Le doublon aurait dû être rejeté par l''index unique';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE '  doublon (status pending) rejeté ✓';
  END;
  SELECT count(*) INTO log_count FROM sync_queue WHERE dedupe_key = dedupe_key_a;
  ASSERT log_count = 1, format('1 seul job attendu, reçu %s', log_count);
  RAISE NOTICE 'OK — dedupe_key garantit l''unicité tant que job actif';
  DELETE FROM sync_queue WHERE dedupe_key = dedupe_key_a;

  RAISE NOTICE '========== ✅ TOUS LES TESTS DB SONT PASSÉS ==========';
END $$;
