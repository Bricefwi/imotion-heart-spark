import { describe, it, expect, beforeEach } from "vitest";
import { isRateLimited, remainingCalls } from "@/lib/rate-limit";

describe("rate-limit", () => {
  // Use unique keys per test to avoid cross-contamination
  let key: string;
  beforeEach(() => {
    key = `test-${Math.random()}`;
  });

  it("should allow calls within limit", () => {
    expect(isRateLimited(key, { maxCalls: 5 })).toBe(false);
    expect(isRateLimited(key, { maxCalls: 5 })).toBe(false);
    expect(isRateLimited(key, { maxCalls: 5 })).toBe(false);
  });

  it("should block calls exceeding limit", () => {
    for (let i = 0; i < 3; i++) {
      isRateLimited(key, { maxCalls: 3 });
    }
    expect(isRateLimited(key, { maxCalls: 3 })).toBe(true);
  });

  it("should report remaining calls correctly", () => {
    expect(remainingCalls(key, { maxCalls: 5 })).toBe(5);
    isRateLimited(key, { maxCalls: 5 });
    isRateLimited(key, { maxCalls: 5 });
    expect(remainingCalls(key, { maxCalls: 5 })).toBe(3);
  });

  it("should use separate windows for different keys", () => {
    const keyA = `a-${Math.random()}`;
    const keyB = `b-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      isRateLimited(keyA, { maxCalls: 3 });
    }
    expect(isRateLimited(keyA, { maxCalls: 3 })).toBe(true);
    expect(isRateLimited(keyB, { maxCalls: 3 })).toBe(false);
  });
});
