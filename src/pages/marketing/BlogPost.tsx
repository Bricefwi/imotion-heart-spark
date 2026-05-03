/**
 * Marketing — Article de blog (rapatrié depuis lovelib).
 *
 * MOCK : table marketing pas encore migrée. Sert un contenu statique pour démo.
 * TODO: brancher sur supabase.from('mkt_blog_articles').select('*').eq('slug', slug).
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChartBlock } from "@/components/marketing/ChartBlock";
import { useToast } from "@/hooks/use-toast";

interface MktPost {
  slug: string;
  title: string;
  excerpt: string;
  content_md: string;
  category: string;
  published_at: string;
  author_name: string;
  author_role: string;
}

const MOCK_POSTS: Record<string, MktPost> = {
  "audit-digital-pourquoi": {
    slug: "audit-digital-pourquoi",
    title: "Pourquoi un audit digital change la donne en 2026",
    excerpt: "L'audit digital n'est plus un luxe. Voici comment il devient un levier de croissance pour les PME.",
    category: "Articles",
    published_at: "2026-04-12",
    author_name: "Marc Delaunay",
    author_role: "Consultant Stratégie IMOTION",
    content_md: `## Le contexte 2026

En 2026, **84% des PME** considèrent leur stratégie digitale comme insuffisante. Pourtant, peu d'entre elles
investissent dans un diagnostic structuré avant d'agir.

### Les trois pertes invisibles

1. **CAC qui dérive** sans qu'on s'en rende compte
2. **Churn caché** dans les cohortes récentes
3. **Opportunités SEO** non exploitées

## Que mesure-t-on dans un audit IMOTION ?

Notre méthodologie évalue **17 dimensions** réparties sur 4 axes : acquisition, conversion, rétention, monétisation.

\`\`\`chart
{
  "title": "Répartition des gains identifiés (médiane sur 50 audits)",
  "type": "bar",
  "xKey": "axe",
  "yKeys": ["gain"],
  "data": [
    { "axe": "Acquisition", "gain": 32 },
    { "axe": "Conversion", "gain": 41 },
    { "axe": "Rétention", "gain": 18 },
    { "axe": "Monétisation", "gain": 9 }
  ]
}
\`\`\`

## Conclusion

L'audit n'est pas une fin : c'est le **point de départ d'une stratégie réaliste et chiffrée**.
`,
  },
};

export default function MarketingBlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<MktPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    // TODO: supabase.from('mkt_blog_articles').select('*').eq('slug', slug).maybeSingle()
    const t = setTimeout(() => {
      setPost(MOCK_POSTS[slug] ?? null);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [slug]);

  const handlePDFExport = () => {
    toast({ title: "Bientôt", description: "L'export PDF sera disponible après migration des fonctions marketing." });
  };

  const handleLinkedInShare = () => {
    if (!post) return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post.title);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${text}`, "_blank", "width=600,height=600");
  };

  if (loading) {
    return (
      <main className="container py-32">
        <p className="text-center text-muted-foreground">Chargement…</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="container py-32 text-center space-y-6">
        <h1 className="text-3xl font-bold">Article introuvable</h1>
        <Button asChild variant="flame">
          <Link to="/marketing/blog">Retour au blog</Link>
        </Button>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title} – Blog IMOTION</title>
        <meta name="description" content={post.excerpt} />
      </Helmet>

      <main className="container py-20 md:py-24 max-w-4xl">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-2">
          <Button variant="ghost" onClick={() => navigate("/marketing/blog")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour au blog
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePDFExport}>
              <Download className="w-4 h-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" onClick={handleLinkedInShare}>
              <Share2 className="w-4 h-4 mr-2" /> Partager
            </Button>
          </div>
        </div>

        <article id="article-content">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>
          <div className="flex items-center gap-3 mb-8 text-muted-foreground text-sm flex-wrap">
            <span>{new Date(post.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
            <span>•</span>
            <span>{post.author_name}</span>
            <span>•</span>
            <span>{post.author_role}</span>
          </div>

          <div className="relative w-full h-72 mb-10 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 flex items-center justify-center">
            <span className="text-7xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent opacity-40">
              {post.title.charAt(0)}
            </span>
          </div>

          <div className="prose prose-lg max-w-none">
            <ReactMarkdown
              components={{
                h2: ({ children }) => <h2 className="text-3xl font-bold mt-12 mb-6">{children}</h2>,
                h3: ({ children }) => <h3 className="text-2xl font-semibold mt-8 mb-4">{children}</h3>,
                p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
                li: ({ children }) => <li className="mb-2">{children}</li>,
                code: ({ className, children }) => {
                  const match = /language-chart/.exec(className || "");
                  if (match) {
                    try {
                      const data = JSON.parse(String(children).replace(/\n$/, ""));
                      return <ChartBlock title={data.title} type={data.type} data={data.data} xKey={data.xKey} yKeys={data.yKeys} />;
                    } catch {
                      return <code className="bg-muted px-2 py-1 rounded text-sm font-mono border">{children}</code>;
                    }
                  }
                  return <code className="bg-muted px-2 py-1 rounded text-sm font-mono border">{children}</code>;
                },
                pre: ({ children }) => <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 border">{children}</pre>,
              }}
            >
              {post.content_md}
            </ReactMarkdown>
          </div>
        </article>
      </main>
    </>
  );
}
