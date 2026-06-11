-- Drop Paperclip integration entirely (Lot 1 + Lot 2 reverted)
DROP VIEW IF EXISTS public.v_client_job_status CASCADE;
DROP TABLE IF EXISTS public.paperclip_documents CASCADE;
DROP TABLE IF EXISTS public.paperclip_job_events CASCADE;
DROP TABLE IF EXISTS public.paperclip_jobs CASCADE;