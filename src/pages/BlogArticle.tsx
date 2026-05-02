import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowLeft, Share2, Linkedin, Twitter, LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Logo } from "@/components/Logo";
import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

const categoryLabels: Record<string, string> = {
  "expression-besoin": "Expression du besoin",
  "image-identite": "Image & Identité",
  "strategie": "Stratégie digitale",
  "cas-clients": "Cas clients",
  "outils": "Outils pratiques",
};

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const [readProgress, setReadProgress] = useState(0);
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: relatedPosts } = useQuery({
    queryKey: ["blog-related", post?.category, post?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, category, published_at, reading_time")
        .eq("is_published", true)
        .eq("category", post!.category)
        .neq("id", post!.id)
        .order("published_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!post,
  });

  // Track view
  useEffect(() => {
    if (slug) {
      supabase.rpc("increment_post_views", { post_slug: slug });
    }
  }, [slug]);

  // Reading progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Extract TOC from content
  useEffect(() => {
    if (post?.content) {
      const headings = post.content.match(/^#{2,3}\s.+$/gm) || [];
      setToc(
        headings.map((h) => {
          const level = h.startsWith("###") ? 3 : 2;
          const text = h.replace(/^#{2,3}\s/, "");
          const id = text.toLowerCase().replace(/[^a-zà-ÿ0-9]+/g, "-").replace(/^-|-$/g, "");
          return { id, text, level };
        })
      );
    }
  }, [post?.content]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Lien copié !");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4 max-w-2xl w-full px-4">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl font-display font-bold">Article introuvable</p>
        <Button asChild><Link to="/blog">Retour au blog</Link></Button>
      </div>
    );
  }

  const articleSchema = post ? {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image || undefined,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at,
    author: { "@type": "Person", name: post.author_name || "Équipe IMOTION" },
    publisher: {
      "@type": "Organization",
      name: "IMOTION Creator Studio",
      logo: { "@type": "ImageObject", url: "https://app.imotion-conseils.fr/favicon.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://app.imotion-conseils.fr/blog/${slug}` },
    wordCount: post.content?.split(/\s+/).length || 0,
    articleSection: categoryLabels[post.category] || post.category,
    keywords: post.tags?.join(", ") || "",
    inLanguage: "fr-FR",
  } : undefined;

  return (
    <div className="min-h-screen flex flex-col">
      {post && (
        <SEOHead
          title={post.title}
          description={post.excerpt}
          canonical={`/blog/${slug}`}
          type="article"
          image={post.cover_image || undefined}
          jsonLd={[
            articleSchema!,
            breadcrumbSchema([
              { name: "Accueil", url: "/" },
              { name: "Blog", url: "/blog" },
              { name: post.title, url: `/blog/${slug}` },
            ]),
          ]}
        />
      )}
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-muted">
        <div className="h-full gradient-primary transition-all duration-150" style={{ width: `${readProgress}%` }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center"><Logo size="md" /></Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/blog"><ArrowLeft className="h-4 w-4 mr-1" />Blog</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Article header */}
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
                <span>›</span>
                <span>{categoryLabels[post.category] || post.category}</span>
              </div>
              <Badge variant="outline" className="mb-4">{categoryLabels[post.category]}</Badge>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{post.author_name}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {post.published_at ? format(new Date(post.published_at), "d MMMM yyyy", { locale: fr }) : "—"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.reading_time} min de lecture
                </span>
                {post.view_count > 0 && (
                  <>
                    <span>•</span>
                    <span>{post.view_count} vues</span>
                  </>
                )}
              </div>
              {post.cover_image && (
                <motion.div
                  className="mt-8 rounded-2xl overflow-hidden shadow-lg"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full h-auto max-h-[400px] object-cover"
                  />
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Content + Sidebar */}
        <section className="py-12">
          <div className="container max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              {/* Main content */}
              <motion.article
                className="lg:col-span-3 prose prose-lg max-w-none
                  prose-headings:font-display prose-headings:font-bold
                  prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                  prose-li:text-muted-foreground
                  prose-strong:text-foreground
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <ReactMarkdown
                  components={{
                    h2: ({ children, ...props }) => {
                      const text = String(children);
                      const id = text.toLowerCase().replace(/[^a-zà-ÿ0-9]+/g, "-").replace(/^-|-$/g, "");
                      return <h2 id={id} {...props}>{children}</h2>;
                    },
                    h3: ({ children, ...props }) => {
                      const text = String(children);
                      const id = text.toLowerCase().replace(/[^a-zà-ÿ0-9]+/g, "-").replace(/^-|-$/g, "");
                      return <h3 id={id} {...props}>{children}</h3>;
                    },
                  }}
                >
                  {post.content}
                </ReactMarkdown>

                {/* Share */}
                <div className="mt-12 pt-8 border-t flex items-center gap-4">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Share2 className="h-4 w-4" /> Partager
                  </span>
                  <Button variant="outline" size="icon" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank")}>
                    <Linkedin className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, "_blank")}>
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>

                {/* CTA Box */}
                <div className="mt-12 rounded-2xl gradient-primary p-8 text-primary-foreground text-center">
                  <h3 className="font-display text-2xl font-bold mb-3">Prêt à passer à l'action ?</h3>
                  <p className="opacity-90 mb-6">Clarifiez votre projet digital avec notre accompagnement intelligent.</p>
                  <Button variant="secondary" size="lg" asChild>
                    <Link to="/register">Démarrer ma découverte</Link>
                  </Button>
                </div>
              </motion.article>

              {/* Sidebar */}
              <aside className="space-y-6 hidden lg:block">
                {/* TOC */}
                {toc.length > 0 && (
                  <Card className="sticky top-20">
                    <CardContent className="p-5">
                      <h3 className="font-display font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Sommaire</h3>
                      <nav className="space-y-2">
                        {toc.map((item) => (
                          <a
                            key={item.id}
                            href={`#${item.id}`}
                            className={`block text-sm text-muted-foreground hover:text-primary transition-colors ${item.level === 3 ? "pl-4" : ""}`}
                          >
                            {item.text}
                          </a>
                        ))}
                      </nav>
                    </CardContent>
                  </Card>
                )}

                {/* CTA sidebar */}
                <Card className="border-primary/20">
                  <CardContent className="p-5 text-center">
                    <p className="font-display font-bold mb-2">Vous voulez clarifier votre projet ?</p>
                    <p className="text-sm text-muted-foreground mb-4">Notre IA vous guide pour définir précisément votre besoin.</p>
                    <Button className="w-full gradient-primary border-0" asChild>
                      <Link to="/register">Commencer</Link>
                    </Button>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </div>
        </section>

        {/* Related articles */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="py-12 bg-muted/30">
            <div className="container max-w-6xl">
              <h2 className="font-display text-2xl font-bold mb-8">Articles similaires</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((p) => (
                  <Link key={p.slug} to={`/blog/${p.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-all group">
                      <CardContent className="p-5 space-y-3">
                        <Badge variant="outline" className="text-xs">{categoryLabels[p.category]}</Badge>
                        <h3 className="font-display font-bold leading-tight group-hover:text-primary transition-colors">
                          {p.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{p.published_at ? format(new Date(p.published_at), "d MMM yyyy", { locale: fr }) : ""}</span>
                          <span>{p.reading_time} min</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t bg-muted/30 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} IMOTION Conseil. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
