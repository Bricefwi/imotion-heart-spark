import { supabase } from "@/integrations/supabase/client";

type EmailType = "account_confirmation" | "conversation_summary" | "cdc_final" | "document_ready" | "phase_completed";

interface SendEmailParams {
  type: EmailType;
  recipientId?: string;
  recipientEmail?: string;
  projectId?: string;
  metadata?: Record<string, any>;
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: params,
    });

    if (error) {
      console.error("Email sending error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: unknown) {
    console.error("Email sending error:", e);
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
