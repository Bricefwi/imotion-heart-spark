// supabase/functions/extractor/index.ts
// EXTRACTOR — Parse entités d'un message utilisateur libre (Haiku, rapide)
import { serve } from "jsr:@std/http/server";
import { runAgent, supabaseAdmin, optionsResponse, jsonResponse, errorResponse } from "../_shared/agent-runner.ts";
import { PROMPTS } from "../_shared/agents/prompts.ts";

interface RequestBody {
  audit_id: string;
  user_message: string;
  phase: number;
  expected_fields: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const body: RequestBody = await req.json();

    if (!body.audit_id || !body.user_message) {
      return errorResponse("audit_id and user_message are required", 400);
    }

    const result = await runAgent({
      agent: "EXTRACTOR",
      systemPrompt: PROMPTS.EXTRACTOR,
      userMessage: body.user_message,
      context: {
        phase: body.phase,
        expected_fields: body.expected_fields,
      },
      model: "claude-haiku-4-5-20251001",
      temperature: 0.2,
      maxTokens: 1000,
    });

    // Persister dans audit_messages si extraction réussie
    if (result.status !== "error") {
      const sb = supabaseAdmin();
      await sb.from("audit_messages").insert({
        audit_id: body.audit_id,
        role: "system",
        content: JSON.stringify(result.extracted_data ?? {}),
        agent_name: "EXTRACTOR",
        phase: body.phase,
        confidence: result.confidence,
        tokens_in: result.tokens_in,
        tokens_out: result.tokens_out,
      });
    }

    return jsonResponse(result);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
