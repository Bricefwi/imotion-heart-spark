-- Anti-replay: store consumed nonces with TTL
CREATE TABLE IF NOT EXISTS public.webhook_nonces (
  nonce TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '15 minutes'
);

ALTER TABLE public.webhook_nonces ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (no public access)
CREATE POLICY "Service role manages nonces"
ON public.webhook_nonces
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_webhook_nonces_expires ON public.webhook_nonces(expires_at);

-- Cleanup function for expired nonces
CREATE OR REPLACE FUNCTION public.cleanup_webhook_nonces()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.webhook_nonces WHERE expires_at < now();
$$;