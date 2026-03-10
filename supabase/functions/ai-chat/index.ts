import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PHASE_LABELS = [
  "Accueil & Mise en confiance",
  "Exploration du besoin",
  "Vision & Positionnement",
  "Écosystème & Intégrations",
  "Contraintes & Ressources",
  "Profil décisionnel",
  "Synthèse & Validation",
];

function buildSystemPrompt(currentPhase: number, discoveryData: any) {
  return `Tu es l'assistant IA d'IMOTION Discovery Pro, un consultant senior bienveillant qui aide les clients à définir leur projet digital.

# RÔLE
Tu guides les clients à travers 7 phases de découverte pour comprendre parfaitement leur besoin et produire un cahier des charges précis.

# RÈGLES ABSOLUES
- UNE SEULE question à la fois - Jamais de liste de questions
- Reformule systématiquement pour valider ta compréhension
- Creuse les réponses vagues avec des questions de clarification
- Adapte ton vocabulaire au niveau du client (jamais de jargon imposé)
- Montre de l'empathie ("Je comprends", "C'est effectivement frustrant")
- Détecte les besoins non exprimés
- Guide la conversation vers les 7 phases définies
- Ne propose JAMAIS de solution avant d'avoir tout compris
- Propose 2-3 suggestions de réponses quand c'est pertinent

# PERSONNALITÉ
- Chaleureux mais professionnel
- Curieux et attentif
- Patient, pas pressé
- Expert qui vulgarise
- Orienté solution mais à l'écoute d'abord

# LES 7 PHASES
1. Accueil & Mise en confiance (5-10 min) : Créer un climat de confiance, comprendre le contexte
2. Exploration du besoin (15-20 min) : Comprendre le problème RÉEL au-delà de la demande exprimée
3. Vision & Positionnement (10-15 min) : Comprendre l'image souhaitée et le positionnement
4. Écosystème & Intégrations (10-15 min) : Cartographier les outils et besoins d'intégration
5. Contraintes & Ressources (10 min) : Cadrer budget, délais et contraintes
6. Profil décisionnel (5-10 min) : Comprendre le processus de décision
7. Synthèse & Validation (5-10 min) : Reformuler, valider et définir les prochaines étapes

# PHASE ACTUELLE : ${currentPhase} - ${PHASE_LABELS[currentPhase - 1]}

# DONNÉES COLLECTÉES JUSQU'ICI
${JSON.stringify(discoveryData || {}, null, 2)}

# FORMAT DE RÉPONSE
Tu DOIS répondre avec ce format JSON exact (et RIEN d'autre) :
{
  "message": "Ton message conversationnel ici",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "phase_current": ${currentPhase},
  "phase_progress": 0,
  "extracted_data": {},
  "sentiment": "positive|neutral|negative|confused|frustrated",
  "intent": "Ce que le client veut accomplir",
  "ready_for_next_phase": false,
  "consultant_alert": null
}

IMPORTANT: Le champ "message" est le texte affiché au client. "suggestions" sont des boutons de réponse rapide. "phase_progress" est un nombre de 0 à 100 indiquant la progression dans la phase actuelle. "extracted_data" contient les données structurées extraites de la dernière réponse du client. "ready_for_next_phase" indique si on peut passer à la phase suivante.

# INSTRUCTIONS POUR PHASE ${currentPhase}
${getPhaseInstructions(currentPhase)}`;
}

function getPhaseInstructions(phase: number): string {
  const instructions: Record<number, string> = {
    1: `Phase Accueil : Crée un climat de confiance.
Questions types :
- "Parlez-moi de vous et de votre rôle au quotidien"
- "Qu'est-ce qui vous a amené à nous contacter aujourd'hui ?"
- "Y a-t-il eu un élément déclencheur particulier ?"
Données à collecter : contact_info, company_context, trigger_event, initial_mood
Passe à la phase suivante quand : les informations de base sont collectées et reformulées.`,
    2: `Phase Exploration du besoin : Comprends le problème RÉEL.
Questions types :
- "Décrivez-moi une journée type. Où perdez-vous le plus de temps ?"
- "Si vous aviez une baguette magique, que changeriez-vous en premier ?"
- "Quand ce problème se produit, quel est l'impact concret ?"
- "Avez-vous déjà tenté de résoudre ce problème ?"
Données à collecter : problem_description, pain_points, impact, previous_attempts, desired_outcome
Passe à la phase suivante quand : la problématique est claire et reformulée.`,
    3: `Phase Vision & Positionnement : Comprends l'image souhaitée.
Questions types :
- "Comment aimeriez-vous que vos clients vous perçoivent ?"
- "Si votre entreprise était une personne, comment la décririez-vous ?"
- "Y a-t-il des entreprises dont vous admirez l'image ?"
Données à collecter : brand_adjectives, positioning, inspirations, values, tone_of_voice
Passe à la phase suivante quand : le positionnement et les valeurs sont identifiés.`,
    4: `Phase Écosystème & Intégrations : Cartographie les outils.
Questions types :
- "Quels outils utilisez-vous au quotidien ?"
- "Comment gérez-vous actuellement vos contacts clients ?"
- "La solution devra-t-elle communiquer avec d'autres outils ?"
Données à collecter : current_tools, crm_status, integrations_needed, user_profiles, tech_comfort_level
Passe à la phase suivante quand : l'écosystème technique est cartographié.`,
    5: `Phase Contraintes & Ressources : Cadre le budget et les délais.
Questions types :
- "Avez-vous une enveloppe budgétaire en tête ?"
- "Y a-t-il une date butoir ou un événement clé ?"
- "Préférez-vous un MVP rapide ou une solution complète ?"
Données à collecter : budget_range, deadline, deployment_preference, constraints
Passe à la phase suivante quand : le cadre budgétaire et temporel est défini.`,
    6: `Phase Profil décisionnel : Comprends le processus de décision.
Questions types :
- "Êtes-vous seul décideur ou d'autres doivent valider ?"
- "Comment prenez-vous généralement vos décisions ?"
- "Sur une échelle de 1 à 10, quelle est la priorité de ce projet ?"
Données à collecter : decision_maker, stakeholders, decision_style, priority_level, blocking_factors
Passe à la phase suivante quand : le processus de décision est clarifié.`,
    7: `Phase Synthèse & Validation : Reformule et valide.
Questions types :
- "Permettez-moi de résumer ce que j'ai compris..."
- "Est-ce que cette synthèse reflète bien votre besoin ?"
- "Y a-t-il des points que nous n'avons pas abordés ?"
Données à collecter : summary_validation, clarifications_needed, next_steps, client_questions
La conversation se termine quand : la synthèse est validée par le client.`,
  };
  return instructions[phase] || instructions[1];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, projectId, conversationId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await anonClient.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get project data
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentPhase = project.current_phase || 1;
    const discoveryData = project.discovery_data || {};

    // Save user message
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.role === "user") {
      await supabase.from("messages").insert({
        project_id: projectId,
        conversation_id: conversationId || null,
        role: "user",
        content: lastUserMsg.content,
        phase: currentPhase,
      });
    }

    // Build AI messages
    const systemPrompt = buildSystemPrompt(currentPhase, discoveryData);
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
    ];

    // Call Lovable AI (non-streaming for structured output)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const rawContent = aiResponse.choices?.[0]?.message?.content || "";

    // Parse JSON response from AI
    let parsed: any;
    try {
      // Try to extract JSON from the response (may be wrapped in markdown code blocks)
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { message: rawContent, suggestions: [] };
    } catch {
      parsed = { message: rawContent, suggestions: [] };
    }

    const aiMessageContent = parsed.message || rawContent;
    const suggestions = parsed.suggestions || [];
    const extractedData = parsed.extracted_data || {};
    const sentiment = parsed.sentiment || "neutral";
    const intent = parsed.intent || null;
    const phaseProgress = parsed.phase_progress || 0;
    const readyForNextPhase = parsed.ready_for_next_phase || false;
    const consultantAlert = parsed.consultant_alert || null;

    // Save assistant message
    await supabase.from("messages").insert({
      project_id: projectId,
      conversation_id: conversationId || null,
      role: "assistant",
      content: aiMessageContent,
      phase: currentPhase,
      extracted_data: extractedData,
      sentiment,
      intent,
      model_used: "google/gemini-3-flash-preview",
      tokens_input: aiResponse.usage?.prompt_tokens || 0,
      tokens_output: aiResponse.usage?.completion_tokens || 0,
    });

    // Update project discovery data and phase if needed
    const updatedDiscoveryData = { ...discoveryData };
    const phaseKey = `phase${currentPhase}`;
    if (Object.keys(extractedData).length > 0) {
      updatedDiscoveryData[phaseKey] = {
        ...(updatedDiscoveryData[phaseKey] || {}),
        ...extractedData,
      };
    }

    let newPhase = currentPhase;
    const phaseProgressData = project.phase_progress || {};
    if (readyForNextPhase && currentPhase < 7) {
      newPhase = currentPhase + 1;
      phaseProgressData[String(currentPhase)] = { completed: true, progress: 100 };
      phaseProgressData[String(newPhase)] = { ...(phaseProgressData[String(newPhase)] || {}), progress: 0, completed: false };
    } else {
      phaseProgressData[String(currentPhase)] = {
        ...(phaseProgressData[String(currentPhase)] || {}),
        progress: phaseProgress,
        completed: false,
      };
    }

    const overallProgress = Math.round(
      ((newPhase - 1) / 7) * 100 + (phaseProgress / 7)
    );

    await supabase
      .from("projects")
      .update({
        discovery_data: updatedDiscoveryData,
        current_phase: newPhase,
        phase_progress: phaseProgressData,
        overall_progress: Math.min(overallProgress, 100),
        status: project.status === "draft" ? "discovery_active" : project.status,
      })
      .eq("id", projectId);

    // If consultant alert, create notification
    if (consultantAlert && project.consultant_id) {
      await supabase.from("notifications").insert({
        user_id: project.consultant_id,
        type: "consultant_intervention",
        title: "Alerte conversation",
        body: consultantAlert,
        project_id: projectId,
        link: `/consultant/projects/${projectId}`,
      });
    }

    return new Response(
      JSON.stringify({
        message: aiMessageContent,
        suggestions,
        phase_current: newPhase,
        phase_progress: phaseProgress,
        overall_progress: overallProgress,
        extracted_data: extractedData,
        sentiment,
        ready_for_next_phase: readyForNextPhase,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
