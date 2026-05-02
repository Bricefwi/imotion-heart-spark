
CREATE TABLE IF NOT EXISTS public.lovelib_token_uses (
  jti TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  audit_external_id TEXT,
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lovelib_token_uses_expires_at
  ON public.lovelib_token_uses (expires_at);

ALTER TABLE public.lovelib_token_uses ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (bypasses RLS) can access.

CREATE OR REPLACE FUNCTION public.cleanup_lovelib_token_uses()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.lovelib_token_uses WHERE expires_at < now();
$$;
