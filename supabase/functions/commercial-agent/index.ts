import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_KNOWLEDGE = `
Tu es l'assistant commercial IA d'IMOTION Creator Studio, un SaaS B2B qui aide les entrepreneurs et PME à structurer leur projet digital.

## CE QUE TU SAIS

### Produit
- IMOTION Creator Studio remplace le "brief" traditionnel par une conversation IA guidée en 7 phases
- Les 7 phases : Accueil → Besoin → Vision → Écosystème → Contraintes → Décision → Validation
- En ~45 minutes, l'utilisateur obtient un Cahier des Charges (CDC) professionnel de 15-30 pages
- Le CDC est 100% GRATUIT — aucune carte bancaire requise
- Le CDC appartient à l'utilisateur, aucun engagement

### Tarifs
- **CDC (DISCOVER)** : Gratuit. Coût pour nous ~0,50€ par CDC en ressources IA
- **BUILD** : Réalisation sur-mesure, 4 types de projets :
  - Site Vitrine : à partir de 2 490€ (fourchette 2 490€ - 6 000€), 3-5 semaines
  - E-commerce : à partir de 4 990€ (fourchette 4 990€ - 15 000€), 6-10 semaines
  - Application Web : à partir de 9 990€ (fourchette 9 990€ - 35 000€), 10-14 semaines
  - Plateforme : à partir de 25 000€, sur mesure
  - Inclus : Équipe dédiée, sprints agiles, livraison clé en main, garantie 3 mois, formation
  - Le prix final dépend du nombre de pages, du design, des fonctionnalités et intégrations
- **RUN** : Maintenance & évolution, 3 forfaits :
  - Essentiel : 199€/mois (sites vitrines) — hébergement, sécurité, sauvegarde, support email 48h, SLA 99%
  - Confort : 399€/mois (e-commerces/apps) — haute dispo, support 24h, 2h évolutions/mois, monitoring 24/7, SLA 99.5%
  - Premium : 799€/mois (plateformes critiques) — infra dédiée, support téléphone 4h, 5h évolutions/mois, account manager, SLA 99.9%
  - Le forfait RUN est optionnel, le client reste propriétaire de son code

### Types de projets réalisables
Sites vitrines, applications web et mobiles, plateformes SaaS, e-commerce, outils métiers, API et intégrations

### Processus
1. Landing page — découverte de la solution
2. Chat IA — 7 phases de découverte guidée (gratuit)
3. CDC généré — document professionnel complet (gratuit)
4. Appel qualification — 30 min avec un expert (gratuit)
5. Devis BUILD — si le client souhaite construire avec nous
6. Réalisation — sprints agiles
7. Maintenance RUN — optionnelle

### Pages du site
- / : Page d'accueil
- /fonctionnalites : Détail des fonctionnalités et du processus
- /tarifs : Tarifs et offres
- /blog : Articles et conseils
- /a-propos : À propos de l'entreprise
- /contact : Formulaire de contact
- /register : Inscription gratuite pour démarrer un CDC
- /login : Connexion

### FAQ courantes
- Le CDC est gratuit car le modèle repose sur la réalisation, pas la vente de documents
- Le CDC contient : contexte, objectifs, fonctionnalités, contraintes techniques, personas, architecture, estimation budgétaire, planning
- Pas d'obligation de passer par IMOTION pour la réalisation
- Email professionnel requis pour la génération du CDC
- La conversation peut être reprise plus tard, pas besoin de tout faire d'un coup

## RÈGLES DE COMPORTEMENT
- Sois chaleureux, professionnel et concis
- Réponds en français
- Ne fabrique JAMAIS de statistiques ou de chiffres non mentionnés ci-dessus
- Si tu ne sais pas, dis-le honnêtement et oriente vers la page /contact
- Propose des liens pertinents vers les pages du site quand c'est utile (format: [texte](/chemin))
- Encourage l'inscription gratuite quand c'est pertinent
- Ne parle jamais de concurrents
- Garde tes réponses courtes (2-4 phrases max sauf si l'utilisateur demande des détails)
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SITE_KNOWLEDGE },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessayez dans un instant." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporairement indisponible." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("commercial-agent error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
