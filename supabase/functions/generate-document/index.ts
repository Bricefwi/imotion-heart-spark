import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getDocName, formatConversationForPrompt, buildPromptFromTemplate } from "./helpers.ts";
import { callMistralAgent, type MistralAgentKey } from "../_shared/mistral-agents.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { projectId, type, stream: shouldStream } = body;
    let { regenerateSection, sectionContext } = body;

    // Input validation & sanitization for prompt injection prevention
    const MAX_SECTION_NAME_LENGTH = 200;
    const MAX_SECTION_CONTEXT_LENGTH = 10000;
    if (regenerateSection && typeof regenerateSection === "string") {
      regenerateSection = regenerateSection.slice(0, MAX_SECTION_NAME_LENGTH).replace(/[<>{}]/g, "");
    }
    if (sectionContext && typeof sectionContext === "string") {
      sectionContext = sectionContext.slice(0, MAX_SECTION_CONTEXT_LENGTH);
    }
    if (projectId && typeof projectId !== "string") {
      return new Response(JSON.stringify({ error: "Invalid projectId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // ─── Authorization: verify user owns the project or is admin/consultant ───
    const userId = userData.user.id;
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (userRoles || []).map((r: { role: string }) => r.role);
    const isAdminOrConsultant = roles.some((r: string) => ["admin", "super_admin", "consultant"].includes(r));
    if (project.client_id !== userId && !isAdminOrConsultant) {
      return new Response(JSON.stringify({ error: "Forbidden: you do not have access to this project" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Section Regeneration Mode ─────────────────────────
    if (regenerateSection && sectionContext !== undefined) {
      const client = project.client;
      const discoveryData = project.discovery_data || {};
      const { data: allMsgs } = await supabase
        .from("messages")
        .select("role, content, phase, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })
        .limit(200);

      const conversationCtx = formatConversationForPrompt(allMsgs || []);
      const docType = type || "cdc";

      const sectionPrompt = `Tu dois UNIQUEMENT régénérer la section suivante d'un document de type "${docType}".

## Section à régénérer : "${regenerateSection}"

## Contenu actuel de cette section (à améliorer) :
${sectionContext}

## Contexte du projet :
- Nom : ${project.name} (Réf. ${project.code})
- Client : ${client?.full_name || "N/A"} — ${client?.company_name || "N/A"}
- Secteur : ${client?.industry || "Non spécifié"}
- Budget : ${project.estimated_budget_min || "?"} - ${project.estimated_budget_max || "?"}€

## Données de découverte :
${JSON.stringify(discoveryData, null, 2)}

## Échanges client (résumé) :
${conversationCtx.substring(0, 3000)}

INSTRUCTIONS :
- Régénère UNIQUEMENT le contenu de cette section, PAS le titre (pas de # en début)
- Améliore la qualité, la précision et le niveau de détail
- Utilise les données réelles du client
- Format Markdown (sous-titres ##/###, listes, tableaux si pertinent)
- Ton professionnel, pas de remplissage`;

      const sectionAiBody = {
        model: "openai/gpt-5",
        messages: [
          { role: "system", content: getSystemPrompt(docType) },
          { role: "user", content: sectionPrompt },
        ],
        stream: false,
      };

      const sectionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(sectionAiBody),
      });

      if (!sectionResponse.ok) {
        const t = await sectionResponse.text();
        console.error("AI section regen error:", sectionResponse.status, t);
        throw new Error("Erreur lors de la régénération de la section");
      }

      const sectionAiResult = await sectionResponse.json();
      const newContent = sectionAiResult.choices?.[0]?.message?.content || "";

      return new Response(JSON.stringify({ success: true, content: newContent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Full Document Generation ─────────────────────────
    const { data: allMessages } = await supabase
      .from("messages")
      .select("role, content, phase, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    // Try to find a template for this type (check new document_templates first, then legacy templates)
    const docType = type || "cdc";
    
    // Check new pricing-aware document_templates table
    const { data: pricingTemplate } = await supabase
      .from("document_templates")
      .select("*")
      .eq("code", docType)
      .eq("is_active", true)
      .single();

    // Check legacy templates table
    const { data: template } = await supabase
      .from("templates")
      .select("*")
      .eq("type", docType)
      .eq("is_active", true)
      .eq("is_default", true)
      .single();

    // Try to fetch current estimate from pricing system
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let estimate: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pricingConfig: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let maintenancePlan: any = null;

    const { data: currentEstimate } = await supabase
      .from("project_estimates")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_current", true)
      .single();

    if (currentEstimate) {
      estimate = currentEstimate;
      
      if (estimate?.project_type_code) {
        const { data: pc } = await supabase
          .from("pricing_config")
          .select("*")
          .eq("code", estimate.project_type_code)
          .single();
        pricingConfig = pc;
      }
      
      if (estimate?.recommended_maintenance_code) {
        const { data: mp } = await supabase
          .from("pricing_maintenance")
          .select("*")
          .eq("code", estimate.recommended_maintenance_code)
          .single();
        maintenancePlan = mp;
      }
    }

    const client = project.client;
    const discoveryData = project.discovery_data || {};
    const conversationContext = formatConversationForPrompt(allMessages || []);

    // Build pricing context if estimate exists
    let pricingContext = "";
    if (estimate) {
      const buildTotal: number = estimate.final_price ?? 0;
      const tvaAmount = Math.round(buildTotal * 0.20);
      const buildTotalTTC = buildTotal + tvaAmount;
      const fmtNum = (n: number | null | undefined) => (n ?? 0).toLocaleString();
      
      pricingContext = `
## DONNÉES TARIFAIRES (du système de pricing)
- **Type de projet** : ${pricingConfig?.name || estimate.project_type_code}
- **Prix de base** : ${fmtNum(estimate.base_price)}€
- **Options sélectionnées** : ${JSON.stringify(estimate.selected_options)}
- **Total options** : ${fmtNum(estimate.options_total)}€
- **Prix final HT** : ${fmtNum(estimate.final_price)}€
- **TVA (20%)** : ${tvaAmount.toLocaleString()}€
- **Prix final TTC** : ${buildTotalTTC.toLocaleString()}€
- **Durée estimée** : ${estimate.duration_weeks_min}-${estimate.duration_weeks_max} semaines
- **Complexité** : ${estimate.complexity_score}/5
- **Forfait maintenance recommandé** : ${maintenancePlan?.name || 'Non défini'} (${maintenancePlan?.monthly_price || 0}€/mois)
- **Fourchette type** : ${fmtNum(pricingConfig?.price_range_min)}€ - ${pricingConfig?.price_range_max?.toLocaleString() || 'Sur devis'}€
- **Échelonnement** : Acompte 30% (${Math.round(buildTotal * 0.30)}€), Maquettes 20% (${Math.round(buildTotal * 0.20)}€), Recette 35% (${Math.round(buildTotal * 0.35)}€), Production 15% (${Math.round(buildTotal * 0.15)}€)
`;
    }

    // ─── Enrichissement agents Mistral (savant mélange : skip silencieux si non configurés) ───
    // STRATOS analyse la stratégie pour les docs de cadrage, FINANCIX challenge le chiffrage
    // pour les docs financiers. Leur analyse est injectée dans le contexte du prompt final.
    const ENRICHMENT_AGENTS: Record<string, { agent: MistralAgentKey; label: string; brief: string }> = {
      cdc: { agent: "stratos", label: "ANALYSE STRATÉGIQUE STRATOS", brief: "Analyse la stratégie business de ce projet : positionnement, enjeux hiérarchisés, opportunités de différenciation, risques marché. Sois factuel et synthétique (max 600 mots)." },
      conseil_technique: { agent: "stratos", label: "ANALYSE STRATÉGIQUE STRATOS", brief: "Analyse les enjeux stratégiques et le ROI attendu de ce projet pour orienter les choix techniques (max 500 mots)." },
      proposal: { agent: "financix", label: "ANALYSE FINANCIÈRE FINANCIX", brief: "Analyse la cohérence budgétaire de cette proposition : structure de prix, échelonnement, risques financiers, arguments de valeur (max 500 mots)." },
      devis: { agent: "financix", label: "ANALYSE FINANCIÈRE FINANCIX", brief: "Vérifie la cohérence du chiffrage : postes, marges implicites, conditions de paiement, conformité commerciale française (max 500 mots)." },
      pricing: { agent: "financix", label: "ANALYSE FINANCIÈRE FINANCIX", brief: "Analyse le chiffrage proposé et suggère une structure tarifaire en 3 options compétitive (max 500 mots)." },
      contrat: { agent: "juridix", label: "ANALYSE JURIDIQUE JURIDIX", brief: "Identifie les clauses sensibles et points de vigilance juridiques pour ce contrat de prestation numérique : responsabilité, propriété intellectuelle, RGPD, clause pénale, conditions de résiliation. Cite les articles du Code civil pertinents (max 600 mots)." },
      contract_fr: { agent: "juridix", label: "ANALYSE JURIDIQUE JURIDIX", brief: "Identifie les clauses sensibles et points de vigilance juridiques pour ce contrat de prestation numérique : responsabilité, propriété intellectuelle, RGPD, clause pénale, conditions de résiliation. Cite les articles du Code civil pertinents (max 600 mots)." },
      pv_reception: { agent: "juridix", label: "ANALYSE JURIDIQUE JURIDIX", brief: "Liste les points juridiques à sécuriser dans ce PV de réception : opposabilité, réserves, garantie de conformité, transfert de propriété des livrables, délais de recours (max 500 mots)." },
      build_prompts: { agent: "pixel", label: "ANALYSE TECHNIQUE PIXEL", brief: "Propose l'architecture de build optimale pour ce projet : stack précise, découpage en composants, schéma de données, points techniques critiques et pièges à éviter pour un build IA (Lovable/Cursor). Sois concret et actionnable (max 600 mots)." },
      tech_recommendation: { agent: "pixel", label: "ANALYSE TECHNIQUE PIXEL", brief: "Analyse les choix techniques optimaux pour ce projet : comparaison no-code/low-code/custom, stack recommandée avec justifications, risques techniques (max 600 mots)." },
      invoice: { agent: "financix", label: "ANALYSE FINANCIÈRE FINANCIX", brief: "Vérifie la conformité de cette facture : mentions légales obligatoires (art. L441-9 Code de commerce), calcul TVA, conditions de paiement, cohérence avec le devis/contrat associé. Signale les omissions critiques (max 400 mots)." },
    };

    let agentContext = "";
    const enrichment = ENRICHMENT_AGENTS[docType];
    if (enrichment) {
      const agentBrief = `${enrichment.brief}

## Projet : ${project.name}
- Client : ${client?.company_name || client?.full_name || "N/A"} — Secteur : ${client?.industry || "Non spécifié"}
- Budget : ${project.estimated_budget_min || "?"} - ${project.estimated_budget_max || "?"}€
## Données de découverte :
${JSON.stringify(discoveryData).slice(0, 4000)}
## Échanges client (extrait) :
${conversationContext.slice(0, 4000)}${pricingContext}`;

      const agentResult = await callMistralAgent(enrichment.agent, [{ role: "user", content: agentBrief }], { maxTokens: 2000, timeoutMs: 45_000 });
      if (agentResult) {
        agentContext = `

## ${enrichment.label} (agent expert — à exploiter dans les sections pertinentes, sans le citer comme source)
${agentResult.content}
`;
      }
    }

    const activeTemplate = pricingTemplate ?? template;
    const fullContext = conversationContext + pricingContext + agentContext;
    const prompt = activeTemplate
      ? buildPromptFromTemplate(activeTemplate, project, client, discoveryData, fullContext)
      : buildDocumentPrompt(docType, project, client, discoveryData, fullContext);

    // Common AI call setup
    const aiBody = {
      model: "openai/gpt-5",
      messages: [
        { role: "system", content: getSystemPrompt(docType) },
        { role: "user", content: prompt },
      ],
      stream: !!shouldStream,
    };

    const aiHeaders = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    };

    if (shouldStream) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST", headers: aiHeaders, body: JSON.stringify(aiBody),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI stream error:", response.status, t);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Le service IA est temporairement indisponible pour cause de crédits ou de facturation. Réessayez plus tard." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI generation failed");
      }

      const docName = getDocName(docType, project.name);
      const { data: doc, error: docErr } = await supabase.from("documents").insert({
        project_id: projectId, type: docType, name: docName,
        description: `Généré automatiquement le ${new Date().toLocaleDateString("fr-FR")}`,
        storage_path: `${projectId}/${docType}_${Date.now()}.md`,
        status: "draft", created_by: userData.user.id,
        requires_signature: docType === "contract" || docType === "proposal",
      }).select("id").single();

      if (docErr) throw docErr;

      // Also save to generated_documents if estimate exists
      if (estimate) {
        await supabase.from("generated_documents").insert({
          project_id: projectId,
          estimate_id: estimate.id,
          document_type: docType,
          template_code: pricingTemplate ? docType : null,
          content_markdown: "(streaming - content saved after completion)",
          variables_snapshot: { estimate, pricingConfig, maintenancePlan },
          status: "draft",
          requires_signature: docType === "contrat" || docType === "devis",
        });
      }

      await supabase.from("activities").insert({
        user_id: userData.user.id, project_id: projectId,
        action: "document", description: `${docName} généré pour "${project.name}"`,
      });

      // Send CDC email notification (streaming path — fire-and-forget, non-blocking)
      if (docType === "cdc" && client?.email) {
        const projectUrl = `https://imotion-conseils.fr/client/documents/${doc.id}`;
        supabase.functions.invoke("send-transactional-email", {
          body: {
            template: "cdc_ready",
            to: client.email,
            data: {
              clientName: client.full_name || "Client",
              projectName: project.name,
              documentUrl: projectUrl,
            },
          },
        }).catch((err: unknown) => console.error("Failed to send CDC email (streaming):", err));
      }

      // Send invoice email notification (streaming path — fire-and-forget, non-blocking)
      if (docType === "invoice" && client?.email) {
        const invoiceUrl = `https://imotion-conseils.fr/client/documents/${doc.id}`;
        supabase.functions.invoke("send-transactional-email", {
          body: {
            template: "invoice_issued",
            to: client.email,
            data: {
              clientName: client.full_name || "Client",
              projectName: project.name,
              documentUrl: invoiceUrl,
            },
          },
        }).catch((err: unknown) => console.error("Failed to send invoice email (streaming):", err));
      }

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ document_id: doc.id })}\n\n`));
          const reader = response.body!.getReader();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } catch (err) {
            console.error("Stream read error:", err);
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
      });
    }

    // Non-streaming mode
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST", headers: aiHeaders, body: JSON.stringify(aiBody),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Le service IA est temporairement indisponible pour cause de crédits ou de facturation. Réessayez plus tard." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    if (!content) {
      throw new Error("Le modèle IA n'a retourné aucun contenu. Vérifiez la configuration LOVABLE_API_KEY et réessayez.");
    }

    const docName = getDocName(docType, project.name);
    const { data: doc, error: docErr } = await supabase.from("documents").insert({
      project_id: projectId, type: docType, name: docName,
      description: `Généré automatiquement le ${new Date().toLocaleDateString("fr-FR")}`,
      content_markdown: content,
      storage_path: `${projectId}/${docType}_${Date.now()}.md`,
      status: "draft", created_by: userData.user.id,
      requires_signature: docType === "contract" || docType === "contract_fr" || docType === "proposal" || docType === "pricing" || docType === "pv_reception",
    }).select("id").single();

    if (docErr) throw docErr;

    // Always save to generated_documents for history and cross-reference
    await supabase.from("generated_documents").insert({
      project_id: projectId,
      estimate_id: estimate?.id ?? null,
      document_type: docType,
      template_code: pricingTemplate ? docType : null,
      content_markdown: content,
      variables_snapshot: { estimate, pricingConfig, maintenancePlan },
      status: "draft",
      requires_signature: docType === "contrat" || docType === "devis",
    }).then(({ error }) => {
      if (error) console.warn("generated_documents insert warning:", error.message);
    });

    const statusMap: Record<string, string> = {
      cdc: "cdc_draft", proposal: "proposal_sent", contract: "contract_pending", pv_reception: "delivered",
    };
    if (statusMap[docType]) {
      await supabase.from("projects").update({ status: statusMap[docType] }).eq("id", projectId);
    }

    await supabase.from("activities").insert({
      user_id: userData.user.id, project_id: projectId,
      action: "document", description: `${docName} généré pour "${project.name}"`,
    });

    // Send CDC email notification to client
    if (docType === "cdc" && client?.email) {
      const projectUrl = `https://imotion-conseils.fr/client/documents/${doc.id}`;
      try {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            template: "cdc_ready",
            to: client.email,
            data: {
              clientName: client.full_name || "Client",
              projectName: project.name,
              documentUrl: projectUrl,
            },
          },
        });
        console.log("CDC email sent to", client.email);
      } catch (emailErr) {
        console.error("Failed to send CDC email:", emailErr);
        // Non-blocking: don't fail document generation if email fails
      }
    }

    // Send invoice email notification to client
    if (docType === "invoice" && client?.email) {
      const invoiceUrl = `https://imotion-conseils.fr/client/documents/${doc.id}`;
      supabase.functions.invoke("send-transactional-email", {
        body: {
          template: "invoice_issued",
          to: client.email,
          data: {
            clientName: client.full_name || "Client",
            projectName: project.name,
            documentUrl: invoiceUrl,
          },
        },
      }).catch((emailErr) => console.error("Failed to send invoice email:", emailErr));
    }

    // ─── Guide Technique Opérationnel compagnon du CDC (non-bloquant) ──────────
    // Génère automatiquement un document interne de type guide_technique pour
    // guider l'équipe build étape par étape, enrichi par l'agent PIXEL.
    if (docType === "cdc") {
      generateTechGuide({
        supabase,
        lovableApiKey: LOVABLE_API_KEY,
        projectId,
        project,
        client,
        discoveryData,
        pricingContext,
        stratosContext: agentContext,
        parentDocId: doc.id,
        userId: userData.user.id,
      }).catch((err) => console.error("[cdc-companion] guide technique error:", err));
    }

    return new Response(JSON.stringify({ success: true, document_id: doc.id, content, estimate: estimate ? { final_price: estimate.final_price, duration: `${estimate.duration_weeks_min}-${estimate.duration_weeks_max} semaines` } : null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-document error:", e);
    // Never expose internal error details to clients
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "An internal error occurred while generating the document. Please try again later." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Helpers ─────────────────────────────────────────────

// getDocName is imported from ./helpers.ts

function getSystemPrompt(type: string): string {
  const prompts: Record<string, string> = {
    cdc: `Tu es un directeur de projet digital senior chez IMOTION Creator Studio, agence digitale premium specialisee en solutions no-code et IA. Tu rediges des Cahiers des Charges COMPLETS, exhaustifs, personnalises et immediatement livrables au client.

MISSION CRITIQUE : Tu DOIS exploiter INTEGRALEMENT l'historique des echanges client fourni pour produire un CDC sur-mesure. Le client doit se dire "ils m'ont compris" des la premiere page. Aucune section generique, vide ou superficielle n'est acceptable.

REGLES IMPERATIVES :
- LIRE et EXPLOITER chaque message de l'historique des echanges : besoins, contraintes, inspirations, budget, delais, fonctionnalites, concurrents, preferences visuelles, anecdotes metier
- CITER des verbatim clients entre guillemets pour ancrer le document dans la realite (minimum 5 verbatim)
- DISTINGUER rigoureusement : FAITS CLIENT (issus des echanges) vs PRECONISATIONS IMOTION (tes recommandations d'expert, toujours marquees et justifiees)
- ANTI-HALLUCINATION : ne JAMAIS inventer de noms de concurrents, URLs, statistiques de marche ou citations d'etudes. Si une donnee manque : "[A confirmer lors du cadrage]"
- Les preconisations creatives et techniques (palette de couleurs avec codes HEX, typographies, stack, automatisations, planning) sont ATTENDUES et doivent etre precises et argumentees
- Chaque sous-section DOIT contenir du contenu substantiel et actionnable
- Ton professionnel, strategique, convainquant — ce document sera lu par le decideur client
- Utilise des tableaux Markdown pour les specs, fonctionnalites, KPIs, risques, planning, personas
- Format Markdown avec titres hierarchiques (# ## ### ####)
- NE JAMAIS utiliser d'emojis
- Redige en francais impeccable
- Le prestataire est "IMOTION Creator Studio"
- Site web : www.imotion-conseils.fr
- LONGUEUR CIBLE : 4500-7000 mots — un vrai document de cadrage professionnel de 20+ pages`,

    devis: `Tu es le directeur commercial senior d'IMOTION Creator Studio, agence digitale premium specialisee en solutions no-code et IA. Tu rediges des devis detailles, professionnels, competitifs et conformes au droit commercial francais.

REGLES DE REDACTION :
- Le devis doit etre juridiquement valide et conforme au Code de commerce
- Chaque ligne doit etre justifiable et detaillee
- Inclure systematiquement : TVA, conditions de paiement, validite, penalites de retard
- Presenter les phases BUILD et RUN separement
- Proposer un echelonnement de paiement clair
- Redige en francais impeccable, ton professionnel et rassurant
- NE JAMAIS utiliser d'emojis
- Le prestataire est "IMOTION Creator Studio"
- SIRET: XXX XXX XXX 000XX | RCS Paris B XXX XXX XXX | Capital: 10 000 euros
- TVA: FR XX XXX XXX XXX`,

    contrat: `Tu es un juriste specialise en droit du numerique et droit des contrats francais, travaillant pour IMOTION Creator Studio. Tu rediges des contrats de prestation de services numeriques conformes au droit francais, protecteurs pour le prestataire tout en etant equilibres.

REGLES JURIDIQUES IMPERATIVES :
- Conforme au Code civil francais (articles 1101 et suivants)
- Conforme au RGPD (Reglement UE 2016/679)
- Conforme a la loi pour une Republique numerique (2016)
- Clauses de limitation de responsabilite conformes a la jurisprudence
- Clause penale conforme a l'article 1231-5 du Code civil
- Redige en francais juridique precis mais lisible
- NE JAMAIS utiliser d'emojis
- Le prestataire est "IMOTION Creator Studio" (SAS)
- SIRET: XXX XXX XXX 000XX | RCS Paris B XXX XXX XXX | Capital: 10 000 euros`,

    tech_recommendation: `Tu es un architecte technique senior et CTO d'IMOTION Creator Studio, agence digitale premium. Tu maitrises parfaitement l'ecosysteme no-code, low-code et code. Tu coordonnes une equipe multi-agent pour repondre aux besoins du CDC client.

REGLES :
- Recommande les outils les PLUS ADAPTES au projet
- Justifie chaque choix technique avec des arguments concrets (ROI, cout, maintenabilite, scalabilite)
- Fournis un prompt technique COMPLET et pret a l'emploi pour chaque outil recommande
- Inclus une section CONSEIL A L'ADMINISTRATEUR avec recommandations internes
- Inclus un PROMPT MULTI-AGENT ORCHESTRE pour la realisation du projet
- Pense ROI, maintenabilite, scalabilite et budget client
- Redige en francais technique mais comprehensible
- NE JAMAIS utiliser d'emojis`,

    pricing: `Tu es le directeur commercial senior d'IMOTION Creator Studio specialise dans le chiffrage de projets digitaux. Tu connais les TJM du marche francais et tu construis des devis detailles, rentables et competitifs.

REGLES :
- Chiffrage realiste base sur les TJM marche francais 2024-2026
- Chaque ligne justifiable aupres du client
- Inclus TOUJOURS une phase de tests/QA
- Presente 3 options tarifaires (Essentiel, Recommande, Premium)
- Detaille conditions de paiement et garanties
- Redige en francais professionnel
- NE JAMAIS utiliser d'emojis`,

    contract_fr: `Tu es un juriste specialise en droit du numerique chez IMOTION Creator Studio. Tu rediges des contrats conformes au droit francais, protecteurs pour le prestataire tout en etant equilibres.

REGLES JURIDIQUES :
- Conforme au Code civil francais (articles 1101 et suivants)
- Conforme au RGPD (Reglement UE 2016/679)
- Clauses de limitation de responsabilite conformes a la jurisprudence
- Clause penale conforme a l'article 1231-5 du Code civil
- Redige en francais juridique precis mais lisible
- NE JAMAIS utiliser d'emojis`,

    pv_reception: `Tu es un directeur de projet digital senior et juriste chez IMOTION Creator Studio. Tu rediges des Proces-Verbaux de Reception conformes au droit francais, exhaustifs et juridiquement opposables.

REGLES JURIDIQUES ET PROFESSIONNELLES :
- Conforme aux articles 1792 et suivants du Code civil (reception des travaux)
- Conforme a la loi pour la Confiance dans l'Economie Numerique (LCEN)
- Conforme au RGPD pour la partie donnees personnelles
- Reference obligatoire au Cahier des Charges et au Contrat associes
- Chaque livrable doit etre verifie point par point selon le CDC
- La conformite doit etre attestee par des tests documentables
- Le PV doit etre signe par les deux parties pour etre opposable
- Redige en francais juridique precis mais lisible
- NE JAMAIS utiliser d'emojis
- Le prestataire est "IMOTION Creator Studio" (SAS)`,

    conseil_technique: `Tu es un CTO / Directeur Technique senior chez IMOTION Creator Studio, agence digitale premium specialisee en solutions no-code, low-code et IA. Tu produis des livrables de conseil technique strategique pour les clients et l'equipe interne.

REGLES :
- Analyse approfondie des besoins techniques a partir du CDC et de la decouverte
- Recommandations justifiees par des arguments concrets (ROI, cout, maintenabilite, scalabilite, time-to-market)
- Compare systematiquement les approches no-code, low-code et code custom
- Inclus des estimations de cout (TCO sur 12 mois) et de delai
- Fournis un planning de realisation detaille avec jalons
- Identifie les profils necessaires avec TJM marche francais
- Propose les outils IA/LLM les plus adaptes pour assister la realisation
- Redige en francais technique mais comprehensible
- NE JAMAIS utiliser d'emojis`,

    build_prompts: `Tu es un prompt engineer expert et architecte IA senior chez IMOTION Creator Studio. Tu maitrises Claude (Anthropic), GPT (OpenAI), Gemini (Google), Lovable, Cursor, Bolt, V0 et tous les outils de dev assistes par IA. Tu crees des prompts de build IMMEDIATEMENT utilisables, ultra-detailles et professionnels.

REGLES :
- Chaque prompt doit etre COMPLET et auto-suffisant (un developpeur ou un outil IA doit pouvoir demarrer sans question)
- Inclure : architecture, stack, schema BDD, composants, design system, integrations, auth, RLS
- Adapter le prompt au format et aux conventions de l'outil cible (Lovable, Cursor, Claude, etc.)
- Structurer en sections claires : contexte, objectifs, specs techniques, composants, base de donnees, design
- Inclure des instructions de style (couleurs hex, typos, border-radius, animations)
- Inclure un prompt d'orchestration multi-agent pour les projets complexes
- Chaque prompt doit referencer le CDC et les donnees client reelles
- Redige en francais technique
- NE JAMAIS utiliser d'emojis`,

    invoice: `Tu es le directeur financier et comptable d'IMOTION Creator Studio, agence digitale premium (SAS). Tu rediges des factures conformes au droit commercial francais et aux obligations comptables strictes.

REGLES JURIDIQUES ET COMPTABLES IMPERATIVES :
- Mentions OBLIGATOIRES (art. L441-9 Code de commerce) : numero de facture sequentiel unique, date d'emission, identite complete prestataire (denomination, adresse, SIRET, RCS, numero TVA intracom), identite complete client (nom/denomination, adresse, SIRET si B2B), description precise des prestations, prix unitaires HT, taux TVA (20% standard), montant TVA, total TTC, modalites de reglement
- Numero de facture : format FAC-AAAA-NNNN — obligatoirement unique et sequentiel
- Delai de paiement par defaut : 30 jours nets a compter de la date de facture (art. L441-10 Code de commerce)
- Penalites de retard : taux de refinancement BCE + 10 points, exigibles des le lendemain de l'echeance sans relance prealable + indemnite forfaitaire de 40 euros (art. D441-5)
- Indiquer "TVA non applicable, art. 293B CGI" si micro-entreprise (sinon TVA 20%)
- NE JAMAIS inventer de SIRET, RCS, TVA ou coordonnees bancaires
- Redige en francais comptable et juridique precis
- NE JAMAIS utiliser d'emojis
- Prestataire : "IMOTION Creator Studio" (SAS) — SIRET: [A RENSEIGNER] | RCS Paris B [A RENSEIGNER] | Capital: 10 000 euros | TVA: FR [A RENSEIGNER]
- STRUCTURE OBLIGATOIRE :
  1. En-tete : coordonnees completes prestataire (gauche) + client (droite)
  2. Bloc facture : "FACTURE N° FAC-AAAA-NNNN" + date d'emission + date d'echeance
  3. Reference : numero devis/contrat associe
  4. Tableau des prestations (designation | quantite | prix unit. HT | montant HT)
  5. Total HT | TVA 20% | Total TTC
  6. Echeancier si paiement fractionne (acompte / intermediaire / solde avec montants et dates)
  7. Modalites de reglement (virement, cheque, IBAN/BIC si connu — sinon "[IBAN A RENSEIGNER]")
  8. Mentions legales penalites de retard + indemnite 40 euros
  9. Mentions finales : "Merci de votre confiance" — nom, qualite et signature autorisee`,

    guide_technique: `Tu es le CTO d'IMOTION Creator Studio. Tu rediges le Guide Technique Operationnel — le document interne qui permet a l'equipe de livrer exactement ce qui a ete promis dans le CDC. Ce guide est POUR L'EQUIPE BUILD, pas pour le client.

MISSION : transformer le CDC et les analyses agents en feuille de route technique immediatement actionnable.

REGLES :
- Chaque outil mentionne doit avoir ses etapes de configuration (pas de "configurer X" sans dire COMMENT)
- Chaque prompt fourni doit etre COMPLET et pret a copier-coller dans Lovable, Cursor ou Claude
- Identifier explicitement les risques techniques et les points de blocage potentiels
- Donner la sequence de build DANS L'ORDRE : on ne configure pas l'auth avant la BDD, etc.
- Chaque etape a un critere de validation clair ("cette etape est terminee quand...")
- Mentionner les couts IA et les quotas a surveiller
- Redige en francais technique, ton d'expert interne
- NE JAMAIS utiliser d'emojis
- STRUCTURE OBLIGATOIRE :
  1. Synthese technique du besoin (3-5 lignes)
  2. Stack retenue et justifications
  3. Outils a deployer (tableau : outil / usage / etapes de configuration)
  4. Prompts de build (section par section, prets a l'emploi)
  5. Schema de donnees (tables et relations cles)
  6. Sequence d'execution (jalons avec criteres de validation)
  7. Points d'attention et pieges a eviter
  8. Checklist de recette avant PV de reception`,
  };


  return prompts[type] || `Tu es un expert en redaction de documents professionnels pour IMOTION Creator Studio, agence digitale premium. Tu generes des documents structures et prets a l'envoi en Markdown. Redige en francais impeccable. NE JAMAIS utiliser d'emojis.`;
}

// formatConversationForPrompt is imported from ./helpers.ts

// buildPromptFromTemplate is imported from ./helpers.ts

function buildDocumentPrompt(type: string, project: Record<string, unknown>, client: Record<string, unknown> | null, discoveryData: Record<string, unknown>, conversationContext: string): string {
  // Extract preferences (social links, additional data) from client profile
  const prefs: Record<string, unknown> = (client?.preferences && typeof client.preferences === "object" && !Array.isArray(client.preferences))
    ? client.preferences as Record<string, unknown>
    : {};

  const base = `
## INFORMATIONS PROJET
- **Nom** : ${project.name} (Réf. ${project.code})
- **Phase actuelle** : ${project.current_phase}/7
- **Score qualification** : ${project.qualification_score || "N/A"}/5
- **Budget estimé** : ${project.estimated_budget_min || "?"} - ${project.estimated_budget_max || "?"}€
- **Deadline souhaitée** : ${project.desired_deadline || "Non définie"}
- **Notes internes** : ${project.internal_notes || "Aucune"}

## INFORMATIONS CLIENT COMPLÈTES
- **Nom complet** : ${client?.full_name || "N/A"}
- **Entreprise** : ${client?.company_name || "N/A"}
- **Fonction** : ${client?.company_role || "Non renseignée"}
- **Secteur d'activité** : ${client?.industry || "Non spécifié"}
- **Taille entreprise** : ${client?.company_size || "Non renseignée"}
- **Téléphone** : ${client?.phone || "Non renseigné"}
- **Email** : ${client?.email || "N/A"}
- **Site web actuel** : ${client?.website || "Aucun"}
- **LinkedIn** : ${prefs.social_linkedin || discoveryData.social_linkedin || "Non renseigné"}
- **Instagram** : ${prefs.social_instagram || discoveryData.social_instagram || "Non renseigné"}
- **Facebook** : ${prefs.social_facebook || discoveryData.social_facebook || "Non renseigné"}

## DONNÉES DE DÉCOUVERTE STRUCTURÉES
${JSON.stringify(discoveryData, null, 2)}

## HISTORIQUE COMPLET DES ÉCHANGES CLIENT
${conversationContext}
`;

  if (type === "cdc") {
    return `Genere un Cahier des Charges COMPLET, riche, technique et personnalise pour ce projet. C'est le livrable le plus important de la relation client : il doit prouver des la premiere page que nous avons COMPRIS le client, son metier, son marche et son besoin profond.

${base}

## REGLE ANTI-HALLUCINATION (ABSOLUE)
- Tout fait, chiffre, nom de concurrent, URL ou citation DOIT provenir des echanges client ou des donnees de decouverte ci-dessus.
- Si une information n'a pas ete collectee : ecris "[A confirmer lors du cadrage]" — n'invente JAMAIS.
- Les recommandations (couleurs, stack, planning) sont autorisees et encouragees, mais doivent etre presentees comme des PRECONISATIONS IMOTION, pas comme des faits client.
- INTERDIT d'inventer des URLs, statistiques de marche, parts de marche ou citations d'etudes.

## STRUCTURE OBLIGATOIRE DU CAHIER DES CHARGES (Template IMOTION Creator Studio V3)

# PAGE DE GARDE
- Titre : CAHIER DES CHARGES
- Sous-titre : [Nom du projet, formule comme une promesse client]
- Tableau : Reference | Client | Secteur | Date d'emission | Validite 30 jours | Budget estime | Echeance souhaitee

# SOMMAIRE
Liste numerotee des 9 chapitres.

# 1. CONTEXTE & OBJECTIFS
C'est la section la plus strategique : le client doit se dire "ils m'ont compris" des la premiere page.
## 1.1 Synthese strategique (l'essentiel en 10 lignes)
Reformulation INTELLIGENTE du besoin : pas une liste de faits, mais une lecture strategique. Relie le contexte du client, la dynamique de son marche, son ambition et le role du projet dans cette ambition. Utilise les mots exacts du client (verbatim entre guillemets) au moins 2 fois.
## 1.2 Le client et son activite
Presentation detaillee : activite, modele economique, zone geographique, positionnement actuel, forces identifiees lors des echanges, ce qui le rend unique.
## 1.3 Le declencheur et le timing
Pourquoi ce projet, pourquoi maintenant. Quel evenement ou constat a declenche la demarche. Quel est le cout d'opportunite si rien n'est fait (uniquement a partir d'elements exprimes par le client).
## 1.4 Enjeux strategiques hierarchises
Tableau : | Enjeu | Description | Horizon | Criticite (Haute/Moyenne/Basse) | — minimum 4-6 enjeux issus des echanges.
## 1.5 Objectifs SMART du projet
Tableau : | Objectif | Indicateur | Cible | Echeance | — minimum 5 objectifs. Si une cible chiffree n'a pas ete donnee par le client, proposer une cible realiste marquee "(preconisation IMOTION, a valider)".
## 1.6 Message cle / promesse de marque
La phrase-signature du positionnement, tiree des echanges.

# 2. IDENTITE DE MARQUE & DIRECTION ARTISTIQUE
Section complete de brief creatif, exploitable directement par un directeur artistique.
## 2.1 Plateforme de marque
Mission, vision, valeurs, personnalite de marque (5 adjectifs), promesse — construits a partir des echanges.
## 2.2 Univers visuel et tonalite
Description riche de l'univers cible : registre (luxe, tech, artisanal...), references culturelles, ambiance, ce que la marque doit evoquer ET ce qu'elle doit eviter.
## 2.3 Emotions de marque ciblees
Tableau : | Emotion | Pourquoi (lien avec la cible) | Traduction visuelle concrete |
## 2.4 Recommandation chromatique (preconisation IMOTION)
Proposer une palette PRECISE et justifiee : | Role (Primaire/Secondaire/Accent/Neutres) | Couleur proposee | Code HEX indicatif | Justification psychologique et sectorielle | — coherente avec l'univers exprime par le client. Marquer "a affiner en phase de direction artistique".
## 2.5 Recommandation typographique (preconisation IMOTION)
Familles typographiques proposees (titrage / corps de texte), avec justification (lisibilite, personnalite, licences web).
## 2.6 Photographie, illustration et iconographie — choix directeurs
OBLIGATOIRE — repondre explicitement a ces questions :
- Photos ou illustrations ? Ou un mix ? Justifier selon le secteur et la cible.
- Si photos : quel type (lifestyle, architecture, portrait, produit, drone...), quelle lumiere, quelle mise en scene, quel traitement (chaud/froid, contraste, grain) ?
- Faut-il un shooting professionnel dedie ? Quels sujets prioritaires ?
- Si illustrations : quel style (flat, 3D, line art...), quel usage ?
- Iconographie : style d'icones recommande, coherence avec la typo.
## 2.7 Tonalite editoriale (voix de la marque)
Registre de langage, niveau de tutoiement/vouvoiement, exemples de formulations "on dit / on ne dit pas".
## 2.8 Livrables identitaires inclus
Liste precise : logo (declinaisons), charte graphique, cahier de style photo, gabarits, etc.
## 2.9 References et inspirations citees
UNIQUEMENT les references citees dans les echanges, avec analyse de CE QUI plait au client dans chacune.

# 3. CIBLES & POSITIONNEMENT
## 3.1 Segmentation detaillee des cibles
Pour CHAQUE cible identifiee dans les echanges, un tableau complet : | Segment | Profil socio-demographique | Motivations profondes | Freins et objections | Declencheurs de decision | Canal d'acquisition privilegie |
## 3.2 Personas (2-4 personas narratifs)
Pour chaque persona : prenom fictif, age, profession, situation, citation imaginaire representative (marquee comme illustration), scenario d'usage concret du futur produit (parcours en 4-6 etapes), ce qui le ferait abandonner.
## 3.3 Proposition de valeur par cible
Tableau : | Cible | Probleme percu | Notre reponse | Preuve / reassurance |
## 3.4 Positionnement
Carte de positionnement verbale : sur quels axes le client se differencie (ex. prix vs service, local vs national). Phrase de positionnement complete : "Pour [cible], [marque] est le seul [categorie] qui [benefice unique] parce que [preuve]."
## 3.5 Parcours client cible
Etapes du parcours (decouverte > consideration > decision > fidelisation) avec, pour chaque etape : point de contact, contenu necessaire, objectif de conversion.

# 4. FONCTIONNALITES CLES
Niveau de detail attendu : chaque module doit etre specifie comme un backlog produit exploitable par une equipe de developpement.
## 4.1 Cartographie fonctionnelle
Vue d'ensemble des modules et de leurs interactions (description textuelle structuree).
## 4.2 Modules detailles
Pour CHAQUE module identifie dans les echanges (site vitrine, espace membres, CRM, automatisations, e-commerce, reservation, conciergerie, portail partenaires, multilingue, dashboard...) :
- Objectif metier du module
- User stories : minimum 3-5 par module au format "En tant que [role], je veux [action] afin de [benefice]"
- Criteres d'acceptation verifiables (liste a puces)
- Regles de gestion specifiques
- Priorite MoSCoW (Must/Should/Could/Won't)
## 4.3 Automatisations et flux de donnees
Si le client a evoque de l'automatisation, du CRM ou des notifications : tableau | Declencheur | Action automatisee | Outil/canal | Donnees echangees | — sinon proposer 3-5 automatisations pertinentes pour son metier marquees "(preconisation)".
## 4.4 Matrice de priorisation complete
Tableau recapitulatif : | # | Fonctionnalite | Module | Priorite MoSCoW | Complexite (S/M/L) | Phase (1 ou 2) |
## 4.5 Hors perimetre
Ce qui est explicitement EXCLU de cette version, avec justification (budget, delai ou maturite).

# 5. SPECIFICATIONS TECHNIQUES
## 5.1 Architecture recommandee
Schema textuel de l'architecture (frontend, backend, base de donnees, services tiers), avec justification de chaque choix au regard du besoin, du budget et de l'evolutivite.
## 5.2 Stack technique preconisee
Tableau : | Couche | Solution preconisee | Alternative | Justification | — frontend, backend/BDD, CMS, hebergement, CDN, emails transactionnels, analytics.
## 5.3 Design system et methode d'integration
OBLIGATOIRE — specifier :
- Type de design system a constituer pour le client (tokens couleurs/typo/espacements, bibliotheque de composants, gabarits de pages)
- Outil de design (ex. Figma) et organisation des maquettes (mobile first ou desktop first, nombre d'ecrans cles)
- Regles de responsive (breakpoints), grilles, et accessibilite visuelle (contrastes WCAG)
## 5.4 Exigences non-fonctionnelles
Tableau : | Exigence | Niveau attendu | Methode de mesure | Priorite | — performance (Core Web Vitals), disponibilite, compatibilite navigateurs, responsive, accessibilite WCAG 2.1 AA, SEO technique (score Lighthouse).
## 5.5 Securite et RGPD
Mesures concretes : chiffrement, gestion des acces et roles, conformite RGPD (registre, consentement, droit a l'effacement), sauvegardes, plan de reprise. Adapter au niveau de sensibilite des donnees evoque dans les echanges.
## 5.6 SEO et visibilite
Strategie SEO technique ET semantique : structure d'URLs, balisage, donnees structurees, strategie de mots-cles locale/internationale selon les cibles identifiees.
## 5.7 Integrations et interoperabilite
Tableau : | Systeme tiers | Sens du flux | Donnees | Methode (API, webhook, export) | Priorite | — uniquement les outils cites + preconisations marquees.
## 5.8 Infrastructure et exploitation
Nom de domaine, hebergement, emails pro, certificats, environnements (dev/staging/prod), monitoring — etat actuel (si connu) et cible.

# 6. CONTENU & MEDIAS
Section complete de strategie de contenu, pas un simple inventaire.
## 6.1 Inventaire des contenus existants
Tableau : | Type de contenu | Existant ? | Etat / qualite | Reutilisable ? | Action requise | — textes, photos, videos, logo, charte, temoignages, documents legaux.
## 6.2 Plan de production des contenus manquants
Tableau : | Contenu a produire | Responsable (Client/IMOTION/Prestataire) | Format et specifications | Echeance | Dependance |
## 6.3 Arborescence et architecture editoriale
Arborescence complete du site/produit page par page, avec pour chaque page : objectif, message principal, contenus requis, action attendue du visiteur (CTA).
## 6.4 Specifications media
- Photos : resolutions, formats, ratios par usage (hero, galerie, vignette), poids max, traitement
- Videos : durees, formats, sous-titrage, hebergement (natif vs plateforme)
- Documents telechargeables le cas echeant
## 6.5 Storytelling et angles editoriaux
Les 3-5 histoires que la marque doit raconter (issues des echanges), et sur quelles pages/canaux les exploiter.
## 6.6 Gouvernance du contenu apres lancement
Qui met a jour quoi, a quelle frequence, avec quel outil (back-office), et formation prevue.

# 7. CONCURRENCE & BENCHMARKS
RIGUEUR ABSOLUE : cette section ne contient QUE des faits issus des echanges client. C'est un cadre d'analyse professionnel, pas un rapport invente.
## 7.1 Paysage concurrentiel identifie avec le client
Pour CHAQUE concurrent cite dans les echanges : | Concurrent | Positionnement percu | Forces (selon le client) | Faiblesses (selon le client) | Menace pour le projet |
Si le client n'a cite aucun concurrent : l'indiquer honnetement et recommander un atelier benchmark en phase de cadrage.
## 7.2 Grille d'analyse comparative (a completer en cadrage)
Fournir la grille methodologique que IMOTION utilisera : axes d'analyse (UX, offre, preuve sociale, SEO, tunnel de conversion, identite), bareme, livrable attendu. Les cases concurrents restent "[A evaluer]" si non documentees.
## 7.3 Enseignements des references inspirantes
Pour chaque site/marque d'inspiration cite par le client : ce qui plait, ce qui est transposable, ce qui ne l'est pas (et pourquoi).
## 7.4 Opportunites de differenciation
Synthese strategique : ou se situe l'espace libre pour le client, en croisant ses forces (section 1) et les faiblesses concurrentielles exprimees. Chaque opportunite reliee a une fonctionnalite ou un choix de DA du present CDC.
## 7.5 Benchmark complementaire recommande
Perimetre, methodologie et livrable du benchmark approfondi que IMOTION recommande de mener en phase de cadrage (inclus ou en option selon le budget).

# 8. BUDGET & PLANNING
## 8.1 Enveloppe budgetaire et repartition
Budget confirme + tableau de repartition indicative par poste : | Poste | Part indicative | Montant indicatif | Commentaire | (identite, conception UX/UI, developpement, contenu, tests, pilotage).
## 8.2 Planning detaille semaine par semaine
Tableau OBLIGATOIRE semaine par semaine sur toute la duree du projet : | Semaine | Phase | Activites | Livrables | Action requise du CLIENT | — minimum 10 lignes. Les actions client (validations, fourniture de contenus) doivent etre explicites.
## 8.3 Jalons contractuels
Tableau : | Jalon | Critere de passage | Date previsionnelle | Consequence si glissement |
## 8.4 Matrice des responsabilites (RACI simplifiee)
Tableau : | Activite | IMOTION | Client | — avec R (realise), A (approuve), C (consulte), I (informe).
## 8.5 Dependances et risques planning
Tableau : | Risque | Probabilite | Impact | Mitigation | — minimum 5 risques REALISTES lies a CE projet (contenus, validations, complexite technique identifiee).
## 8.6 Echeancier de paiement
Acompte 30% a la signature, 20% validation maquettes, 35% recette, 15% mise en production — avec montants calcules si le budget est connu.

# 9. LIVRABLES, GOUVERNANCE & PROCHAINES ETAPES
## 9.1 Liste exhaustive des livrables
Tableau : | Livrable | Format | Phase | Critere d'acceptation |
## 9.2 Gouvernance projet
Rituels (point hebdo, demos, comite), outils de suivi, regles de validation (delai client 5 jours ouvres), gestion des demandes de changement.
## 9.3 Garanties
Garantie de conformite 3 mois, delais de correction par criticite, perimetre et exclusions.
## 9.4 Prochaines etapes
1. Validation du present CDC (delai souhaite)
2. Proposition commerciale et devis detaille
3. Signature et acompte
4. Kickoff
## 9.5 Validation
Espace signatures : Pour IMOTION Creator Studio | Pour le client — Date, mention "Lu et approuve".

---
INSTRUCTIONS FINALES :
- EXPLOITE CHAQUE information des echanges : si le client a mentionne un detail (outil, contrainte, anecdote metier, preference), il DOIT apparaitre dans la section pertinente.
- Cite des verbatim client entre guillemets dans les sections 1, 2, 3 et 7 (minimum 5 verbatim au total).
- Toute preconisation IMOTION (couleurs, stack, automatisations) est marquee comme telle et justifiee.
- Aucune section ne doit faire moins de 15 lignes de contenu reel. Aucun placeholder vide.
- Longueur cible : 4500-7000 mots.
- NE JAMAIS utiliser d'emojis.
- Pied de page : IMOTION Creator Studio | SAS au capital de 10 000 euros | 123 Avenue de l'Innovation, 75008 Paris | www.imotion-studio.com`;
  }

  if (type === "proposal") {
    return `Génère une Proposition Commerciale professionnelle et convaincante en Markdown :

${base}

Structure obligatoire :
1. Page de garde (projet, client, date, référence)
2. Mot d'accompagnement personnalisé
3. Présentation IMOTION Creator Studio (expertise, références, équipe)
4. Compréhension du besoin (reformulation empathique du besoin client)
5. Solution proposée (approche, méthodologie)
6. Détail de la prestation (3 options : Essentiel, Recommandé, Premium)
7. Planning détaillé
8. Investissement (tableau comparatif des 3 options, conditions de paiement)
9. Garanties et engagements
10. Conditions générales
11. Prochaines étapes et signature

Le ton doit être confiant, professionnel et rassurant. Chaque option doit avoir un nom attractif et une proposition de valeur claire.`;
  }

  if (type === "tech_recommendation") {
    return `En tant qu'architecte technique, analyse ce projet et produis un document de recommandation technique COMPLET :

${base}

## STRUCTURE OBLIGATOIRE

# 1. ANALYSE DU BESOIN TECHNIQUE
- Synthèse des besoins fonctionnels identifiés
- Contraintes techniques (performance, scalabilité, sécurité, budget)
- Niveau de complexité global (Simple / Intermédiaire / Complexe / Très complexe)

# 2. RECOMMANDATION D'OUTILS & STACK
Pour chaque couche, recommande l'outil LE PLUS ADAPTÉ avec justification :

| Couche | Outil recommandé | Alternative | Justification |
|--------|-----------------|-------------|---------------|
| Frontend | ... | ... | ... |
| Backend / BDD | ... | ... | ... |
| Hébergement | ... | ... | ... |
| CMS / Contenu | ... | ... | ... |
| Design / Prototypage | ... | ... | ... |
| CI/CD / DevOps | ... | ... | ... |
| Analytics / Monitoring | ... | ... | ... |

### Approche recommandée
- Si no-code/low-code est viable, le recommander (Lovable, Cursor, Webflow, Bubble...)
- Si code custom nécessaire, expliquer pourquoi
- Comparer le coût total de possession (TCO) sur 12 mois

# 3. PROMPT TECHNIQUE COMPLET
Pour chaque outil principal recommandé, fournir un **prompt technique détaillé** prêt à copier-coller :

### Prompt pour [Outil 1 - ex: Lovable/Cursor/etc.]
\`\`\`
[Prompt complet, structuré, incluant :
- Description du projet
- Stack technique
- Architecture des pages/écrans
- Composants à créer
- Base de données (tables, relations, RLS)
- Authentification
- Fonctionnalités clés
- Design system (couleurs, typos, style)
- Intégrations tierces
- Responsive / accessibilité
]
\`\`\`

### Prompt pour [Outil 2] (si applicable)
\`\`\`
[Prompt adapté à cet outil]
\`\`\`

# 4. CONSEIL A L'ADMINISTRATEUR IMOTION

## 4.1 Outils internes recommandes
Recommande les meilleurs outils pour l'equipe IMOTION pour gerer ce projet :
| Categorie | Outil recommande | Alternative | Justification |
|-----------|-----------------|-------------|---------------|
| Gestion de projet | ... | ... | ... |
| Communication client | ... | ... | ... |
| Design / Prototypage | ... | ... | ... |
| Suivi financier | ... | ... | ... |
| Documentation | ... | ... | ... |
| Tests / QA | ... | ... | ... |

## 4.2 Allocation d'equipe recommandee
| Role | Profil recherche | TJM estime | Jours estimes | Total |
|------|-----------------|------------|---------------|-------|
| Chef de projet | Senior, 5+ ans | 550-700EUR | ... | ... |
| UX/UI Designer | Senior, Figma expert | 450-600EUR | ... | ... |
| Developpeur | ... | ... | ... | ... |
| QA / Testeur | ... | ... | ... | ... |

## 4.3 Workflow de production recommande
Decris les etapes sequentielles recommandees pour l'equipe :
1. Kickoff et cadrage (1 semaine)
2. Conception UX/UI (2-3 semaines)
3. Sprints de developpement (X semaines)
4. Phase de recette (1-2 semaines)
5. Mise en production et transfert (1 semaine)
6. Garantie et maintenance (3 mois)

# 5. PROMPT MULTI-AGENT ORCHESTRE

Genere un prompt principal qui coordonne plusieurs sous-agents IA pour la realisation du projet. Chaque agent a un role specialise :

## Agent 1 : Analyste CDC
Role : Valider le perimetre fonctionnel, identifier les zones de risque, proposer des arbitrages
Prompt : [prompt detaille pour cet agent]

## Agent 2 : UX/UI Designer
Role : Creer le design system, wireframes, prototypes, guidelines d'accessibilite
Prompt : [prompt detaille pour cet agent]

## Agent 3 : Architecte Developpeur
Role : Definir l'architecture technique, les schemas de BDD, les APIs, le code de base
Prompt : [prompt detaille pour cet agent incluant schema SQL, endpoints API, structure de fichiers]

## Agent 4 : QA Engineer
Role : Ecrire les plans de test, les scenarios de recette, les criteres d'acceptation
Prompt : [prompt detaille pour cet agent]

## Agent 5 : DevOps / Deploiement
Role : Configurer l'infrastructure, CI/CD, monitoring, sauvegardes, securite
Prompt : [prompt detaille pour cet agent]

## Orchestration
Decris le flux de coordination entre les agents :
1. Agent CDC analyse et valide → Output : perimetre valide
2. Agent UX recoit le perimetre → Output : maquettes + design tokens
3. Agent Dev recoit maquettes + perimetre → Output : code source
4. Agent QA recoit le code → Output : rapport de tests
5. Agent DevOps recoit le code valide → Output : deploiement en production

# 6. ARCHITECTURE TECHNIQUE DÉTAILLÉE
- Diagramme textuel de l'architecture (Markdown)
- Flux de données
- Points d'intégration
- Stratégie de déploiement

# 7. RISQUES TECHNIQUES & MITIGATIONS
| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|

# 8. ESTIMATION DE L'EFFORT TECHNIQUE
| Phase | Complexité | Jours estimés | Profil requis |
|-------|-----------|---------------|---------------|

---
INSTRUCTIONS : Le prompt technique doit être IMMÉDIATEMENT utilisable. Il doit contenir assez de détail pour qu'un développeur (ou un outil IA) puisse démarrer le build sans poser de questions supplémentaires.`;
  }

  if (type === "conseil_technique") {
    return `En tant que CTO senior, analyse ce projet en profondeur et produis un livrable de CONSEIL TECHNIQUE STRATÉGIQUE complet :

${base}

# LIVRABLE CONSEIL TECHNIQUE — ${project.name}
*Référence : ${project.code} | Date : ${new Date().toLocaleDateString("fr-FR")}*

# 1. SYNTHÈSE EXÉCUTIVE
- Résumé du besoin en 5-8 lignes
- Niveau de complexité : Simple / Intermédiaire / Complexe / Très complexe
- Approche recommandée : No-code / Low-code / Hybride / Code custom
- Estimation budgétaire globale et délai

# 2. ANALYSE TECHNIQUE DU BESOIN
## 2.1 Besoins fonctionnels critiques (Must/Should/Could/Won't)
## 2.2 Besoins non-fonctionnels (Performance, sécurité, scalabilité, accessibilité, SEO)
## 2.3 Contraintes identifiées (Budget, délai, compétences, existant technique)

# 3. RECOMMANDATION DE STACK TECHNIQUE
| Couche | Outil principal | Alternative | Coût/an | Justification |
|--------|----------------|-------------|---------|---------------|
| Frontend / Site | ... | ... | ... | ... |
| Backend / API | ... | ... | ... | ... |
| Base de données | ... | ... | ... | ... |
| Hébergement / CDN | ... | ... | ... | ... |
| CMS / Contenu | ... | ... | ... | ... |
| E-commerce (si applicable) | ... | ... | ... | ... |
| Auth / Sécurité | ... | ... | ... | ... |
| Analytics / Monitoring | ... | ... | ... | ... |
| Email transactionnel | ... | ... | ... | ... |
| IA / Automatisation | ... | ... | ... | ... |

## 3.1 Comparaison TCO sur 12 mois (No-code vs Code custom)
## 3.2 Recommandation IA / LLM pour le projet
| Usage | Outil IA | Modèle | Coût estimé | Justification |
|-------|---------|--------|-------------|---------------|
| Build du projet | Claude Opus / Lovable / Cursor | ... | ... | ... |

# 4. ARCHITECTURE TECHNIQUE PROPOSÉE
## 4.1 Schéma d'architecture (Frontend, Backend, BDD, Intégrations, Flux de données)
## 4.2 Sécurité (Auth, RBAC/RLS, RGPD)

# 5. PLANNING DE RÉALISATION DÉTAILLÉ
| Phase | Description | Durée | Livrables | Validation |
|-------|-----------|-------|-----------|------------|
| 0. Kickoff | Cadrage | 3-5 jours | Backlog | Chef de projet |
| 1. UX/UI | Wireframes, maquettes | 2-3 sem. | Figma validé | Client |
| 2-4. Sprints | Développement itératif | X sem. | Démos | Client |
| 5. QA | Tests et recette | 1-2 sem. | PV de recette | Client |
| 6. Production | Déploiement | 3-5 jours | Go Live | Chef de projet |
| 7. Garantie | Support | 3 mois | Clôture | Chef de projet |

# 6. RESSOURCES NÉCESSAIRES
| Rôle | Profil | TJM marché | Jours estimés | Coût estimé |
|------|--------|-----------|---------------|-------------|
| Chef de projet | Senior 5+ ans | 600-800EUR | ... | ... |
| UX/UI Designer | Senior Figma | 500-700EUR | ... | ... |
| Développeur Full-stack | Senior | 550-750EUR | ... | ... |
| QA / Testeur | Confirmé | 350-500EUR | ... | ... |

# 7. RECOMMANDATIONS INTERNES (IMOTION)
## 7.1 Outils de gestion recommandés
## 7.2 Points d'attention et risques (minimum 6-8 risques avec mitigations)

# 8. PROCHAINES ÉTAPES
1. Validation du conseil technique
2. Génération des prompts de build IA
3. Démarrage du projet

---
INSTRUCTIONS : Livrable de conseil professionnel. Données RÉELLES du client. Si info manquante : [À CONFIRMER].`;
  }

  if (type === "build_prompts") {
    const bt = "\`\`\`";
    return `En tant que prompt engineer expert, génère un document de PROMPTS DE BUILD complet :

${base}

# PROMPTS DE BUILD — ${project.name}
*Référence : ${project.code} | Date : ${new Date().toLocaleDateString("fr-FR")}*

# 1. FICHE PROJET
- Nom : ${project.name}
- Client : ${(client as Record<string,unknown>)?.company_name || "N/A"} (${(client as Record<string,unknown>)?.full_name || "N/A"})
- Type : [type de projet détecté]
- Stack cible : [stack recommandée]

# 2. PROMPT GLOBAL — CLAUDE OPUS / GPT-5
Prompt ultra-détaillé (minimum 2000 mots) à donner en une seule fois.

${bt}
[PROMPT COMPLET incluant :
- Contexte projet complet (client, objectifs, budget, délai)
- Architecture technique (stack, BDD complète avec schéma SQL, API, auth)
- TOUTES les pages avec composants, données, actions utilisateur, state
- Design system (couleurs hex, typos, spacing, border-radius, animations)
- Intégrations tierces avec configuration
- Sécurité (RLS par table, validation, CORS, rate limiting)
- Responsive (breakpoints, comportement mobile vs desktop)
- Conventions de nommage et structure de fichiers
- Gestion des erreurs et tests]
${bt}

# 3. PROMPTS PAR COMPOSANT (LOVABLE / CURSOR)
Chaque prompt prêt à copier-coller (minimum 300 mots chacun).

## 3.1 Prompt — Page d'accueil
${bt}
[Structure, textes, design, animations, responsive, SEO]
${bt}

## 3.2 Prompt — Authentification (Login / Register)
${bt}
[Pages d'auth complètes]
${bt}

## 3.3 Prompt — Dashboard principal
${bt}
[KPIs, graphiques, tableaux, actions, notifications]
${bt}

## 3.4 à 3.N — Un prompt par page/composant majeur du CDC
${bt}
[Prompt spécifique par page]
${bt}

# 4. PROMPT — SCHÉMA BASE DE DONNÉES
${bt}sql
-- Schéma SQL complet : CREATE TABLE, relations, index, RLS policies, triggers, fonctions
[Commenté et prêt à exécuter]
${bt}

# 5. PROMPT — API / EDGE FUNCTIONS
Pour chaque endpoint backend :
${bt}
[Endpoint, méthode HTTP, input/output, logique métier, erreurs, auth]
${bt}

# 6. PROMPT MULTI-AGENT ORCHESTRÉ

## Agent Orchestrateur (Claude Opus)
${bt}
[Coordonne les sous-agents, gère les dépendances, valide les outputs]
${bt}

## Agent 1 : Analyste (valider périmètre, backlog, priorités)
## Agent 2 : UX/UI Designer (design system, wireframes, maquettes)
## Agent 3 : Architecte Backend (BDD, API, auth, RLS, migrations)
## Agent 4 : Développeur Frontend (React, pages, routing, state, responsive)
## Agent 5 : QA Engineer (tests, scénarios, critères d'acceptation)
## Agent 6 : DevOps (CI/CD, monitoring, sauvegardes, déploiement)

Chaque agent avec un prompt détaillé dans un bloc de code.

## Flux d'orchestration
1. Orchestrateur -> Analyste -> backlog validé
2. Orchestrateur -> Designer -> design system + maquettes
3. Orchestrateur -> Backend -> schéma BDD + endpoints
4. Orchestrateur -> Frontend -> code source
5. Orchestrateur -> QA -> rapport de tests
6. Orchestrateur -> DevOps -> déploiement production

# 7. FICHIER SPECS TECHNIQUES (PRD)
Document de spécifications complet : vue d'ensemble, stack avec versions, modèle de données, architecture, sécurité, performance, déploiement.

---
INSTRUCTIONS : Chaque prompt IMMÉDIATEMENT utilisable. Données RÉELLES du client. Prompt global Claude Opus minimum 2000 mots. Prompts composants minimum 300 mots.`;
  }

  if (type === "pricing") {
    return `Génère une Proposition Tarifaire Détaillée professionnelle pour ce projet :

${base}

## STRUCTURE OBLIGATOIRE

# 1. PAGE DE GARDE
- Titre : Proposition Tarifaire - [Nom du projet]
- Client, date, référence, validité (30 jours)

# 2. RAPPEL DU PÉRIMÈTRE
- Synthèse du besoin en 5 lignes
- Périmètre inclus et exclus clairement défini

# 3. MÉTHODOLOGIE DE CHIFFRAGE
- Expliquer la méthode : découpage en phases → estimation par tâche → TJM appliqué
- TJM de référence IMOTION :
  - Direction de projet : 850€/jour
  - UX/UI Design : 750€/jour
  - Développement senior : 700€/jour
  - Développement junior : 450€/jour
  - Intégration / Recette : 400€/jour
  - Rédaction contenu : 500€/jour

# 4. DÉTAIL PAR PHASE DE BUILD

Pour CHAQUE phase, créer un tableau détaillé :

### Phase 1 : Cadrage & Conception
| Tâche | Profil | Jours | Montant HT |
|-------|--------|-------|------------|

### Phase 2 : Design UX/UI
| Tâche | Profil | Jours | Montant HT |

### Phase 3 : Développement Frontend
| Tâche | Profil | Jours | Montant HT |

### Phase 4 : Développement Backend & Intégrations
| Tâche | Profil | Jours | Montant HT |

### Phase 5 : Tests & Recette (QA)
| Tâche | Profil | Jours | Montant HT |
- Tests fonctionnels
- Tests de performance
- Tests de sécurité
- Recette client (2 itérations)
- Corrections et ajustements

### Phase 6 : Mise en production & Accompagnement
| Tâche | Profil | Jours | Montant HT |

# 5. SYNTHÈSE TARIFAIRE — 3 OPTIONS

| | Essentiel | Recommande | Premium |
|---|-----------|--------------|---------|
| Conception | ... | ... | ... |
| Design | ... | ... | ... |
| Développement | ... | ... | ... |
| Tests & QA | ... | ... | ... |
| Mise en prod | ... | ... | ... |
| **TOTAL HT** | **...€** | **...€** | **...€** |
| TVA (20%) | ... | ... | ... |
| **TOTAL TTC** | **...€** | **...€** | **...€** |

### Ce qui différencie chaque option
- **Essentiel** : MVP fonctionnel, design standard
- **Recommandé** : Version complète, design sur-mesure, optimisations
- **Premium** : Tout inclus + formations + maintenance 6 mois + évolutions

# 6. CALENDRIER DE PAIEMENT
| Jalon | % | Montant | Échéance |
|-------|---|---------|----------|
| Signature | 30% | ... | J+0 |
| Validation maquettes | 40% | ... | J+... |
| Livraison finale | 30% | ... | J+... |

# 7. GARANTIES & MAINTENANCE
- Garantie de conformité : 3 mois post-livraison
- Maintenance corrective incluse pendant ...
- Option maintenance évolutive : .../mois

# 8. CONDITIONS
- Validité : 30 jours
- TVA applicable : 20%
- Pénalités de retard : taux légal
- Conditions d'annulation

---
INSTRUCTIONS : Les montants doivent être RÉALISTES et basés sur le marché français. Chiffre en fonction de la complexité réelle du projet. Ne sous-estime jamais la phase de tests.`;
  }

  if (type === "contract_fr") {
    return `Génère un Contrat de Prestation de Services Numériques COMPLET conforme au droit français :

${base}

## STRUCTURE OBLIGATOIRE DU CONTRAT

# CONTRAT DE PRESTATION DE SERVICES NUMÉRIQUES

**Entre les soussignés :**

## ARTICLE 1 — IDENTIFICATION DES PARTIES
- LE PRESTATAIRE : IMOTION (détails à compléter : SIRET, RCS, siège social, représentant légal)
- LE CLIENT : ${client?.company_name || "[À compléter]"} (${client?.full_name || "[À compléter]"})

## ARTICLE 2 — PRÉAMBULE ET CONTEXTE
- Contexte de la collaboration
- Référence au CDC et à la proposition tarifaire

## ARTICLE 3 — OBJET DU CONTRAT
- Description précise de la prestation
- Référence aux annexes (CDC, planning, devis)

## ARTICLE 4 — DOCUMENTS CONTRACTUELS
- Hiérarchie des documents (contrat > annexes > CDC > devis)
- En cas de contradiction, le contrat prévaut

## ARTICLE 5 — DURÉE ET CALENDRIER
- Date de démarrage / Date de livraison prévisionnelle
- Jalons intermédiaires
- Conditions de prorogation

## ARTICLE 6 — LIVRABLES
- Liste exhaustive des livrables
- Format de livraison
- Critères d'acceptation

## ARTICLE 7 — PRIX ET MODALITÉS DE PAIEMENT
- Montant total HT et TTC
- Échéancier de paiement (cf. proposition tarifaire)
- Conditions de facturation
- Pénalités de retard de paiement (taux légal majoré de 5 points, conformément à l'article L441-10 du Code de commerce)
- Indemnité forfaitaire de recouvrement : 40€ (art. D441-5 Code de commerce)
- Clause de révision de prix si le projet dépasse 6 mois

## ARTICLE 8 — OBLIGATIONS DU PRESTATAIRE
- Obligation de moyens (pas de résultat)
- Respect du cahier des charges
- Information régulière du client
- Respect des délais (sous réserve de la coopération du client)
- Confidentialité
- Conformité RGPD dans les développements

## ARTICLE 9 — OBLIGATIONS DU CLIENT
- Fourniture des contenus et validations dans les délais
- Désignation d'un interlocuteur unique
- Accès aux outils et systèmes nécessaires
- Paiement dans les délais
- **Clause de retard client** : tout retard de validation > 5 jours ouvrés entraîne un décalage équivalent du planning

## ARTICLE 10 — PROCESSUS DE VALIDATION ET RECETTE
- Procédure de recette (délais, PV de recette)
- Recette tacite : si le client ne formule pas de réserves sous 15 jours ouvrés
- Réserves : le client dispose de 2 itérations de corrections
- Au-delà, les corrections sont facturées au TJM contractuel

## ARTICLE 11 — PROPRIÉTÉ INTELLECTUELLE
- **Développements spécifiques** : cession des droits patrimoniaux au client APRÈS paiement intégral (art. L131-3 CPI)
- **Étendue de la cession** : reproduction, représentation, adaptation, pour le monde entier, pour la durée légale des droits
- **Réserve** : le prestataire conserve le droit d'utiliser les méthodes, savoir-faire et outils génériques
- **Composants tiers** : soumis à leurs licences respectives (open source, SaaS, etc.)
- **Portfolio** : le prestataire peut mentionner la réalisation dans son portfolio sauf opposition écrite du client

## ARTICLE 12 — DONNÉES PERSONNELLES ET RGPD
- Le prestataire agit en tant que sous-traitant au sens du RGPD
- Conformité à l'article 28 du RGPD
- Mesures techniques et organisationnelles de sécurité
- Notification des violations de données sous 48h
- Suppression/restitution des données en fin de contrat
- Registre des traitements

## ARTICLE 13 — CONFIDENTIALITÉ
- Durée : pendant le contrat et 3 ans après
- Périmètre : toute information non publique échangée
- Exceptions : information publique, connue avant, obtenue d'un tiers, imposée par la loi

## ARTICLE 14 — GARANTIE
- Garantie de conformité au CDC : 3 mois après la recette
- Corrections des anomalies bloquantes : sous 48h ouvrés
- Corrections des anomalies mineures : sous 10 jours ouvrés
- Exclusions : modifications non autorisées, mauvaise utilisation, contenu fourni par le client

## ARTICLE 15 — RESPONSABILITÉ
- Limitation de responsabilité au montant total du contrat
- Exclusion des dommages indirects (perte de CA, perte de données, préjudice d'image)
- Exception : faute lourde ou dolosive
- Obligation d'assurance RC Pro du prestataire

## ARTICLE 16 — RÉSILIATION
- Résiliation pour faute : mise en demeure par LRAR, délai de 30 jours pour régulariser
- Résiliation pour convenance du client : paiement des travaux réalisés + indemnité de 20% du solde restant
- Résiliation de plein droit : liquidation judiciaire, cessation d'activité
- Conséquences : restitution des éléments, paiement du solde

## ARTICLE 17 — FORCE MAJEURE
- Définition conforme à l'article 1218 du Code civil
- Suspension des obligations pendant la durée de l'événement
- Résiliation de plein droit si > 3 mois

## ARTICLE 18 — NON-SOLLICITATION
- Interdiction de solliciter les collaborateurs de l'autre partie pendant le contrat et 12 mois après
- Pénalité : 6 mois de salaire brut du collaborateur

## ARTICLE 19 — MÉDIATION ET LITIGES
- Tentative de résolution amiable obligatoire (30 jours)
- Médiation possible (médiateur de la consommation si B2C)
- À défaut : Tribunal compétent de [siège social IMOTION]

## ARTICLE 20 — DISPOSITIONS GÉNÉRALES
- Intégralité de l'accord (remplace tout accord antérieur)
- Indépendance des clauses (nullité partielle)
- Tolérance non constitutive de renonciation
- Modification par avenant écrit uniquement
- Élection de domicile
- Loi applicable : droit français

## SIGNATURES

| | Le Prestataire | Le Client |
|---|---|---|
| Nom | IMOTION | ${client?.full_name || "[À compléter]"} |
| Qualité | ... | ... |
| Date | ... | ... |
| Signature | [Espace réservé] | [Espace réservé] |
| Mention "Lu et approuvé" | | |

## ANNEXES
- Annexe 1 : Cahier des Charges
- Annexe 2 : Proposition Tarifaire
- Annexe 3 : Planning Prévisionnel
- Annexe 4 : Spécifications Techniques

---
INSTRUCTIONS JURIDIQUES :
- Chaque clause DOIT être conforme au droit français en vigueur
- Cite les articles de loi pertinents entre parenthèses
- Le contrat doit être PROTECTEUR pour le prestataire (IMOTION Creator Studio) tout en étant ÉQUILIBRÉ
- Les clauses abusives au sens du Code de la consommation doivent être évitées
- Adapte le contenu aux spécificités du projet (montants, délais, livrables)`;
  }

  if (type === "pv_reception") {
    return `Genere un Proces-Verbal de Reception COMPLET, detaille et conforme au droit francais, en croisant le Cahier des Charges, le Contrat et les livrables effectivement produits :

${base}

## STRUCTURE OBLIGATOIRE DU PV DE RECEPTION (Template IMOTION Creator Studio V2)

# PROCES-VERBAL DE RECEPTION

**N. [Numero auto-genere]**

---

## ENTRE LES SOUSSIGNES

**IMOTION Creator Studio**, Societe par Actions Simplifiee (SAS)
- Siege social : 123 Avenue de l'Innovation, 75008 Paris
- SIRET : XXX XXX XXX 000XX | RCS Paris B XXX XXX XXX
- Representee par son representant legal dument habilite
- Ci-apres denommee "Le Prestataire"

ET

**[Entreprise client]**, [Forme juridique]
- Representee par [Nom], en qualite de [Fonction]
- Ci-apres denommee "Le Client"

---

## ARTICLE 1 - OBJET DU PRESENT PROCES-VERBAL

Le present Proces-Verbal a pour objet de constater la reception des travaux realises dans le cadre du projet :
- **Nom du projet** : [Nom]
- **Reference CDC** : [Ref]
- **Reference Contrat** : [Ref]
- **Date de demarrage** : [Date]
- **Date de livraison** : [Date]

## ARTICLE 2 - RAPPEL DU PERIMETRE CONTRACTUEL

Reprendre les livrables definis dans le CDC et le Contrat :
| N. | Livrable contractuel | Reference CDC | Priorite |
|---|---|---|---|

## ARTICLE 3 - VERIFICATION DE CONFORMITE AU CAHIER DES CHARGES

Pour CHAQUE section du CDC, verifier la conformite :

### 3.1 Fonctionnalites Essentielles (Must Have)
| N. | Fonctionnalite (CDC) | Statut | Conforme | Observations |
|---|---|---|---|---|
Pour chaque fonctionnalite listee dans le CDC section 6.1

### 3.2 Fonctionnalites Souhaitees (Should Have)
| N. | Fonctionnalite (CDC) | Statut | Conforme | Observations |
|---|---|---|---|---|

### 3.3 Fonctionnalites Optionnelles (Nice to Have)
| N. | Fonctionnalite (CDC) | Statut | Conforme | Observations |
|---|---|---|---|---|

### 3.4 Specifications Techniques
| Exigence (CDC section 7) | Niveau attendu | Niveau constate | Conforme |
|---|---|---|---|
| Performance | < 3s | [A mesurer] | [Oui/Non] |
| Disponibilite | 99.5% | [A mesurer] | [Oui/Non] |
| Responsive | Mobile/Tablette/Desktop | [A verifier] | [Oui/Non] |
| Accessibilite | WCAG 2.1 AA | [A verifier] | [Oui/Non] |
| SEO | Lighthouse > 80 | [A mesurer] | [Oui/Non] |

### 3.5 Integrations
| Integration prevue (CDC) | Operationnelle | Tests realises | Conforme |
|---|---|---|---|

## ARTICLE 4 - TESTS ET RECETTE

### 4.1 Tests Fonctionnels
| Scenario de test | Resultat attendu | Resultat obtenu | Statut |
|---|---|---|---|

### 4.2 Tests de Performance
| Metrique | Objectif | Resultat | Statut |
|---|---|---|---|

### 4.3 Tests de Securite
| Verification | Resultat | Statut |
|---|---|---|
| HTTPS actif | | |
| Injection SQL | | |
| XSS | | |
| CSRF | | |
| Donnees personnelles (RGPD) | | |

### 4.4 Tests Multi-Navigateurs
| Navigateur | Version | Resultat |
|---|---|---|
| Chrome | Derniere | |
| Firefox | Derniere | |
| Safari | Derniere | |
| Edge | Derniere | |

## ARTICLE 5 - OUTILS ET STACK TECHNIQUE DEPLOYES

Lister les outils effectivement utilises et leur conformite avec la recommandation technique :
| Couche | Outil recommande | Outil deploye | Conforme |
|---|---|---|---|

## ARTICLE 6 - RESERVES

### 6.1 Reserves majeures (bloquantes)
| N. | Description | Impact | Delai de correction |
|---|---|---|---|

### 6.2 Reserves mineures (non bloquantes)
| N. | Description | Impact | Delai de correction |
|---|---|---|---|

### 6.3 Points d'amelioration (hors perimetre)
| N. | Description | Phase ulterieure suggeree |
|---|---|---|

## ARTICLE 7 - DECISION DE RECEPTION

En consequence de ce qui precede, les Parties conviennent :

- [ ] **Reception totale sans reserve** : Le Client declare recevoir la totalite des travaux conformement au Cahier des Charges et au Contrat
- [ ] **Reception partielle avec reserves** : Le Client declare recevoir les travaux sous reserve de la correction des anomalies listees a l'Article 6
- [ ] **Refus de reception** : Le Client refuse la reception pour les motifs exposes ci-dessus

### Conditions de la reception avec reserves :
- Delai de correction des reserves majeures : [X] jours ouvres
- Delai de correction des reserves mineures : [X] jours ouvres
- Un nouveau PV de levee des reserves sera etabli apres corrections

## ARTICLE 8 - EFFETS DE LA RECEPTION

La reception emporte les effets suivants (conformement au Contrat article 10) :
1. **Transfert de propriete** : Les droits sur les developpements specifiques sont transferes au Client (sous reserve du paiement integral)
2. **Declenchement de la garantie** : La periode de garantie de 3 mois demarre a compter de la date du present PV
3. **Facturation** : La reception declenche la facturation du solde prevu a l'echeancier contractuel
4. **Responsabilite** : A compter de la reception, le Client devient responsable de l'utilisation de la solution

## ARTICLE 9 - DOCUMENTATION LIVREE

| Document | Format | Remis | Date |
|---|---|---|---|
| Code source | Repository Git | [Oui/Non] | |
| Documentation technique | PDF/Markdown | [Oui/Non] | |
| Guide utilisateur | PDF | [Oui/Non] | |
| Acces et identifiants | Document securise | [Oui/Non] | |
| Sauvegardes | Export BDD | [Oui/Non] | |

## ARTICLE 10 - SUIVI POST-RECEPTION

### 10.1 Garantie
- Duree : 3 mois a compter du present PV
- Perimetre : Correction des anomalies de conformite au CDC
- Delais de correction : Bloquant 48h, Majeur 5 jours, Mineur 10 jours
- Contact support : contact@imotion-conseils.fr

### 10.2 Maintenance (si contractualisee)
- Forfait : [Nom du forfait]
- Tarif : [X] euros/mois HT
- SLA : [X]% de disponibilite garantie
- Demarrage : A l'issue de la periode de garantie

## ARTICLE 11 - DISPOSITIONS FINALES

Le present Proces-Verbal est etabli en deux exemplaires originaux.
Il fait partie integrante des documents contractuels du projet.

Tout litige relatif au present PV sera regi par les dispositions du Contrat de prestation (article 14 - Loi applicable et litiges).

---

## SIGNATURES

Fait a _________________, le [Date]

| | Pour le Prestataire | Pour le Client |
|---|---|---|
| Societe | IMOTION Creator Studio | [Entreprise client] |
| Nom | _________________ | [Nom client] |
| Qualite | Directeur de projet | [Fonction] |
| Date | _________________ | _________________ |
| Signature | *(precede de "Lu et approuve")* | *(precede de "Lu et approuve")* |

---

Proces-Verbal genere par IMOTION Creator Studio le [date]
IMOTION Creator Studio | SAS au capital de 10 000 euros | 123 Avenue de l'Innovation, 75008 Paris | www.imotion-studio.com

---

INSTRUCTIONS :
- CHAQUE livrable du CDC doit etre verifie individuellement
- Les criteres de conformite doivent etre objectifs et mesurables
- Les reserves doivent etre classees par gravite avec delais de correction
- Le PV doit etre juridiquement opposable (signatures, dates, references)
- Croiser systematiquement avec le Contrat pour les effets juridiques
- Inclure les donnees reelles du projet (outils, budget, delais)
- NE JAMAIS utiliser d'emojis`;
  }

  if (type === "devis") {
    return `Genere un Devis Commercial professionnel, detaille et conforme au droit commercial francais pour ce projet (Template IMOTION Creator Studio V2) :

${base}

## STRUCTURE OBLIGATOIRE DU DEVIS

# PAGE DE GARDE / EN-TETE

## DEVIS N. [Numero auto-genere]

| Date d'emission | Validite | Reference projet |
|---|---|---|
| [Date du jour] | 30 jours | [Code projet] |

| EMETTEUR | DESTINATAIRE |
|---|---|
| IMOTION Creator Studio | [Entreprise client] |
| SAS au capital de 10 000 euros | [Nom du contact] |
| 123 Avenue de l'Innovation, 75008 Paris | [Fonction] |
| SIRET: XXX XXX XXX 000XX | [Adresse client] |
| TVA: FR XX XXX XXX XXX | [Email client] |
| contact@imotion-conseils.fr | [Telephone client] |

**OBJET DU DEVIS** : [Nom du projet] - Type : [Type de projet]

---

# Phase BUILD - Realisation

Conception, developpement et mise en production de votre projet digital.

| Designation | Qte | P.U. HT | Total HT |
|---|---|---|---|
| [Type projet] - Forfait de base | 1 | [base_price] euros | [base_price] euros |
| Conception UX/UI, developpement, tests, deploiement | | | |
| **Options additionnelles :** | | | |
| - [Nom option 1] | 1 | [prix] euros | [prix] euros |
| - [Nom option 2] | 1 | [prix] euros | [prix] euros |
| **SOUS-TOTAL BUILD HT** | | | **[build_total] euros** |

Si remise applicable :
| Remise exceptionnelle : -[X]% (-[montant] euros) |
|---|
| Motif : [raison de la remise] |

---

# Phase RUN - Maintenance (recommande)

Hebergement, monitoring, mises a jour de securite et evolutions mineures incluses.

| Forfait | Engagement | Prix mensuel HT |
|---|---|---|
| Essentiel | 12 mois | 199 euros/mois |
| Confort | 12 mois | 399 euros/mois |
| Premium | 12 mois | 799 euros/mois |

**Forfait recommande** : [Nom du forfait recommande] - [prix] euros/mois

---

# Recapitulatif Financier

| | Montant |
|---|---|
| Total BUILD HT | [build_total_after_discount] euros |
| TVA (20%) | [tva_amount] euros |
| **TOTAL TTC** | **[build_total_ttc] euros** |

---

# Echeancier de Paiement

| Etape | % | Montant TTC | Echeance |
|---|---|---|---|
| Acompte a la commande | 30% | [montant] euros | Signature |
| Validation maquettes | 20% | [montant] euros | +3 semaines |
| Livraison recette | 35% | [montant] euros | PV recette signe |
| Mise en production | 15% | [montant] euros | Go Live |

## Coordonnees Bancaires
IBAN : FR76 XXXX XXXX XXXX XXXX XXXX XXX
BIC : XXXXXXXX
Banque : Banque XXXX

---

# Delais de Realisation

Duree estimee : [duration_weeks_min] a [duration_weeks_max] semaines
Demarrage : Sous 2 semaines apres reception de l'acompte

---

# Conditions Generales (Extrait)

- Devis valable 30 jours a compter de sa date d'emission
- Garantie 3 mois post-livraison incluse (corrections des anomalies)
- Les delais sont indicatifs et dependent de la reactivite du client
- Tout travail supplementaire sera facture au tarif journalier de 750 euros HT
- Penalites de retard : 3 fois le taux legal + indemnite forfaitaire de 40 euros
- Les CGV completes sont annexees au present devis

---

# Acceptation du Devis

Pour acceptation, merci de retourner ce devis signe avec la mention "Bon pour accord".

| Date : | Signature et cachet : |
|---|---|
| _______________ | (precede de "Bon pour accord") |

---
Devis genere par IMOTION Creator Studio le [date]
IMOTION Creator Studio | SAS au capital de 10 000 euros | 123 Avenue de l'Innovation, 75008 Paris | www.imotion-studio.com

---

INSTRUCTIONS :
- Les montants doivent etre REALISTES et bases sur les donnees de pricing du projet
- Si des donnees de pricing existent dans le contexte, utiliser les montants exacts
- Sinon, estimer en fonction du type et de la complexite du projet
- Chaque ligne doit etre detaillee et justifiable
- L'echelonnement DOIT toujours etre 30/20/35/15
- NE JAMAIS utiliser d'emojis`;
  }

  if (type === "contrat") {
    return `Genere un Contrat de Prestation de Services Numeriques COMPLET, detaille et conforme au droit francais :

${base}

## STRUCTURE OBLIGATOIRE DU CONTRAT (Template IMOTION Creator Studio V2)

# CONTRAT DE PRESTATION DE SERVICES NUMERIQUES

**N. [Numero auto-genere]**

---

## ENTRE LES SOUSSIGNES

**IMOTION Creator Studio**, Societe par Actions Simplifiee (SAS)
- Siege social : 123 Avenue de l'Innovation, 75008 Paris
- SIRET : XXX XXX XXX 000XX | RCS Paris B XXX XXX XXX
- Capital social : 10 000 euros
- TVA intracommunautaire : FR XX XXX XXX XXX
- Representee par son representant legal dument habilite
- Ci-apres denommee "Le Prestataire"

D'une part,

ET

**[Entreprise client]**, [Forme juridique]
- Siege social : [Adresse]
- SIRET : [SIRET client]
- Representee par [Nom], en qualite de [Fonction]
- Ci-apres denommee "Le Client"

D'autre part,

Les Parties sont ci-apres denommees individuellement une "Partie" et collectivement les "Parties".

---

## PREAMBULE

Le Client a exprime le besoin de developper un projet digital dont les specifications sont detaillees dans le Cahier des Charges valide par les deux Parties.

Projet concerne : [Nom du projet]

Suite a la phase de decouverte realisee via la plateforme IMOTION Creator Studio, un Cahier des Charges a ete etabli (ref. [reference CDC]).

Le Prestataire declare disposer des competences, moyens et ressources necessaires pour realiser la prestation objet du present contrat.

Les Parties ont donc convenu de ce qui suit :

## ARTICLE 1 - OBJET DU CONTRAT

Le present contrat a pour objet de definir les conditions dans lesquelles le Prestataire s'engage a realiser pour le compte du Client le projet suivant :

**[Nom du projet]** - Type : [Type de projet]

La prestation comprend notamment :
- [Liste detaillee des livrables principaux bases sur le CDC]

## ARTICLE 2 - DOCUMENTS CONTRACTUELS

Les documents contractuels sont, par ordre de priorite decroissante :
1. Le present contrat et ses eventuels avenants
2. Le Cahier des Charges (ref. [reference])
3. Le devis accepte (ref. [reference])
4. Les Conditions Generales de Vente annexees

En cas de contradiction entre ces documents, le document de rang superieur prevaut.

## ARTICLE 3 - DUREE ET PLANNING

### 3.1 Date de demarrage
La prestation debutera a compter de la reception de l'acompte prevu a l'article 5.

### 3.2 Duree previsionnelle
Duree estimee : [duration_weeks_min] a [duration_weeks_max] semaines

Cette duree est indicative et pourra etre adaptee en fonction de la reactivite du Client dans les phases de validation.

## ARTICLE 4 - PRIX

Le prix total de la prestation est fixe comme suit :

| | Montant |
|---|---|
| Developpement (HT) | [final_price] euros |
| TVA (20%) | [tva_amount] euros |
| **TOTAL TTC** | **[total_ttc] euros** |

Ce prix est ferme et definitif pour le perimetre defini au Cahier des Charges.

## ARTICLE 5 - MODALITES DE PAIEMENT

Le paiement s'effectuera selon l'echeancier suivant :

| Etape | % | Montant TTC | Echeance |
|---|---|---|---|
| Acompte | 30% | [montant] euros | Signature |
| Maquettes validees | 20% | [montant] euros | Validation design |
| Livraison recette | 35% | [montant] euros | PV recette signe |
| Mise en production | 15% | [montant] euros | Go Live |

Paiement par virement bancaire sous 15 jours a compter de la date de facturation.

## ARTICLE 6 - OBLIGATIONS DU PRESTATAIRE

Le Prestataire s'engage a :
- Realiser la prestation conformement au Cahier des Charges valide
- Respecter les delais convenus, sous reserve de la reactivite du Client
- Informer le Client de l'avancement via des points reguliers (a minima hebdomadaires)
- Livrer un produit fonctionnel et conforme aux specifications
- Assurer une garantie de 3 mois apres la mise en production

## ARTICLE 7 - OBLIGATIONS DU CLIENT

Le Client s'engage a :
- Fournir les elements necessaires dans les delais convenus (contenus, visuels, acces...)
- Designer un interlocuteur unique habilite pour les validations
- Valider les livrables dans un delai de 5 jours ouvres maximum
- Regler les factures aux echeances prevues
- Informer le Prestataire de tout changement impactant le projet

## ARTICLE 8 - PROPRIETE INTELLECTUELLE

### 8.1 Cession de droits
A complet paiement du prix, le Prestataire cede au Client :
- Le code source developpe specifiquement pour le projet
- Les elements graphiques crees sur-mesure pour le projet
- Les droits de reproduction, representation et adaptation pour tous supports

### 8.2 Exclusions
Le Prestataire conserve la propriete de :
- Ses outils, methodes et composants reutilisables preexistants
- Les bibliotheques et frameworks open source utilises
- Son savoir-faire et ses methodologies

## ARTICLE 9 - CONFIDENTIALITE

Les Parties s'engagent a garder confidentielles toutes les informations de nature commerciale, technique, financiere ou strategique echangees dans le cadre du present contrat.

Cette obligation perdure pendant 2 ans apres la fin du contrat.

## ARTICLE 10 - GARANTIE

Le Prestataire garantit le bon fonctionnement de la solution pendant 3 mois a compter de la mise en production.

Cette garantie couvre :
- La correction des anomalies bloquantes et majeures
- Les ajustements mineurs necessaires a la conformite au CDC

Sont exclus : les evolutions fonctionnelles, les anomalies dues a une mauvaise utilisation, les problemes lies a l'environnement du Client.

## ARTICLE 11 - LIMITATION DE RESPONSABILITE

La responsabilite du Prestataire est limitee au montant total du contrat.

Le Prestataire ne pourra etre tenu responsable des :
- Dommages indirects (perte de chiffre d'affaires, perte de donnees...)
- Retards causes par le Client (fourniture tardive des elements, validation...)
- Problemes lies aux prestataires tiers (hebergeur, services externes...)

## ARTICLE 12 - RESILIATION

### 12.1 Resiliation pour manquement grave
En cas de manquement grave par l'une des Parties, l'autre Partie pourra resilier le contrat de plein droit par lettre recommandee avec accuse de reception, apres mise en demeure restee sans effet pendant 15 jours.

### 12.2 Consequences de la resiliation
En cas de resiliation anticipee :
- Les prestations realisees restent acquises et facturees
- Les elements produits sont remis au Client (sous reserve de paiement)
- Les sommes versees ne sont pas remboursees (sauf faute du Prestataire)

## ARTICLE 13 - PROTECTION DES DONNEES PERSONNELLES

Le Prestataire s'engage a respecter le Reglement General sur la Protection des Donnees (RGPD) et la loi Informatique et Libertes.

En tant que sous-traitant au sens du RGPD, le Prestataire s'engage a :
- Traiter les donnees uniquement selon les instructions du Client
- Garantir la confidentialite des donnees traitees
- Mettre en oeuvre les mesures de securite appropriees
- Notifier toute violation de donnees dans les 72 heures
- Supprimer ou restituer les donnees en fin de contrat

## ARTICLE 14 - LOI APPLICABLE ET LITIGES

Le present contrat est regi par le droit francais.

En cas de litige relatif a l'interpretation ou a l'execution du present contrat, les Parties s'engagent a rechercher une solution amiable. A defaut d'accord amiable dans un delai de 30 jours, le litige sera soumis aux tribunaux competents de Paris.

---

## SIGNATURES

Fait en deux exemplaires originaux.

A _________________, le [Date]

| | Pour le Prestataire | Pour le Client |
|---|---|---|
| Societe | IMOTION Creator Studio | [Entreprise client] |
| Nom | _________________ | [Nom client] |
| Date | _________________ | _________________ |
| Signature | *(precede de "Lu et approuve")* | *(precede de "Lu et approuve")* |

---

## ANNEXE - CONDITIONS GENERALES DE VENTE

### Article 1 - Champ d'application
Les presentes CGV s'appliquent a toutes les prestations de services conclues par IMOTION Creator Studio. Le Client reconnait avoir pris connaissance des presentes CGV et les accepte sans reserve.

### Article 2 - Prix et paiement
2.1. Les prix sont indiques en euros HT. TVA applicable : 20%.
2.2. Paiement selon l'echeancier defini au devis.
2.3. Penalites de retard : 3 fois le taux d'interet legal + indemnite forfaitaire de 40 euros.
2.4. Aucun escompte pour paiement anticipe.

### Article 3 - Delais de realisation
3.1. Les delais indiques sont indicatifs.
3.2. Les delais commencent a courir a reception de l'acompte et des elements necessaires.
3.3. Tout retard imputable au Client prolonge d'autant les delais.

### Article 4 - Obligations du Client
4.1. Fournir des informations exactes et a jour.
4.2. Designer un interlocuteur unique habilite.
4.3. Valider les livrables sous 5 jours ouvres.

### Article 5 - Propriete intellectuelle
5.1. Transfert conditionne au paiement integral.
5.2. Le Prestataire conserve ses outils et composants reutilisables.
5.3. Le Prestataire peut mentionner la realisation a titre de reference.

### Article 6 - Garantie et responsabilite
6.1. Garantie de bon fonctionnement : 3 mois post-livraison.
6.2. Responsabilite limitee au montant du contrat.
6.3. Pas de responsabilite pour dommages indirects.

### Article 7 - Confidentialite
Les parties s'engagent a la confidentialite pendant 2 ans apres la fin du contrat.

### Article 8 - Force majeure
Aucune partie ne sera responsable en cas de force majeure au sens de l'article 1218 du Code civil.

### Article 9 - Resiliation
9.1. Resiliation pour manquement grave apres mise en demeure.
9.2. Les sommes versees restent acquises au Prestataire.

### Article 10 - Protection des donnees
Conformement au RGPD. Contact : contact@imotion-conseils.fr

### Article 11 - Droit applicable et juridiction
Droit francais. Competence exclusive des tribunaux de Paris.

*CGV en vigueur au 01/01/2026 - IMOTION Creator Studio*

---

Contrat genere par IMOTION Creator Studio le [date]
IMOTION Creator Studio | SAS au capital de 10 000 euros | 123 Avenue de l'Innovation, 75008 Paris | www.imotion-studio.com

---

INSTRUCTIONS JURIDIQUES :
- Chaque clause DOIT etre conforme au droit francais en vigueur
- Cite les articles de loi pertinents entre parentheses
- Le contrat doit etre PROTECTEUR pour IMOTION Creator Studio tout en etant EQUILIBRE
- Les clauses abusives doivent etre evitees
- Adapte le contenu aux specificites du projet (montants, delais, livrables)
- Le format doit suivre EXACTEMENT la structure V2 : 14 articles + annexe CGV
- NE JAMAIS utiliser d'emojis`;
  }

  return `Genere un document professionnel detaille en Markdown pour IMOTION Creator Studio :

${base}

Structure obligatoire :
1. Identification des parties (IMOTION Creator Studio comme prestataire)
2. Preambule et contexte
3. Objet du document
4. Description detaillee des livrables
5. Calendrier d'execution (jalons)
6. Prix et modalites de paiement
7. Obligations du prestataire
8. Obligations du client
9. Propriete intellectuelle
10. Confidentialite
11. Garantie et maintenance
12. Resiliation
13. Clause de force majeure
14. Loi applicable et juridiction
15. Signatures (espace reserve)

NE JAMAIS utiliser d'emojis.`;
}

// ─── Guide Technique Opérationnel — compagnon du CDC ──────────────────────────
// Généré en arrière-plan après chaque CDC, non-bloquant pour la réponse client.
// Utilise PIXEL (architecture build) + contexte STRATOS existant.
async function generateTechGuide(params: {
  supabase: ReturnType<typeof createClient>;
  lovableApiKey: string;
  projectId: string;
  project: Record<string, unknown>;
  client: Record<string, unknown> | null;
  discoveryData: Record<string, unknown>;
  pricingContext: string;
  stratosContext: string;
  parentDocId: string;
  userId: string;
}): Promise<void> {
  const { supabase, lovableApiKey, projectId, project, client, discoveryData, pricingContext, stratosContext, parentDocId, userId } = params;

  let pixelContext = "";
  const pixelBrief = `Tu es PIXEL, architecte IA senior. Produis une analyse technique complète et un guide de build pour ce projet.

## Projet : ${project.name}
- Client : ${(client as Record<string, unknown>)?.company_name || (client as Record<string, unknown>)?.full_name || "N/A"} — Secteur : ${(client as Record<string, unknown>)?.industry || "Non spécifié"}
- Budget : ${project.estimated_budget_min || "?"} - ${project.estimated_budget_max || "?"}€
## Données de découverte :
${JSON.stringify(discoveryData).slice(0, 4000)}
${pricingContext}

LIVRABLE : Stack recommandée + tableau outils/configuration + prompts build complets (Lovable/Cursor) + schéma données + pièges + checklist recette. Max 1500 mots.`;

  try {
    const pixelResult = await callMistralAgent("pixel", [{ role: "user", content: pixelBrief }], {
      maxTokens: 2500, timeoutMs: 50_000,
    });
    if (pixelResult?.content) pixelContext = pixelResult.content;
  } catch (err) {
    console.warn("[guide-technique] PIXEL call failed:", err);
  }

  const guidePrompt = `Génère le Guide Technique Opérationnel pour ce projet (document INTERNE équipe build).

## PROJET : ${project.name} (Réf. ${project.code})
- Client : ${(client as Record<string, unknown>)?.full_name || "N/A"} — ${(client as Record<string, unknown>)?.company_name || "N/A"}
- Secteur : ${(client as Record<string, unknown>)?.industry || "Non spécifié"}
- Budget build : ${project.estimated_budget_min || "?"} - ${project.estimated_budget_max || "?"}€

## DONNÉES DE DÉCOUVERTE
${JSON.stringify(discoveryData, null, 2).slice(0, 3000)}

${pricingContext}
${stratosContext ? `## ANALYSE STRATÉGIQUE (STRATOS)\n${stratosContext}` : ""}
${pixelContext ? `## ANALYSE TECHNIQUE ET GUIDE BUILD (PIXEL)\n${pixelContext}` : ""}

Référence le CDC parent ID: ${parentDocId}. Document CONFIDENTIEL — usage interne IMOTION uniquement.`;

  const aiBody = {
    model: "openai/gpt-5",
    messages: [
      { role: "system", content: getSystemPrompt("guide_technique") },
      { role: "user", content: guidePrompt },
    ],
    stream: false,
  };

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(aiBody),
  });

  if (!response.ok) {
    console.error("[guide-technique] AI call failed:", response.status);
    return;
  }

  const aiData = await response.json();
  const content = aiData.choices?.[0]?.message?.content || "";
  if (!content) return;

  const { error } = await supabase.from("documents").insert({
    project_id: projectId,
    type: "guide_technique",
    name: `Guide Technique Opérationnel — ${project.name}`,
    description: `Document interne compagnon du CDC — généré le ${new Date().toLocaleDateString("fr-FR")}`,
    content_markdown: content,
    storage_path: `${projectId}/guide_technique_${Date.now()}.md`,
    status: "draft",
    created_by: userId,
    requires_signature: false,
  });

  if (error) {
    console.error("[guide-technique] DB insert failed:", error.message);
  } else {
    console.log(`[guide-technique] Document créé pour projet ${projectId}`);
  }
}
