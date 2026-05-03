// Admin-only SSO debug console
// Inspects a bridge token: decodes header/payload, verifies HMAC against the
// active bridge secret, checks expiry/audience/issuer, returns DB consumption
// status, and diagnoses why a redirection might have failed.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { resolveBridgeSecret, secretFingerprint } from "../_shared/bridge-secret.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlToString(s: string): string {
  return new TextDecoder().decode(b64urlToBytes(s));
}
async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
}
function timingEq(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
  return r === 0;
}

interface Diagnostic {
  level: "ok" | "warn" | "error";
  code: string;
  message: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resolved = resolveBridgeSecret();

  // Authn: must be admin
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "missing_authorization" }, 401);
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: u, error: ue } = await userClient.auth.getUser();
  if (ue || !u?.user) return json({ error: "invalid_session" }, 401);
  const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
  const { data: isSuper } = await userClient.rpc("has_role", { _user_id: u.user.id, _role: "super_admin" });
  if (!isAdmin && !isSuper) return json({ error: "forbidden" }, 403);

  let body: { token?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }
  const token = body.token?.trim();

  const diagnostics: Diagnostic[] = [];
  const out: Record<string, unknown> = {
    secret: {
      configured: !!resolved.value,
      source: resolved.source,
      fingerprint: secretFingerprint(resolved.value),
    },
  };

  if (!resolved.value) {
    diagnostics.push({ level: "error", code: "secret_missing",
      message: "Aucun secret bridge configuré. Configurez LOVELIB_BRIDGE_SECRET ou MARKETING_WEBHOOK_SECRET." });
    return json({ ...out, diagnostics });
  }

  if (!token) {
    diagnostics.push({ level: "warn", code: "no_token", message: "Aucun token fourni à analyser." });
    return json({ ...out, diagnostics });
  }

  // 1) Structural decode
  const parts = token.split(".");
  if (parts.length !== 3) {
    diagnostics.push({ level: "error", code: "malformed",
      message: `Token mal formé : attendu 3 segments, reçu ${parts.length}.` });
    return json({ ...out, diagnostics });
  }
  const [h, p, s] = parts;

  let header: Record<string, unknown> | null = null;
  let payload: Record<string, unknown> | null = null;
  try { header = JSON.parse(b64urlToString(h)); }
  catch { diagnostics.push({ level: "error", code: "header_decode_failed", message: "Impossible de décoder le header." }); }
  try { payload = JSON.parse(b64urlToString(p)); }
  catch { diagnostics.push({ level: "error", code: "payload_decode_failed", message: "Impossible de décoder le payload." }); }

  out.header = header;
  out.payload = payload;

  if (header && header.alg !== "HS256") {
    diagnostics.push({ level: "error", code: "wrong_alg",
      message: `Algorithme inattendu : ${String(header.alg)}. Attendu HS256.` });
  }

  // 2) Signature
  let sigOk = false;
  try {
    const expected = await hmac(resolved.value, `${h}.${p}`);
    const provided = b64urlToBytes(s);
    sigOk = timingEq(expected, provided);
  } catch (e) {
    diagnostics.push({ level: "error", code: "sig_compute_failed",
      message: `Calcul HMAC échoué : ${e instanceof Error ? e.message : String(e)}` });
  }
  out.signature_valid = sigOk;
  if (!sigOk) {
    diagnostics.push({
      level: "error",
      code: "signature_mismatch",
      message: "Signature invalide. Le secret de Clarivi ne correspond pas à celui ayant signé ce token (typiquement : lovelib utilise une autre valeur).",
    });
  } else {
    diagnostics.push({ level: "ok", code: "signature_ok", message: "Signature HMAC valide." });
  }

  // 3) Claims sémantiques
  const now = Math.floor(Date.now() / 1000);
  if (payload) {
    const exp = typeof payload.exp === "number" ? payload.exp : null;
    const iat = typeof payload.iat === "number" ? payload.iat : null;
    const iss = payload.iss;
    const aud = payload.aud;
    out.expires_in_seconds = exp ? exp - now : null;
    out.issued_seconds_ago = iat ? now - iat : null;

    if (exp === null) {
      diagnostics.push({ level: "error", code: "exp_missing", message: "Claim `exp` manquant." });
    } else if (exp < now) {
      diagnostics.push({ level: "error", code: "expired",
        message: `Token expiré depuis ${now - exp}s.` });
    } else if (exp - now > 60) {
      diagnostics.push({ level: "warn", code: "ttl_too_long",
        message: `TTL anormalement élevé (${exp - now}s). Limite recommandée : 60s.` });
    } else {
      diagnostics.push({ level: "ok", code: "not_expired",
        message: `Token valide encore ${exp - now}s.` });
    }

    if (iss !== "clarivi") {
      diagnostics.push({ level: "warn", code: "wrong_iss",
        message: `Issuer inattendu : ${String(iss)}. Attendu "clarivi".` });
    }
    if (aud !== "lovelib") {
      diagnostics.push({ level: "warn", code: "wrong_aud",
        message: `Audience inattendue : ${String(aud)}. Attendu "lovelib".` });
    }
    if (!payload.sub) diagnostics.push({ level: "error", code: "sub_missing", message: "Claim `sub` manquant." });
    if (!payload.email) diagnostics.push({ level: "warn", code: "email_missing", message: "Claim `email` manquant." });
  }

  // 4) DB lookup (consommation one-shot)
  if (payload?.jti) {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: row, error: dbErr } = await admin
      .from("lovelib_bridge_tokens")
      .select("jti, user_id, email, expires_at, consumed_at, consumed_ip, consumed_ua")
      .eq("jti", payload.jti)
      .maybeSingle();

    if (dbErr) {
      diagnostics.push({ level: "warn", code: "db_lookup_failed", message: `Lookup BDD : ${dbErr.message}` });
    } else if (!row) {
      diagnostics.push({
        level: "error",
        code: "jti_unknown",
        message: "Le `jti` n'existe pas en base : token jamais émis par cette instance Clarivi (clone, ancien projet, ou base réinitialisée).",
      });
    } else {
      out.db_record = row;
      if (row.consumed_at) {
        diagnostics.push({
          level: "error",
          code: "already_consumed",
          message: `Token déjà consommé le ${row.consumed_at}. Les tokens sont one-shot — l'utilisateur a probablement double-cliqué ou rafraîchi la page de redirection.`,
        });
      } else {
        diagnostics.push({ level: "ok", code: "jti_unconsumed", message: "Token connu et non consommé." });
      }
    }
  }

  // 5) Verdict global
  const errors = diagnostics.filter((d) => d.level === "error").length;
  const warns = diagnostics.filter((d) => d.level === "warn").length;
  out.verdict = errors > 0 ? "fail" : warns > 0 ? "warn" : "ok";
  out.diagnostics = diagnostics;

  return json(out);
});
