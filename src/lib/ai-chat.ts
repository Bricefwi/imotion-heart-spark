import { supabase } from "@/integrations/supabase/client";

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
  extracted_data: any;
  sentiment: string;
  ready_for_next_phase: boolean;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  projectId: string,
  conversationId?: string
): Promise<AIChatResponse> {
  const { data, error } = await supabase.functions.invoke("ai-chat", {
    body: { messages, projectId, conversationId },
  });

  if (error) {
    throw new Error(error.message || "Failed to send message");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as AIChatResponse;
}
