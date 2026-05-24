import { describe, it, expect, vi } from "vitest";

// Mock supabase before importing
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

import { logAuditEvent } from "@/lib/audit-log";
import { supabase } from "@/integrations/supabase/client";

describe("audit-log", () => {
  it("should call supabase insert with correct data", async () => {
    await logAuditEvent({
      action: "user_role_changed",
      description: "Test audit",
      userId: "user-123",
      importance: "high",
      metadata: { targetUserId: "user-456" },
    });

    expect(supabase.from).toHaveBeenCalledWith("activities");
  });

  it("should not throw on supabase error", async () => {
    vi.mocked(supabase.from).mockReturnValueOnce({
      insert: vi.fn().mockRejectedValue(new Error("DB error")),
    } as unknown as ReturnType<typeof supabase.from>);

    // Should not throw
    await expect(
      logAuditEvent({
        action: "settings_changed",
        description: "Test error handling",
      })
    ).resolves.toBeUndefined();
  });
});
