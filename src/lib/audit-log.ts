import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type AuditAction =
  | "user_role_changed"
  | "project_status_changed"
  | "document_generated"
  | "document_downloaded"
  | "campaign_created"
  | "campaign_sent"
  | "automation_rule_created"
  | "automation_rule_updated"
  | "automation_rule_deleted"
  | "template_created"
  | "template_updated"
  | "template_deleted"
  | "settings_changed"
  | "blog_post_created"
  | "blog_post_updated"
  | "blog_post_deleted"
  | "client_profile_updated";

interface AuditLogEntry {
  action: AuditAction;
  description: string;
  userId?: string;
  projectId?: string;
  importance?: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, Json | undefined>;
}

/**
 * Log an admin operation for audit trail purposes.
 * Writes to the activities table.
 */
export async function logAuditEvent({
  action,
  description,
  userId,
  projectId,
  importance = "medium",
  metadata,
}: AuditLogEntry): Promise<void> {
  try {
    await supabase.from("activities").insert({
      action,
      description,
      user_id: userId,
      project_id: projectId,
      importance,
      metadata: metadata ?? null,
    });
  } catch (err) {
    // Audit logging should never break the main flow
    console.error("Failed to log audit event:", err);
  }
}
