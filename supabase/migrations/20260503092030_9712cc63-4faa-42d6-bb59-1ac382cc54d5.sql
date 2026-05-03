
CREATE TABLE IF NOT EXISTS public.lovelib_bridge_tokens (
  jti text PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  consumer_ip text,
  consumer_ua text
);

CREATE INDEX IF NOT EXISTS lovelib_bridge_tokens_expires_idx
  ON public.lovelib_bridge_tokens (expires_at);

ALTER TABLE public.lovelib_bridge_tokens ENABLE ROW LEVEL SECURITY;

-- No public policies: only service-role (edge functions) may read/write.

CREATE OR REPLACE FUNCTION public.cleanup_lovelib_bridge_tokens()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.lovelib_bridge_tokens
  WHERE expires_at < now() - interval '1 hour';
$$;
