REVOKE EXECUTE ON FUNCTION public.get_active_model(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_active_model(text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_agent_state() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_active_model(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_active_model(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_agent_state() TO service_role;