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
    const { projectId, type, stream: shouldStream, regenerateSection, sectionContext } = await req.json();
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

    return new Response(JSON.stringify({ success: true, document_id: doc.id, content, estimate: estimate ? { final_price: estimate.final_price, duration: `${estimate.duration_weeks_min}-${estimate.duration_weeks_max} semaines` } : null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Helpers ─────────────────────────────────────────────

function getDocName(type: string, projectName: string): string {
  const names: Record<string, string> = {
    cdc: "Cahier des Charges",
    proposal: "Proposition Commerciale",
    contract: "Contrat de Prestation",
    tech_recommendation: "Recommandation Technique & Prompt",
    pricing: "Proposition Tarifaire Détaillée",
    contract_fr: "Contrat de Prestation (Droit Français)",
  };
  return `${names[type] || type} - ${projectName}`;
}

function getSystemPrompt(type: string): string {
  const prompts: Record<string, string> = {
    cdc: `Tu es un directeur de projet digital senior dans une agence web premium (IMOTION). Tu rédiges des Cahiers des Charges exhaustifs, professionnels et immédiatement exploitables.

RÈGLES DE RÉDACTION :
- Ton professionnel mais accessible, jamais de jargon inutile
- Chaque section doit apporter de la valeur concrète et actionnable
- Utilise des tableaux Markdown pour structurer les données comparatives
- Utilise des listes à puces pour les spécifications
- Inclus des métriques, KPIs et critères de succès mesurables
- Personnalise chaque section avec les données réelles du client
- Le document doit être prêt à être envoyé au client tel quel
- Rédige en français impeccable
- Format Markdown structuré avec titres hiérarchiques (# ## ### ####)`,

    tech_recommendation: `Tu es un architecte technique senior et CTO d'une agence digitale premium (IMOTION). Tu maîtrises parfaitement l'écosystème des outils no-code, low-code et code (Lovable, Cursor, Bolt, Replit, Webflow, Framer, Bubble, Supabase, Firebase, Vercel, etc.) ainsi que les stacks classiques (React, Next.js, Vue, Node.js, Python, etc.).

RÈGLES :
- Recommande les outils les PLUS ADAPTÉS au projet, pas les plus populaires
- Justifie chaque choix technique avec des arguments concrets
- Fournis un prompt technique COMPLET et prêt à l'emploi pour chaque outil recommandé
- Pense en termes de ROI, maintenabilité, scalabilité et budget client
- Rédige en français technique mais compréhensible`,

    pricing: `Tu es un directeur commercial senior d'une agence digitale premium (IMOTION) spécialisé dans le chiffrage de projets digitaux. Tu connais parfaitement les TJM du marché français, les coûts réels de développement, et tu sais construire des devis détaillés, rentables et compétitifs.

RÈGLES :
- Chiffrage réaliste basé sur les TJM marché français 2024-2025
- Chaque ligne de devis doit être justifiable auprès du client
- Inclus TOUJOURS une phase de tests/QA dans le budget
- Présente 3 options tarifaires (Essentiel, Recommandé, Premium)
- Détaille les conditions de paiement et les garanties
- Rédige en français professionnel`,

    contract_fr: `Tu es un juriste spécialisé en droit du numérique et droit des contrats français. Tu rédiges des contrats de prestation de services numériques conformes au droit français, protecteurs pour le prestataire (IMOTION) tout en étant équilibrés et respectueux du client.

RÈGLES JURIDIQUES IMPÉRATIVES :
- Conforme au Code civil français (articles 1101 et suivants)
- Conforme au Code de la consommation si B2C
- Conforme au RGPD (Règlement UE 2016/679)
- Conforme à la loi pour une République numérique (2016)
- Conforme à la loi Informatique et Libertés
- Clauses de limitation de responsabilité conformes à la jurisprudence
- Clause pénale conforme à l'article 1231-5 du Code civil
- Clause attributive de juridiction valide
- Rédige en français juridique précis mais lisible`,
  };

  return prompts[type] || `Tu es un expert en rédaction de documents professionnels pour agences digitales premium. Tu génères des documents structurés, élégants et prêts à l'envoi en Markdown. Rédige en français impeccable.`;
}

function formatConversationForPrompt(messages: any[]): string {
  if (!messages || messages.length === 0) return "Aucun échange enregistré.";

  const phaseNames: Record<number, string> = {
    1: "Présentation & Contexte",
    2: "Objectifs & Cibles",
    3: "Fonctionnalités & Contenu",
    4: "Design & Identité visuelle",
    5: "Technique & Intégrations",
    6: "Budget & Planning",
    7: "Synthèse & Validation",
  };

  const byPhase: Record<number, any[]> = {};
  for (const m of messages) {
    const phase = m.phase || 1;
    if (!byPhase[phase]) byPhase[phase] = [];
    byPhase[phase].push(m);
  }

  let result = "";
  for (const [phase, msgs] of Object.entries(byPhase)) {
    const pNum = Number(phase);
    result += `\n### Phase ${pNum} — ${phaseNames[pNum] || "Autre"}\n`;
    for (const m of msgs) {
      const label = m.role === "user" ? "CLIENT" : "ASSISTANT";
      result += `**${label}** : ${m.content.substring(0, 500)}\n\n`;
    }
  }
  return result;
}

function buildPromptFromTemplate(template: any, project: any, client: any, discoveryData: any, conversationContext: string): string {
  let content = template.content;
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
    conversation_context: conversationContext,
  };
  for (const [key, value] of Object.entries(vars)) {
    content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return `À partir du template suivant, génère le document complet en Markdown:\n\n${content}`;
}

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
    return `Génère un Cahier des Charges professionnel, exhaustif et immédiatement exploitable pour ce projet. Utilise TOUTES les informations issues des échanges client ci-dessous pour personnaliser chaque section au maximum. Le CDC doit refléter précisément le besoin profond du client et viser juste dès la première version.

${base}

## STRUCTURE OBLIGATOIRE DU CAHIER DES CHARGES

Génère le document avec EXACTEMENT ces sections, dans cet ordre :

# 1. PAGE DE GARDE
- Titre du projet, référence, client, date, version, mention confidentiel
- Logo IMOTION (mentionner l'espace réservé)

# 2. RÉSUMÉ EXÉCUTIF
- Synthèse en 5-8 lignes du projet, objectifs clés et enjeux business
- Ce résumé doit convaincre un décideur en 30 secondes

# 3. CONTEXTE & ENJEUX
- Présentation de l'entreprise cliente et son marché
- Problématiques actuelles identifiées lors des échanges
- Enjeux business et opportunités à saisir
- Pourquoi ce projet maintenant (urgence, concurrence, évolution du marché)

# 4. ANALYSE DU BESOIN CLIENT
- Objectifs stratégiques et opérationnels (utiliser les verbatim du client)
- Cibles utilisateurs / Personas (créer 2-3 personas détaillés si données suffisantes)
- Parcours utilisateurs principaux (user journeys)
- Attentes fonctionnelles exprimées VS besoins latents identifiés

# 5. BENCHMARK & POSITIONNEMENT
- Analyse de 3-5 concurrents/références (si mentionnés dans les échanges)
- Positionnement différenciant souhaité par le client
- Best practices du secteur à intégrer
- Opportunités de différenciation identifiées

# 6. IDENTITÉ & IMAGE DE MARQUE
- Univers de marque souhaité (ton, valeurs, personnalité)
- Références visuelles et inspirations citées par le client
- Charte graphique existante / à créer
- Ton éditorial et ligne directrice du contenu
- Émotions et perceptions à véhiculer

# 7. ARBORESCENCE & ARCHITECTURE DE L'INFORMATION
- Plan du site / Structure des écrans (sous forme d'arborescence Markdown)
- Navigation principale et secondaire
- Hiérarchie du contenu
- Points d'entrée et parcours critiques

# 8. SPÉCIFICATIONS FONCTIONNELLES
### 8.1 MVP (Version 1)
- Tableau des fonctionnalités : | Fonctionnalité | Description | Priorité | Complexité |
- User stories principales (format : En tant que... je veux... afin de...)

### 8.2 Version 2 (Évolutions)
- Fonctionnalités différées avec justification
- Roadmap d'évolution

### 8.3 Back-office / Administration
- Fonctionnalités d'administration requises
- Gestion de contenu et droits d'accès

# 9. SPÉCIFICATIONS UX/UI
- Principes UX directeurs
- Responsive design : breakpoints et priorités
- Accessibilité (niveau WCAG visé)
- Interactions et micro-animations clés
- Wireframes textuels des pages principales (décrire la structure)

# 10. ARCHITECTURE TECHNIQUE
- Stack technologique recommandée (avec justification)
- Architecture applicative (front-end, back-end, BDD)
- Hébergement et infrastructure
- Performance : objectifs de temps de chargement
- Sécurité : mesures et conformité RGPD
- Scalabilité et évolutivité

# 11. INTÉGRATIONS & APIs
- Tableau : | Service | Type d'intégration | Priorité | Complexité estimée |
- Flux de données entre systèmes
- Contraintes techniques identifiées

# 12. CONTENU & STRATÉGIE ÉDITORIALE
- Types de contenus à produire
- Volume de contenus (pages, articles, fiches produit...)
- Responsabilités (qui fournit quoi)
- SEO : mots-clés cibles et stratégie

# 13. PLANNING PRÉVISIONNEL
- Tableau des phases : | Phase | Durée | Livrables | Jalons |
- Dates clés et milestones
- Dépendances et chemins critiques
- Date de livraison cible

# 14. BUDGET ESTIMATIF
Présenter 3 options sous forme de tableau comparatif :

| Poste | Essentiel | Recommandé | Premium |
|-------|-----------|------------|---------|
| ... | ... | ... | ... |

- Détail par poste (conception, design, développement, contenu, recette)
- Conditions de paiement proposées (30/40/30 par exemple)
- Ce qui est inclus / exclu dans chaque option

# 15. CRITÈRES DE SUCCÈS & KPIs
- Tableau : | KPI | Objectif | Méthode de mesure | Fréquence |
- Critères d'acceptation du projet
- Indicateurs de performance à 3, 6, 12 mois

# 16. MÉTHODOLOGIE & GOUVERNANCE
- Méthodologie de projet (Agile/Scrum adaptée)
- Instances de pilotage (comités, fréquence)
- Outils de collaboration
- Process de validation et de recette

# 17. CONDITIONS & PROCHAINES ÉTAPES
- Validité de la proposition
- Conditions de modification du périmètre
- Processus de validation du CDC
- Prochaines étapes immédiates après signature

---

INSTRUCTIONS FINALES :
- Utilise les VRAIS mots du client tirés des échanges, pas du générique
- Si une information manque, propose une hypothèse raisonnable clairement identifiée avec [À CONFIRMER]
- Sois précis sur les chiffres : délais en jours ouvrés, budgets en €, performances en ms
- Le document doit faire entre 15 et 30 pages imprimées
- Chaque section doit apporter de la valeur et ne pas être du remplissage`;
  }

  if (type === "proposal") {
    return `Génère une Proposition Commerciale professionnelle et convaincante en Markdown :

${base}

Structure obligatoire :
1. Page de garde (projet, client, date, référence)
2. Mot d'accompagnement personnalisé
3. Présentation IMOTION (expertise, références, équipe)
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
- Le contrat doit être PROTECTEUR pour le prestataire (IMOTION) tout en étant ÉQUILIBRÉ
- Les clauses abusives au sens du Code de la consommation doivent être évitées
- Adapte le contenu aux spécificités du projet (montants, délais, livrables)`;
  }

  return `Génère un Contrat de Prestation professionnel en Markdown :

${base}

Structure obligatoire :
1. Identification des parties
2. Préambule et contexte
3. Objet du contrat
4. Description des livrables (détaillée)
5. Calendrier d'exécution (jalons)
6. Prix et modalités de paiement
7. Obligations du prestataire
8. Obligations du client
9. Propriété intellectuelle
10. Confidentialité
11. Garantie et maintenance
12. Résiliation
13. Clause de force majeure
14. Loi applicable et juridiction
15. Signatures (espace réservé)`;
}
