// Mock signed-webhook caller for paperclip-webhook.
//
// Usage:
//   PAPERCLIP_WEBHOOK_SECRET=xxx \
//   SUPABASE_FUNCTIONS_URL=https://<ref>.supabase.co/functions/v1 \
//     deno run --allow-env --allow-net supabase/functions/scripts/mock-webhook.ts \
//       --job=<uuid> --status=paperclip_processing [--event=status_update]
//
// Flags:
//   --job=<uuid>          required
//   --status=<status>     optional new_status
//   --event=<event_type>  default: status_update
//   --error=<msg>         sets last_error
//   --doc                 attaches a fake admin document

import { hmacSha256Hex } from "../_shared/hmac.ts";

function arg(name: string, def?: string): string | undefined {
  const hit = Deno.args.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.split("=").slice(1).join("=");
  return Deno.args.includes(`--${name}`) ? "true" : def;
}

const secret = Deno.env.get("PAPERCLIP_WEBHOOK_SECRET");
const base = Deno.env.get("SUPABASE_FUNCTIONS_URL");
if (!secret) throw new Error("PAPERCLIP_WEBHOOK_SECRET env required");
if (!base) throw new Error("SUPABASE_FUNCTIONS_URL env required (https://<ref>.supabase.co/functions/v1)");

const jobId = arg("job");
if (!jobId) throw new Error("--job=<uuid> required");

const body: Record<string, unknown> = {
  job_id: jobId,
  event_type: arg("event", "status_update"),
};
const newStatus = arg("status");
if (newStatus) body.new_status = newStatus;
const err = arg("error");
if (err) body.error = err;
if (arg("doc") === "true") {
  body.documents = [{
    doc_type: "mock_report",
    title: "Mock report",
    storage_path: `mocks/${jobId}.pdf`,
    visibility: "admin",
    is_validated: false,
  }];
}

const rawBody = JSON.stringify(body);
const ts = Math.floor(Date.now() / 1000).toString();
const nonce = crypto.randomUUID();
const sig = await hmacSha256Hex(secret, `${ts}.${nonce}.${rawBody}`);

const url = `${base.replace(/\/$/, "")}/paperclip-webhook`;
const resp = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-webhook-timestamp": ts,
    "x-webhook-nonce": nonce,
    "x-webhook-signature": sig,
  },
  body: rawBody,
});
const text = await resp.text();
console.log(`HTTP ${resp.status}`);
console.log(text);
