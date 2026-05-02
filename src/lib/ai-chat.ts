import { supabase } from "@/integrations/supabase/client";
import { isRateLimited } from "@/lib/rate-limit";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIChatResponse {
  message: string;
  suggestions: string[];
  phase_current: number;
  phase_progress: number;
  overall_progress: number;
  extracted_data: Record<string, unknown>;
  sentiment: string;
  ready_for_next_phase: boolean;
  discovery_complete?: boolean;
  marketing_audit_suggested?: boolean;
  marketing_audit_reason?: string | null;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  projectId: string,
  conversationId?: string
): Promise<AIChatResponse> {
  // Rate limit: max 20 AI messages per minute per project
  if (isRateLimited(`ai-chat:${projectId}`, { maxCalls: 20, windowMs: 60_000 })) {
    throw new Error("Trop de messages envoyés. Veuillez patienter quelques instants.");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error("Session expirée. Merci de vous reconnecter.");
  }

  const { data, error } = await supabase.functions.invoke("ai-chat", {
    body: { messages, projectId, conversationId },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to send message");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as AIChatResponse;
}
