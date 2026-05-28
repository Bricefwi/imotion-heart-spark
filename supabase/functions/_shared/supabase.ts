// Shared Supabase client + response helpers for edge functions.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp, x-webhook-nonce",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export function userClient(authHeader: string): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
}

/**
 * Mock mode is enabled if EITHER PAPERCLIP_MOCK or PAPERCLIP_MOCK_ENABLED is "true".
 * Default = true (safe), so a missing env never falls back to a real outbound call.
 */
export function isPaperclipMockEnabled(): boolean {
  const a = (Deno.env.get("PAPERCLIP_MOCK") ?? "").toLowerCase();
  const b = (Deno.env.get("PAPERCLIP_MOCK_ENABLED") ?? "").toLowerCase();
  if (a === "true" || b === "true") return true;
  if (a === "false" && b === "false") return false;
  // Either unset → safe default = mock ON.
  return a !== "false" && b !== "false";
}
