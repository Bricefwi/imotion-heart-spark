// HMAC-SHA256 helpers shared across incoming webhooks (e.g. marketing).
// Signature input: `${timestamp}.${nonce}.${rawBody}`

export async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60;

export type SignatureCheck =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function verifySignedRequest(opts: {
  secret: string;
  signature: string | null;
  timestamp: string | null;
  nonce: string | null;
  rawBody: string;
}): Promise<SignatureCheck> {
  const { secret, signature, timestamp, nonce, rawBody } = opts;
  if (!signature || !timestamp || !nonce) {
    return { ok: false, status: 401, error: "Missing signature headers" };
  }
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return { ok: false, status: 401, error: "Invalid timestamp" };
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > MAX_TIMESTAMP_SKEW_SECONDS) {
    return { ok: false, status: 401, error: "Timestamp outside allowed window" };
  }
  if (nonce.length < 8 || nonce.length > 128) {
    return { ok: false, status: 401, error: "Invalid nonce" };
  }
  const expected = await hmacSha256Hex(secret, `${ts}.${nonce}.${rawBody}`);
  if (!timingSafeEqualHex(expected, signature.toLowerCase())) {
    return { ok: false, status: 401, error: "Invalid signature" };
  }
  return { ok: true };
}
