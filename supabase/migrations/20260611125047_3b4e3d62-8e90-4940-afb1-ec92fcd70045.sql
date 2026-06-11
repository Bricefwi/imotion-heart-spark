SELECT cron.schedule(
  'generate-blog-posts-biweekly',
  '0 9 1,15 * *',
  $$
  SELECT net.http_post(
    url := 'https://npmkzqxoxobfqdqpnsgf.supabase.co/functions/v1/generate-blog-post',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);