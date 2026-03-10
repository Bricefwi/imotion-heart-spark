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

    // Get ALL conversation messages for context
    const { data: allMessages } = await supabase
      .from("messages")
      .select("role, content, phase, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

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
    const conversationContext = formatConversationForPrompt(allMessages || []);

    const prompt = template
      ? buildPromptFromTemplate(template, project, client, discoveryData, conversationContext)
      : buildDocumentPrompt(docType, project, client, discoveryData, conversationContext);

    // Common AI call setup
    const aiBody = {
      model: "google/gemini-2.5-flash",
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

      await supabase.from("activities").insert({
        user_id: userData.user.id, project_id: projectId,
        action: "document", description: `${docName} généré pour "${project.name}"`,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ document_id: doc.id })}\n\n`));
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();

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
  if (type === "cdc") {
    return `Tu es un directeur de projet digital senior dans une agence web premium (IMOTION). Tu rédiges des Cahiers des Charges exhaustifs, professionnels et immédiatement exploitables.

RÈGLES DE RÉDACTION :
- Ton professionnel mais accessible, jamais de jargon inutile
- Chaque section doit apporter de la valeur concrète et actionnable
- Utilise des tableaux Markdown pour structurer les données comparatives
- Utilise des listes à puces pour les spécifications
- Inclus des métriques, KPIs et critères de succès mesurables
- Personnalise chaque section avec les données réelles du client
- Le document doit être prêt à être envoyé au client tel quel
- Rédige en français impeccable
- Format Markdown structuré avec titres hiérarchiques (# ## ### ####)`;
  }
  return `Tu es un expert en rédaction de documents professionnels pour agences digitales premium. Tu génères des documents structurés, élégants et prêts à l'envoi en Markdown. Rédige en français impeccable.`;
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
