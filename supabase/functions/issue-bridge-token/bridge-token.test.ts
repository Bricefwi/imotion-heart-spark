// Deno test for the shared HMAC-SHA256 bridge token used between
// Clarivi (issue-bridge-token) and lovelib (consume-bridge-token).
// Validates: round-trip, wrong secret, tampered payload, expired token,
// TTL clamp, malformed token.
//
// Run via supabase--test_edge_functions (no network needed).

import {
  assertEquals,
  assertRejects,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  signBridgeToken,
  verifyBridgeToken,
  BRIDGE_MAX_TTL_SECONDS,
} from "../_shared/bridge-token.ts";

const SECRET = "test-secret-do-not-use-in-prod-0123456789";
const OTHER_SECRET = "another-secret-for-tampering-tests";

Deno.test("round-trip: issued token verifies with same secret", async () => {
  const { token, jti, exp } = await signBridgeToken(
    { sub: "user-123", email: "alice@example.com" },
    SECRET,
  );
  const payload = await verifyBridgeToken(token, SECRET);
  assertEquals(payload.iss, "clarivi");
  assertEquals(payload.aud, "lovelib");
  assertEquals(payload.sub, "user-123");
  assertEquals(payload.email, "alice@example.com");
  assertEquals(payload.jti, jti);
  assertEquals(payload.exp, exp);
  assert(payload.exp - payload.iat <= BRIDGE_MAX_TTL_SECONDS);
});

Deno.test("rejects token signed with a different secret", async () => {
  const { token } = await signBridgeToken(
    { sub: "u", email: "a@b.c" },
    SECRET,
  );
  await assertRejects(
    () => verifyBridgeToken(token, OTHER_SECRET),
    Error,
    "invalid_signature",
  );
});

Deno.test("rejects token with tampered payload", async () => {
  const { token } = await signBridgeToken(
    { sub: "u", email: "a@b.c" },
    SECRET,
  );
  const [h, p, s] = token.split(".");
  // Flip a char in the payload b64url section.
  const tampered = `${h}.${p.slice(0, -1)}${p.slice(-1) === "A" ? "B" : "A"}.${s}`;
  await assertRejects(
    () => verifyBridgeToken(tampered, SECRET),
    Error,
  );
});

Deno.test("TTL is clamped to BRIDGE_MAX_TTL_SECONDS", async () => {
  const { token } = await signBridgeToken(
    { sub: "u", email: "a@b.c", ttlSeconds: 99999 },
    SECRET,
  );
  const payload = await verifyBridgeToken(token, SECRET);
  assert(payload.exp - payload.iat <= BRIDGE_MAX_TTL_SECONDS);
});

Deno.test("rejects expired token", async () => {
  // Forge a token with exp in the past by mocking Date.now during sign.
  const realNow = Date.now;
  try {
    Date.now = () => (realNow() - 120_000); // pretend we're 2 min ago
    const { token } = await signBridgeToken(
      { sub: "u", email: "a@b.c", ttlSeconds: 30 },
      SECRET,
    );
    Date.now = realNow;
    await assertRejects(
      () => verifyBridgeToken(token, SECRET),
      Error,
      "token_expired",
    );
  } finally {
    Date.now = realNow;
  }
});

Deno.test("rejects malformed token", async () => {
  await assertRejects(
    () => verifyBridgeToken("not.a.jwt.format.x", SECRET),
    Error,
    "malformed_token",
  );
  await assertRejects(
    () => verifyBridgeToken("only-one-part", SECRET),
    Error,
    "malformed_token",
  );
});

Deno.test("interop: signed here, verified by independent verifier with same secret", async () => {
  // Simulate lovelib re-implementing verification with raw WebCrypto.
  const { token } = await signBridgeToken(
    { sub: "user-xyz", email: "bob@example.com" },
    SECRET,
  );
  const [h, p, s] = token.split(".");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const sigBytes = Uint8Array.from(
    atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)),
    (c) => c.charCodeAt(0),
  );
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    new TextEncoder().encode(`${h}.${p}`),
  );
  assert(ok, "lovelib-side verification must accept Clarivi-issued token");
});
