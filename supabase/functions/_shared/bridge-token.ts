// Shared HS256 helpers for the lovelib SSO bridge token.
// Token = header.payload.sig (b64url, HMAC-SHA256).
// Lifetime is short (≤60s) and consumption is one-shot via jti.

export const BRIDGE_MAX_TTL_SECONDS = 60;
export const BRIDGE_CLOCK_SKEW = 10;

export interface BridgePayload {
  iss: "clarivi";
  aud: "lovelib";
  sub: string;        // Clarivi user id
  email: string;
  iat: number;
  exp: number;
  jti: string;
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlEncodeStr(s: string): string {
  return b64urlEncode(new TextEncoder().encode(s));
}
function b64urlToBytes(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlToString(input: string): string {
  return new TextDecoder().decode(b64urlToBytes(input));
}
async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}
function timingEq(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
  return r === 0;
}

export async function signBridgeToken(
  payload: Omit<BridgePayload, "iss" | "aud" | "iat" | "exp" | "jti"> & {
    ttlSeconds?: number;
  },
  secret: string,
): Promise<{ token: string; jti: string; exp: number }> {
  const ttl = Math.min(payload.ttlSeconds ?? BRIDGE_MAX_TTL_SECONDS, BRIDGE_MAX_TTL_SECONDS);
  const now = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();
  const body: BridgePayload = {
    iss: "clarivi",
    aud: "lovelib",
    sub: payload.sub,
    email: payload.email,
    iat: now,
    exp: now + ttl,
    jti,
  };
  const header = b64urlEncodeStr(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const p = b64urlEncodeStr(JSON.stringify(body));
  const sig = b64urlEncode(await hmac(secret, `${header}.${p}`));
  return { token: `${header}.${p}.${sig}`, jti, exp: body.exp };
}

export async function verifyBridgeToken(
  token: string,
  secret: string,
): Promise<BridgePayload> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("malformed_token");
  const [h, p, s] = parts;
  const header = JSON.parse(b64urlToString(h));
  if (header.alg !== "HS256") throw new Error("invalid_alg");
  const expected = await hmac(secret, `${h}.${p}`);
  if (!timingEq(expected, b64urlToBytes(s))) throw new Error("invalid_signature");
  const body = JSON.parse(b64urlToString(p)) as BridgePayload;
  const now = Math.floor(Date.now() / 1000);
  if (body.iss !== "clarivi") throw new Error("bad_issuer");
  if (body.aud !== "lovelib") throw new Error("bad_audience");
  if (typeof body.exp !== "number" || body.exp < now) throw new Error("token_expired");
  if (typeof body.iat !== "number" || body.iat > now + BRIDGE_CLOCK_SKEW) throw new Error("iat_in_future");
  if (body.exp - body.iat > BRIDGE_MAX_TTL_SECONDS) throw new Error("ttl_too_long");
  if (!body.jti || body.jti.length < 8) throw new Error("missing_jti");
  if (!body.sub || !body.email) throw new Error("missing_subject");
  return body;
}
