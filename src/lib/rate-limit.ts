/**
 * Simple client-side rate limiter to prevent abuse of expensive operations.
 * Uses a sliding window counter per action key.
 */

const windows = new Map<string, number[]>();

interface RateLimitOptions {
  /** Maximum number of calls allowed in the window */
  maxCalls: number;
  /** Window size in milliseconds (default: 60000 = 1 minute) */
  windowMs?: number;
}

/**
 * Check if an action is rate limited.
 * Returns true if the action should be BLOCKED.
 */
export function isRateLimited(
  key: string,
  { maxCalls, windowMs = 60_000 }: RateLimitOptions
): boolean {
  const now = Date.now();
  const timestamps = windows.get(key) || [];

  // Remove expired entries
  const valid = timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= maxCalls) {
    windows.set(key, valid);
    return true; // blocked
  }

  valid.push(now);
  windows.set(key, valid);
  return false; // allowed
}

/**
 * Returns remaining calls before hitting the limit.
 */
export function remainingCalls(
  key: string,
  { maxCalls, windowMs = 60_000 }: RateLimitOptions
): number {
  const now = Date.now();
  const timestamps = (windows.get(key) || []).filter((t) => now - t < windowMs);
  return Math.max(0, maxCalls - timestamps.length);
}
