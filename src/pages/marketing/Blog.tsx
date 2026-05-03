/**
 * Marketing — Blog (rapatrié depuis lovelib).
 *
 * MOCK : la table Clarivi `blog_articles` côté marketing (ou `mkt_blog_articles`)
 * n'est pas encore prête. On sert une liste d'articles statiques en attendant.
 * TODO: remplacer par `supabase.from('mkt_blog_articles').select(...)` une fois créée.
 */
import { Helmet } from "react-helmet";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildSEO } from "@/lib/marketing/seo";

interface MktArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  published_at: string;
  cover_url?: string;
}

const MOCK_ARTICLES: MktArticle[] = [
  { id: "1", slug: "audit-digital-pourquoi", title: "Pourquoi un audit digital change la donne en 2026", excerpt: "L'audit digital n'est plus un luxe. Voici comment il devient un levier de croissance pour les PME.", category: "articles", published_at: "2026-04-12" },
  { id: "2", slug: "cas-saas-b2b-cac", title: "Étude de cas : diviser son CAC par 2 en 6 mois (SaaS B2B)", excerpt: "Comment une scale-up SaaS a optimisé son acquisition payante grâce à notre méthodologie multi-canal.", category: "etudes-de-cas", published_at: "2026-03-28" },
  { id: "3", slug: "kpis-marketing-2026", title: "Les 10 KPIs marketing à suivre en 2026", excerpt: "Au-delà du CAC et du LTV, voici les indicateurs qui vont compter cette année.", category: "infographies", published_at: "2026-03-15" },
  { id: "4", slug: "ia-marketing-stratégie", title: "IA générative en marketing : quelle stratégie adopter ?", excerpt: "Tour d'horizon des cas d'usage concrets et des écueils à éviter.", category: "articles", published_at: "2026-02-20" },
  { id: "5", slug: "client-retail-omnicanal", title: "Cas client retail : 30% de CA en plus grâce à l'omnicanal", excerpt: "Une enseigne de mode reprend la main sur sa stratégie data et explose ses KPIs.", category: "cas-clients", published_at: "2026-02-05" },
  { id: "6", slug: "chiffres-acquisition-2026", title: "Chiffres clés acquisition B2B 2026", excerpt: "Benchmarks sectoriels : CAC, conversion, cycle de vente, win rate.", category: "chiffres-cles", published_at: "2026-01-22" },
];

const CATEGORY_LABELS: Record<string, string> = {
  articles: "Articles",
  "etudes-de-cas": "Études de cas",
  "cas-clients": "Cas clients",
  infographies: "Infographies",
  "chiffres-cles": "Chiffres clés",
};

export default function MarketingBlog() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get("cat");

  const articles = category ? MOCK_ARTICLES.filter((a) => a.category === category) : MOCK_ARTICLES;

  const seo = buildSEO({
    title: "Blog IMOTION – Études de cas, insights marketing & commerciaux",
    description: "Cas concrets, études de cas et insights pour optimiser vos opérations marketing et commerciales. Mises à jour régulières.",
    url: "/marketing/blog",
  });

  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonical} />
      </Helmet>

      <main className="container py-20 md:py-28">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Blog <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">IMOTION</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Cas concrets, études de cas et insights pour optimiser vos opérations marketing & commerciales.
          </p>
        </div>

        {articles.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Aucun article publié pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((a) => (
              <Card
                key={a.id}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden group border-2 hover:border-primary/40"
                onClick={() => navigate(`/marketing/blog/${a.slug}`)}
              >
                <div className="relative h-44 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 flex items-center justify-center">
                  <span className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent opacity-50">
                    {a.title.charAt(0)}
                  </span>
                </div>
                <CardContent className="p-6">
                  <Badge variant="outline" className="mb-3 text-primary border-primary/30">
                    {CATEGORY_LABELS[a.category] ?? a.category}
                  </Badge>
                  <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {a.title}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{a.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(a.published_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-primary font-medium">Lire →</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
