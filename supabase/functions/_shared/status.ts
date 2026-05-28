// Centralised paperclip_jobs status taxonomy + transition guards.

export const PAPERCLIP_STATUSES = [
  "draft",
  "audit_completed",
  "qualified",
  "sent_to_paperclip",
  "paperclip_processing",
  "waiting_human_validation",
  "proposal_ready",
  "proposal_sent",
  "accepted",
  "rejected",
  "cancelled",
  "failed",
] as const;

export type PaperclipStatus = (typeof PAPERCLIP_STATUSES)[number];

const STATUS_SET = new Set<string>(PAPERCLIP_STATUSES);

export function isPaperclipStatus(v: unknown): v is PaperclipStatus {
  return typeof v === "string" && STATUS_SET.has(v);
}

// Statuses that ONLY a human admin action may set (never the webhook).
export const HUMAN_ONLY_STATUSES = new Set<PaperclipStatus>([
  "accepted",
  "rejected",
  "proposal_sent",
]);

// Terminal statuses that should never be moved further by an inbound webhook.
export const TERMINAL_STATUSES = new Set<PaperclipStatus>([
  "accepted",
  "rejected",
  "cancelled",
]);

export type TransitionCheck =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * Webhook-driven transition guard.
 * - Unknown new status → 422
 * - Human-only statuses (accepted/rejected/proposal_sent) → 422
 * - "completed"-like terminal: a "completed" intent must map to
 *   proposal_ready or waiting_human_validation, never accepted.
 * - Already in terminal state (accepted/rejected/cancelled) → 422
 */
export function canWebhookTransition(
  current: string,
  next: string | null,
): TransitionCheck {
  if (next === null) return { ok: true }; // status_update without status change
  if (!isPaperclipStatus(next)) {
    return { ok: false, status: 422, error: `Unknown status: ${next}` };
  }
  if (HUMAN_ONLY_STATUSES.has(next)) {
    return {
      ok: false,
      status: 422,
      error: `Status "${next}" is reserved to human admin action`,
    };
  }
  if (isPaperclipStatus(current) && TERMINAL_STATUSES.has(current)) {
    return {
      ok: false,
      status: 422,
      error: `Job is in terminal state "${current}", cannot transition`,
    };
  }
  return { ok: true };
}
