// Centralised paperclip_jobs status taxonomy + transition guards.
//
// Two namespaces are accepted on the inbound webhook:
//   - EXTERNAL (Paperclip): "processing" | "needs_validation" | "ready" | "completed" | "failed"
//   - INTERNAL (Supabase):  "paperclip_processing" | "waiting_human_validation" | "proposal_ready" | "failed"
//
// In production, Paperclip MUST emit EXTERNAL statuses.
// In mock mode, INTERNAL statuses are also accepted to make manual tests easier.
//
// Human-only statuses (never settable from webhook): accepted, rejected, proposal_sent.

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

export const HUMAN_ONLY_STATUSES = new Set<PaperclipStatus>([
  "accepted",
  "rejected",
  "proposal_sent",
]);

export const TERMINAL_STATUSES = new Set<PaperclipStatus>([
  "accepted",
  "rejected",
  "cancelled",
]);

export const EXTERNAL_STATUSES = [
  "processing",
  "needs_validation",
  "ready",
  "completed",
  "failed",
] as const;
export type ExternalStatus = (typeof EXTERNAL_STATUSES)[number];
const EXTERNAL_SET = new Set<string>(EXTERNAL_STATUSES);

/**
 * Map external (Paperclip) status → internal (Supabase) status.
 * Special case: "completed" → "waiting_human_validation" if
 * requires_human_validation === true, otherwise "proposal_ready".
 * NEVER maps to "accepted".
 */
export function mapExternalToInternal(
  external: string,
  requiresHumanValidation: boolean,
): PaperclipStatus | null {
  switch (external) {
    case "processing":       return "paperclip_processing";
    case "needs_validation": return "waiting_human_validation";
    case "ready":            return "proposal_ready";
    case "failed":           return "failed";
    case "completed":
      return requiresHumanValidation ? "waiting_human_validation" : "proposal_ready";
    default:                 return null;
  }
}

export type ResolvedStatus =
  | { ok: true; internal: PaperclipStatus | null; namespace: "external" | "internal" | "none" }
  | { ok: false; status: number; error: string };

/**
 * Resolve an inbound webhook status into the internal namespace, applying all
 * business rules. Returns 422 for unknown / human-only / illegal.
 */
export function resolveWebhookStatus(
  rawStatus: string | null,
  requiresHumanValidation: boolean,
): ResolvedStatus {
  if (rawStatus === null) {
    return { ok: true, internal: null, namespace: "none" };
  }
  // Internal namespace first (allowed for mock + admin replays).
  if (isPaperclipStatus(rawStatus)) {
    if (HUMAN_ONLY_STATUSES.has(rawStatus)) {
      return {
        ok: false,
        status: 422,
        error: `Status "${rawStatus}" is reserved to human admin action`,
      };
    }
    return { ok: true, internal: rawStatus, namespace: "internal" };
  }
  // External namespace mapping.
  if (EXTERNAL_SET.has(rawStatus)) {
    const internal = mapExternalToInternal(rawStatus, requiresHumanValidation);
    if (!internal) {
      return { ok: false, status: 422, error: `Unknown external status: ${rawStatus}` };
    }
    return { ok: true, internal, namespace: "external" };
  }
  return { ok: false, status: 422, error: `Unknown status: ${rawStatus}` };
}

export type TransitionCheck =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * Final guard after status resolution: refuses transitions when the job is
 * already in a terminal state.
 */
export function canApplyTransition(
  current: string,
  nextInternal: PaperclipStatus | null,
): TransitionCheck {
  if (nextInternal === null) return { ok: true };
  if (isPaperclipStatus(current) && TERMINAL_STATUSES.has(current)) {
    return {
      ok: false,
      status: 422,
      error: `Job is in terminal state "${current}", cannot transition`,
    };
  }
  return { ok: true };
}
