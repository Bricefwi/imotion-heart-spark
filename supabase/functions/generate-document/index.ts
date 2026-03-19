import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getDocName, formatConversationForPrompt, buildPromptFromTemplate } from "./helpers.ts";

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
    let estimate: any = null;
    let pricingConfig: any = null;
    let maintenancePlan: any = null;

    const { data: currentEstimate } = await supabase
      .from("project_estimates")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_current", true)
      .single();

    if (currentEstimate) {
      estimate = currentEstimate;
      
      if (estimate.project_type_code) {
        const { data: pc } = await supabase
          .from("pricing_config")
          .select("*")
          .eq("code", estimate.project_type_code)
          .single();
        pricingConfig = pc;
      }
      
      if (estimate.recommended_maintenance_code) {
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
      const buildTotal = estimate.final_price;
      const tvaAmount = Math.round(buildTotal * 0.20);
      const buildTotalTTC = buildTotal + tvaAmount;
      
      pricingContext = `
## DONNÉES TARIFAIRES (du système de pricing)
- **Type de projet** : ${pricingConfig?.name || estimate.project_type_code}
- **Prix de base** : ${estimate.base_price?.toLocaleString('fr-FR')}€
- **Options sélectionnées** : ${JSON.stringify(estimate.selected_options)}
- **Total options** : ${estimate.options_total?.toLocaleString('fr-FR')}€
- **Prix final HT** : ${estimate.final_price?.toLocaleString('fr-FR')}€
- **TVA (20%)** : ${tvaAmount.toLocaleString('fr-FR')}€
- **Prix final TTC** : ${buildTotalTTC.toLocaleString('fr-FR')}€
- **Durée estimée** : ${estimate.duration_weeks_min}-${estimate.duration_weeks_max} semaines
- **Complexité** : ${estimate.complexity_score}/5
- **Forfait maintenance recommandé** : ${maintenancePlan?.name || 'Non défini'} (${maintenancePlan?.monthly_price || 0}€/mois)
- **Fourchette type** : ${pricingConfig?.price_range_min?.toLocaleString('fr-FR')}€ - ${pricingConfig?.price_range_max?.toLocaleString('fr-FR') || 'Sur devis'}€
- **Échelonnement** : Acompte 30% (${Math.round(buildTotal * 0.30)}€), Maquettes 20% (${Math.round(buildTotal * 0.20)}€), Recette 35% (${Math.round(buildTotal * 0.35)}€), Production 15% (${Math.round(buildTotal * 0.15)}€)
`;
    }

    const prompt = template
      ? buildPromptFromTemplate(template, project, client, discoveryData, conversationContext)
      : buildDocumentPrompt(docType, project, client, discoveryData, conversationContext + pricingContext);

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
      throw new Error("AI generation failed");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    const docName = getDocName(docType, project.name);
    const { data: doc, error: docErr } = await supabase.from("documents").insert({
      project_id: projectId, type: docType, name: docName,
      description: `Généré automatiquement le ${new Date().toLocaleDateString("fr-FR")}`,
      storage_path: `${projectId}/${docType}_${Date.now()}.md`,
      status: "draft", created_by: userData.user.id,
      requires_signature: docType === "contract" || docType === "contract_fr" || docType === "proposal" || docType === "pricing",
    }).select("id").single();

    if (docErr) throw docErr;

    // Also save to generated_documents if estimate exists
    if (estimate) {
      await supabase.from("generated_documents").insert({
        project_id: projectId,
        estimate_id: estimate.id,
        document_type: docType,
        template_code: pricingTemplate ? docType : null,
        content_markdown: content,
        variables_snapshot: { estimate, pricingConfig, maintenancePlan },
        status: "draft",
        requires_signature: docType === "contrat" || docType === "devis",
      });
    }

    const statusMap: Record<string, string> = {
      cdc: "cdc_draft", proposal: "proposal_sent", contract: "contract_pending",
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

    return new Response(JSON.stringify({ success: true, document_id: doc.id, content, estimate: estimate ? { final_price: estimate.final_price, duration: `${estimate.duration_weeks_min}-${estimate.duration_weeks_max} semaines` } : null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-document error:", e);
    // Never expose internal error details to clients
    return new Response(JSON.stringify({ error: "An internal error occurred while generating the document. Please try again later." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Helpers ─────────────────────────────────────────────

// getDocName is imported from ./helpers.ts

function getSystemPrompt(type: string): string {
  const prompts: Record<string, string> = {
    cdc: `Tu es un directeur de projet digital senior chez IMOTION Creator Studio, agence digitale premium specialisee en solutions no-code et IA. Tu rediges des Cahiers des Charges exhaustifs, professionnels et immediatement exploitables.

REGLES DE REDACTION :
- Ton professionnel mais accessible, jamais de jargon inutile
- Chaque section doit apporter de la valeur concrete et actionnable
- Utilise des tableaux Markdown pour structurer les donnees comparatives
- Utilise des listes a puces pour les specifications
- Inclus des metriques, KPIs et criteres de succes mesurables
- Personnalise chaque section avec les donnees reelles du client
- Le document doit etre pret a etre envoye au client tel quel
- Redige en francais impeccable
- Format Markdown structure avec titres hierarchiques (# ## ### ####)
- NE JAMAIS utiliser d'emojis
- Le prestataire est "IMOTION Creator Studio" (pas "IMOTION Conseil")
- Site web : www.clarivi.io`,

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

    tech_recommendation: `Tu es un architecte technique senior et CTO d'IMOTION Creator Studio, agence digitale premium. Tu maitrises parfaitement l'ecosysteme no-code, low-code et code.

REGLES :
- Recommande les outils les PLUS ADAPTES au projet
- Justifie chaque choix technique avec des arguments concrets
- Fournis un prompt technique COMPLET et pret a l'emploi
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
  };

  return prompts[type] || `Tu es un expert en redaction de documents professionnels pour IMOTION Creator Studio, agence digitale premium. Tu generes des documents structures et prets a l'envoi en Markdown. Redige en francais impeccable. NE JAMAIS utiliser d'emojis.`;
}

// formatConversationForPrompt is imported from ./helpers.ts

// buildPromptFromTemplate is imported from ./helpers.ts

function buildDocumentPrompt(type: string, project: any, client: any, discoveryData: any, conversationContext: string): string {
  const base = `
## INFORMATIONS PROJET
- **Nom** : ${project.name} (Réf. ${project.code})
- **Client** : ${client?.full_name || "N/A"}
- **Entreprise** : ${client?.company_name || "N/A"}
- **Secteur** : ${client?.industry || "Non spécifié"}
- **Phase actuelle** : ${project.current_phase}/7
- **Score qualification** : ${project.qualification_score || "N/A"}/5
- **Budget estimé** : ${project.estimated_budget_min || "?"} - ${project.estimated_budget_max || "?"}€
- **Deadline souhaitée** : ${project.desired_deadline || "Non définie"}
- **Notes internes** : ${project.internal_notes || "Aucune"}

## DONNÉES DE DÉCOUVERTE STRUCTURÉES
${JSON.stringify(discoveryData, null, 2)}

## HISTORIQUE COMPLET DES ÉCHANGES CLIENT
${conversationContext}
`;

  if (type === "cdc") {
    return `Genere un Cahier des Charges professionnel, exhaustif et immediatement exploitable pour ce projet. Utilise TOUTES les informations issues des echanges client ci-dessous pour personnaliser chaque section au maximum.

${base}

## STRUCTURE OBLIGATOIRE DU CAHIER DES CHARGES (Template IMOTION Creator Studio V2)

Le document DOIT suivre EXACTEMENT cette structure en 14 sections :

# PAGE DE GARDE
- Titre centre : CAHIER DES CHARGES
- Sous-titre : [Nom du projet]
- Tableau info : Reference [Code projet] | Date d'emission [Date] | Version 1.0 | Validite 30 jours
- Section PRESTATAIRE : IMOTION Creator Studio
- Section CLIENT : Entreprise, Nom complet, Fonction, Adresse, Email, Telephone
- Pied de page : IMOTION Creator Studio | SAS au capital de 10 000 euros | 123 Avenue de l'Innovation, 75008 Paris | SIRET: XXX XXX XXX 000XX | RCS Paris B XXX XXX XXX | TVA: FR XX XXX XXX XXX | www.imotion-studio.com

# SOMMAIRE
Liste numerotee des 14 sections du document

# 1. Resume Executif
## 1.1 Contexte du Projet
Synthese du projet en 8-12 lignes. Doit convaincre un decideur en 30 secondes.
## 1.2 Objectif Principal
Objectif principal en une phrase percutante
## 1.3 Type de Solution
| Type de projet | Budget estime |
|---|---|
| [Type detecte depuis pricing_config] | [Fourchette de prix] |

# 2. Presentation du Client
## 2.1 Informations Generales
| Information | Valeur |
|---|---|
| Raison sociale | [company_name] |
| Forme juridique | [A confirmer] |
| Secteur d'activite | [industry] |
| Effectif | [company_size] |
| Chiffre d'affaires | [A confirmer] |
| Site web actuel | [website] |
| Adresse | [A confirmer] |
| SIRET | [A confirmer] |
## 2.2 Contact Principal
| Nom complet | [full_name] |
|---|---|
| Fonction | [company_role] |
| Email | [email] |
| Telephone | [phone] |
| Disponibilites | [A confirmer] |
## 2.3 Positionnement et Valeurs
Mots-cles de marque, valeurs fondamentales, differenciateurs cles (extraits des echanges)

# 3. Contexte et Enjeux
## 3.1 Situation Actuelle
Description detaillee de la situation actuelle du client
## 3.2 Declencheur du Projet
Ce qui a declenche ce projet, pourquoi maintenant
## 3.3 Enjeux Strategiques
Liste des enjeux strategiques identifies lors de la decouverte
## 3.4 Consequences de l'Inaction
Risques concrets si le projet n'est pas realise

# 4. Analyse des Besoins
## 4.1 Problematiques Identifiees
Liste detaillee avec verbatim du client quand possible
## 4.2 Impact Business
Chiffrer l'impact quand possible (temps perdu, CA manque, insatisfaction)
## 4.3 Solutions Precedemment Tentees
Ce qui a ete fait avant et pourquoi ca n'a pas fonctionne
## 4.4 Attentes Exprimees
Liste structuree des attentes du client

# 5. Objectifs du Projet
## 5.1 Objectifs Business
Objectifs mesurables SMART (minimum 3-5)
## 5.2 Objectifs Utilisateurs
Actions concretes attendues par les utilisateurs finaux
## 5.3 Indicateurs de Succes (KPIs)
| KPI | Objectif cible | Methode de mesure |
|---|---|---|
Minimum 5-8 KPIs mesurables et pertinents

# 6. Perimetre Fonctionnel
## 6.1 Fonctionnalites Essentielles (Must Have)
Liste detaillee avec description de chaque fonctionnalite indispensable (minimum 8-12)
## 6.2 Fonctionnalites Souhaitees (Should Have)
Fonctionnalites a valeur ajoutee significative
## 6.3 Fonctionnalites Optionnelles (Nice to Have)
Fonctionnalites envisageables en phase 2
## 6.4 Hors Perimetre
Elements explicitement exclus de ce projet et pourquoi

# 7. Specifications Techniques
## 7.1 Ecosysteme Actuel
Outils actuellement utilises par le client
## 7.2 Integrations Requises
Liste des integrations avec description et priorite
## 7.3 Contraintes Techniques
Contraintes specifiques identifiees
## 7.4 Exigences Non-Fonctionnelles
| Exigence | Niveau attendu | Priorite |
|---|---|---|
| Performance (temps de chargement) | < 3 secondes | Haute |
| Disponibilite (uptime) | 99.5% minimum | Haute |
| Compatibilite navigateurs | Chrome, Firefox, Safari, Edge | Haute |
| Responsive design | Mobile, tablette, desktop | Haute |
| Accessibilite | WCAG 2.1 AA | Moyenne |
| SEO Score | Lighthouse > 80 | Moyenne |

# 8. Identite Visuelle et UX
## 8.1 Image Souhaitee
Univers visuel, ton, ambiance souhaites
## 8.2 Sites d'Inspiration
References citees par le client avec analyse de ce qui plait
## 8.3 Charte Graphique Existante
Elements existants a respecter ou a creer
## 8.4 Personas Utilisateurs
2-4 personas detailles : nom fictif, age, profession, objectif, frustration principale

# 9. Contraintes et Risques
## 9.1 Contraintes Projet
- Budget : Estimation [final_price] euros HT | Fourchette [price_range]
- Delai : Echeance souhaitee [deadline] | Duree estimee [duration_weeks_min]-[duration_weeks_max] semaines
- Ressources : Ressources internes disponibles
## 9.2 Analyse des Risques
| Risque | Probabilite | Impact | Mitigation |
|---|---|---|---|
| Retard de fourniture contenus | Moyenne | Eleve | Planning contenus dedie |
| Evolutions de perimetre | Elevee | Moyen | Process de change request |
| Indisponibilite decideurs | Faible | Eleve | Points de validation planifies |
| Problemes techniques imprevus | Faible | Moyen | Architecture robuste + tests |
Minimum 5-8 risques identifies avec plans de mitigation concrets

# 10. Planning Previsionnel
## 10.1 Phases du Projet
| Phase | Description | Duree | Livrable |
|---|---|---|---|
| 1. Cadrage | Kickoff, planning detaille | 1 semaine | Backlog valide |
| 2. Conception UX/UI | Wireframes, maquettes | 2-3 semaines | Maquettes validees |
| 3. Developpement | Sprints de developpement | [duration] sem. | Recette client |
| 4. Tests et QA | Tests fonctionnels, corrections | 1-2 semaines | PV de recette |
| 5. Deploiement | Mise en production | 1 semaine | Go Live |
| 6. Garantie | Support post-lancement | 3 mois | Fin de garantie |
## 10.2 Jalons Cles
Liste des jalons avec dates previsionnelles

# 11. Budget et Estimation
## 11.1 Detail de l'Estimation
| Poste | Montant HT |
|---|---|
| [Type projet] - Forfait de base | [base_price] euros |
| Options additionnelles : | |
| - [Nom option] ([prix] euros) | |
| TOTAL ESTIMATION HT | [final_price] euros |
## 11.2 Forfait Maintenance Recommande
| Forfait | Prix mensuel | SLA garanti |
|---|---|---|
| [Nom forfait] | [prix] euros/mois | [SLA]% |

# 12. Gouvernance Projet
## 12.1 Decideurs et Parties Prenantes
Liste des decideurs et parties prenantes identifies
## 12.2 Processus de Validation
Circuit de validation decrit
## 12.3 Organisation des Echanges
| Type | Frequence | Participants | Format |
|---|---|---|---|
| Point de suivi | Hebdomadaire | Chef de projet + Client | Visio 30 min |
| Demo sprint | Bi-mensuel | Equipe + Decideurs | Visio 1h |
| Comite de pilotage | Mensuel | Direction + Sponsors | Reunion |
| Recette | A chaque livraison | Client + QA | Atelier |

# 13. Conditions de Realisation
## 13.1 Prerequis
- Validation du present Cahier des Charges
- Signature du devis et du contrat
- Versement de l'acompte (30%)
- Designation d'un interlocuteur unique
- Fourniture des elements de depart (contenus, acces, charte...)
## 13.2 Garanties
- Garantie de bon fonctionnement : 3 mois apres mise en production
- Correction des anomalies bloquantes et majeures
- Support par email pendant la periode de garantie
- Documentation technique et guide utilisateur
## 13.3 Responsabilites du Client
- Fournir les contenus dans les delais convenus
- Valider les livrables sous 5 jours ouvres maximum
- Participer activement aux points de suivi
- Regler les factures aux echeances prevues

# 14. Annexes
## 14.1 Documents de Reference
1. Transcript de la session de decouverte
2. Elements visuels fournis par le client
3. Benchmark concurrentiel (si realise)
## 14.2 Glossaire
| Terme | Definition |
|---|---|
| CDC | Cahier des Charges - Document de reference du projet |
| MVP | Minimum Viable Product - Version minimale fonctionnelle |
| Sprint | Cycle de developpement de 2 semaines |
| Recette | Phase de tests et validation par le client |
| Go Live | Mise en production definitive |
| SLA | Service Level Agreement - Niveau de service garanti |

# VALIDATION DU CAHIER DES CHARGES
Espace signatures : Pour le Prestataire (IMOTION Creator Studio) | Pour le Client ([Entreprise])
Date : _______________
Document genere automatiquement par IMOTION Creator Studio le [date]
Ce document est valable 30 jours a compter de sa date d'emission.

---

INSTRUCTIONS FINALES :
- Utilise les VRAIS mots du client tires des echanges, pas du generique
- Si une information manque, propose une hypothese raisonnable identifiee avec [A CONFIRMER]
- Sois precis sur les chiffres : delais en jours ouvres, budgets en euros
- Le document doit faire entre 15 et 25 pages imprimees (minimum 20 sections/sous-sections detaillees)
- Chaque section doit apporter de la valeur concrete
- NE JAMAIS utiliser d'emojis
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

# 4. ARCHITECTURE TECHNIQUE DÉTAILLÉE
- Diagramme textuel de l'architecture (Markdown)
- Flux de données
- Points d'intégration
- Stratégie de déploiement

# 5. RISQUES TECHNIQUES & MITIGATIONS
| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|

# 6. ESTIMATION DE L'EFFORT TECHNIQUE
| Phase | Complexité | Jours estimés | Profil requis |
|-------|-----------|---------------|---------------|

---
INSTRUCTIONS : Le prompt technique doit être IMMÉDIATEMENT utilisable. Il doit contenir assez de détail pour qu'un développeur (ou un outil IA) puisse démarrer le build sans poser de questions supplémentaires.`;
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
| contact@imotion-studio.com | [Telephone client] |

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
Conformement au RGPD. Contact : contact@imotion-studio.com

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
