import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, type, stream: shouldStream } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await anonClient.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get project with client info
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("*, client:profiles!projects_client_id_fkey(*)")
      .eq("id", projectId)
      .single();

    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to find a template for this type
    const docType = type || "cdc";
    const { data: template } = await supabase
      .from("templates")
      .select("*")
      .eq("type", docType)
      .eq("is_active", true)
      .eq("is_default", true)
      .single();

    const client = project.client;
    const discoveryData = project.discovery_data || {};
    const prompt = template
      ? buildPromptFromTemplate(template, project, client, discoveryData)
      : buildDocumentPrompt(docType, project, client, discoveryData);

    // Streaming mode
    if (shouldStream) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Tu es un expert en rédaction de documents professionnels pour agences digitales. Tu génères des documents structurés en Markdown." },
            { role: "user", content: prompt },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI stream error:", response.status, t);
        throw new Error("AI generation failed");
      }

      // Create document record first
      const docName = getDocName(docType, project.name);
      const { data: doc, error: docErr } = await supabase.from("documents").insert({
        project_id: projectId,
        type: docType,
        name: docName,
        description: `Généré automatiquement le ${new Date().toLocaleDateString("fr-FR")}`,
        storage_path: `${projectId}/${docType}_${Date.now()}.md`,
        status: "draft",
        created_by: userData.user.id,
      }).select("id").single();

      if (docErr) throw docErr;

      // Log activity
      await supabase.from("activities").insert({
        user_id: userData.user.id,
        project_id: projectId,
        action: "document",
        description: `${docName} généré pour "${project.name}"`,
      });

      // Stream: prepend document_id then forward SSE
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          // Send document ID as first event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ document_id: doc.id })}\n\n`));

          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let fullContent = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              // Parse SSE chunks to accumulate content
              const lines = chunk.split("\n");
              for (const line of lines) {
                if (line.startsWith("data: ") && line !== "data: [DONE]") {
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    const delta = parsed.choices?.[0]?.delta?.content || "";
                    if (delta) fullContent += delta;
                  } catch { /* skip parse errors */ }
                }
              }
              // Forward raw SSE to client
              controller.enqueue(value);
            }
          } catch (err) {
            console.error("Stream read error:", err);
          }

          // Store final content (upload to storage would go here)
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming mode (existing behavior)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Tu es un expert en rédaction de documents professionnels pour agences digitales. Tu génères des documents structurés en Markdown." },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI generation failed");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    const docName = getDocName(docType, project.name);
    const { data: doc, error: docErr } = await supabase.from("documents").insert({
      project_id: projectId,
      type: docType,
      name: docName,
      description: `Généré automatiquement le ${new Date().toLocaleDateString("fr-FR")}`,
      storage_path: `${projectId}/${docType}_${Date.now()}.md`,
      status: "draft",
      created_by: userData.user.id,
    }).select("id").single();

    if (docErr) throw docErr;

    const statusMap: Record<string, string> = {
      cdc: "cdc_draft",
      proposal: "proposal_sent",
      contract: "contract_pending",
    };
    if (statusMap[docType]) {
      await supabase.from("projects").update({ status: statusMap[docType] }).eq("id", projectId);
    }

    await supabase.from("activities").insert({
      user_id: userData.user.id,
      project_id: projectId,
      action: "document",
      description: `${docName} généré pour "${project.name}"`,
    });

    return new Response(JSON.stringify({ success: true, document_id: doc.id, content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getDocName(type: string, projectName: string): string {
  const names: Record<string, string> = {
    cdc: "Cahier des Charges",
    proposal: "Proposition Commerciale",
    contract: "Contrat de Prestation",
  };
  return `${names[type] || type} - ${projectName}`;
}

function buildPromptFromTemplate(template: any, project: any, client: any, discoveryData: any): string {
  let content = template.content;
  // Replace template variables
  const vars: Record<string, string> = {
    project_name: project.name,
    project_code: project.code || "",
    client_name: client?.full_name || "N/A",
    client_company: client?.company_name || "N/A",
    client_industry: client?.industry || "Non spécifié",
    current_phase: `${project.current_phase}/7`,
    qualification_score: `${project.qualification_score || "N/A"}/5`,
    budget_min: String(project.estimated_budget_min || "?"),
    budget_max: String(project.estimated_budget_max || "?"),
    internal_notes: project.internal_notes || "Aucune",
    discovery_data: JSON.stringify(discoveryData, null, 2),
  };

  for (const [key, value] of Object.entries(vars)) {
    content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  return `À partir du template suivant, génère le document complet en Markdown:\n\n${content}`;
}

function buildDocumentPrompt(type: string, project: any, client: any, discoveryData: any): string {
  const base = `
Projet: ${project.name} (${project.code})
Client: ${client?.full_name || "N/A"} - ${client?.company_name || "N/A"}
Secteur: ${client?.industry || "Non spécifié"}
Phase actuelle: ${project.current_phase}/7
Score qualification: ${project.qualification_score || "N/A"}/5
Budget estimé: ${project.estimated_budget_min || "?"} - ${project.estimated_budget_max || "?"}€
Notes consultant: ${project.internal_notes || "Aucune"}

Données de découverte collectées:
${JSON.stringify(discoveryData, null, 2)}
`;

  if (type === "cdc") {
    return `Génère un Cahier des Charges professionnel complet en Markdown pour ce projet:

${base}

Structure requise:
1. Résumé exécutif
2. Contexte et enjeux
3. Analyse du besoin
4. Positionnement et image de marque
5. Spécifications fonctionnelles (MVP puis V2)
6. Architecture technique recommandée
7. Intégrations requises
8. Planning prévisionnel
9. Budget estimatif (3 options: Essentiel, Recommandé, Premium)
10. Critères de succès
11. Prochaines étapes

Sois professionnel, précis et actionnable. Utilise les données collectées pour personnaliser au maximum.`;
  }

  if (type === "proposal") {
    return `Génère une Proposition Commerciale professionnelle en Markdown:

${base}

Structure: Présentation IMOTION, Compréhension du besoin, Solution proposée (3 options avec prix), Planning, Conditions, Prochaines étapes.`;
  }

  return `Génère un Contrat de Prestation en Markdown:

${base}

Structure: Parties, Objet, Livrables, Délais, Prix et paiement, Obligations, Propriété intellectuelle, Confidentialité, Garantie, Résiliation, Signatures.`;
}
