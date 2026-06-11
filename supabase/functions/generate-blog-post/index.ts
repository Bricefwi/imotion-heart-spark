import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://imotion-conseils.fr",
  "https://www.imotion-conseils.fr",
  "https://app.imotion-conseils.fr",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: getCorsHeaders(req) });

  try {
    // Auth: accept either CRON_SECRET or admin JWT
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // If not CRON, verify admin
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader || "" } },
      });
      const { data: userData, error: authErr } = await userClient.auth.getUser();
      if (authErr || !userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      // Check admin role
      const userId = userData.user.id;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["admin", "super_admin"]);
      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ error: "Admin only" }), {
          status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
    }

    // Get pending posts from editorial calendar
    const today = new Date().toISOString().split("T")[0];
    // Pick up both 'planned' (due) and previously 'failed' entries so retries happen automatically
    const { data: pendingPosts, error } = await supabase
      .from("blog_editorial_calendar")
      .select("*")
      .in("status", ["planned", "failed"])
      .lte("planned_date", today)
      .order("planned_date", { ascending: true })
      .limit(2);

    if (error) throw error;
    if (!pendingPosts || pendingPosts.length === 0) {
      return new Response(JSON.stringify({ message: "Aucun article à générer", generated: 0, results: [] }), {
        status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const results = [];

    for (const post of pendingPosts) {
      await supabase
        .from("blog_editorial_calendar")
        .update({ status: "generating" })
        .eq("id", post.id);

      try {
        const systemPrompt = `Tu es un expert en transformation digitale et accompagnement de projets chez IMOTION Conseil.

Tu rédiges des articles de blog professionnels, engageants et utiles pour des entrepreneurs et décideurs qui veulent réussir leur projet digital.

STYLE D'ÉCRITURE :
- Ton professionnel mais accessible, pas de jargon inutile
- Phrases courtes et percutantes
- Utilise des exemples concrets et des anecdotes
- Tutoie le lecteur pour créer de la proximité
- Sois direct et actionnable
- Évite les banalités et les phrases creuses

RÈGLES ANTI-HALLUCINATION (CRITIQUES) :
- NE JAMAIS inventer de statistiques, chiffres ou pourcentages précis (ex: "78% des PME…")
- NE JAMAIS citer d'études, rapports ou organismes spécifiques que tu ne peux pas vérifier
- Si tu donnes un ordre de grandeur, utilise des formulations prudentes : "selon certaines estimations", "on observe fréquemment que", "de nombreux experts s'accordent à dire"
- NE JAMAIS inventer de témoignages clients, noms de personnes ou d'entreprises
- Les "mini cas clients" doivent être présentés comme des scénarios illustratifs : "Prenons l'exemple d'un entrepreneur qui…" (pas "Notre client X a obtenu…")
- NE JAMAIS promettre de résultats chiffrés ("économisez 50%", "doublez votre CA")
- Préférer les formulations basées sur l'expérience terrain : "Dans notre expérience", "Les retours que nous observons montrent"
- Avant d'affirmer un fait, pose-toi la question : est-ce vérifiable ? Si non, reformule en conseil ou observation

STRUCTURE DE L'ARTICLE :
1. TITRE : Accrocheur, promet une valeur claire (60 caractères max)
2. EXTRAIT : Résumé engageant qui donne envie de lire (150-200 caractères)
3. CONTENU en Markdown avec :
   - Introduction (hook + problème + promesse)
   - 3-5 sections avec H2
   - Sous-sections avec H3 si nécessaire
   - Exemples concrets sous forme de scénarios illustratifs (jamais de noms inventés)
   - Encadrés "À retenir" avec > blockquote
   - Conclusion avec call-to-action vers IMOTION Discovery Pro
4. TEMPS DE LECTURE estimé (en minutes)`;

        const userPrompt = `Rédige un article de blog sur le sujet suivant :

TITRE PRÉVU : ${post.title}
CATÉGORIE : ${post.category}
ANGLE : ${post.angle}
MOTS-CLÉS À INTÉGRER : ${(post.keywords || []).join(", ")}

L'article doit faire environ 1200-1500 mots et apporter une vraie valeur au lecteur.
À la fin, inclus un appel à l'action vers IMOTION Discovery Pro pour aider le lecteur à clarifier son projet.`;

        // Retry with model fallback on transient errors (429 / 5xx)
        const modelsToTry = [
          "google/gemini-3-flash-preview",
          "google/gemini-2.5-flash",
          "google/gemini-2.5-pro",
        ];
        const aiBody = {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "create_blog_article",
              description: "Create a structured blog article",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Article title, max 60 chars" },
                  excerpt: { type: "string", description: "Engaging excerpt, 150-200 chars" },
                  content: { type: "string", description: "Full article content in Markdown" },
                  reading_time: { type: "number", description: "Estimated reading time in minutes" },
                },
                required: ["title", "excerpt", "content", "reading_time"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "create_blog_article" } },
        };

        let aiResponse: Response | null = null;
        let lastErrText = "";
        let lastStatus = 0;
        outer: for (const model of modelsToTry) {
          for (let attempt = 0; attempt < 3; attempt++) {
            const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ model, ...aiBody }),
            });
            if (r.ok) { aiResponse = r; break outer; }
            lastStatus = r.status;
            lastErrText = await r.text();
            console.warn(`[generate-blog-post] AI ${model} attempt ${attempt + 1} → ${r.status}: ${lastErrText.slice(0, 200)}`);
            // 4xx (sauf 429) = inutile de re-tenter ce modèle
            if (r.status !== 429 && r.status < 500) break;
            await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
          }
        }

        if (!aiResponse) {
          throw new Error(`AI error ${lastStatus}: ${lastErrText}`);
        }


        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall) throw new Error("No tool call in AI response");

        const article = JSON.parse(toolCall.function.arguments);

        const { data: newPost, error: insertError } = await supabase
          .from("blog_posts")
          .insert({
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            category: post.category,
            reading_time: article.reading_time || 5,
            tags: post.keywords || [],
            is_published: true,
            published_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        await supabase
          .from("blog_editorial_calendar")
          .update({ status: "published", generated_post_id: newPost.id })
          .eq("id", post.id);

        results.push({ success: true, title: article.title, slug: newPost.slug });
    } catch (genError: unknown) {
        const errMsg = genError instanceof Error ? genError.message : String(genError);
        console.error("Generation error:", genError);
        await supabase
          .from("blog_editorial_calendar")
          .update({ status: "failed" })
          .eq("id", post.id);
        results.push({ success: false, title: post.title, error: errMsg });
      }
    }

    return new Response(JSON.stringify({
      generated: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    }), { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });

  } catch (error: unknown) {
    console.error("CRON Error:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred during blog post generation." }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
