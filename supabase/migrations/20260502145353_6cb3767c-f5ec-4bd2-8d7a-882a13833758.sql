DELETE FROM public.sync_logs WHERE job_id = '75bc29c9-aa15-421a-b846-0666c7e462c8';
DELETE FROM public.sync_queue WHERE id = '75bc29c9-aa15-421a-b846-0666c7e462c8';
DELETE FROM public.notifications WHERE title LIKE 'Job en dead-letter : test_dlq_notif%';
