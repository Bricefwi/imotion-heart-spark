import { useState } from "react";
import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, Search, Mail } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

const categories = [
  { value: "all", label: "Tous", emoji: "📚" },
  { value: "expression-besoin", label: "Expression du besoin", emoji: "💬" },
  { value: "image-identite", label: "Image & Identité", emoji: "🎨" },
  { value: "strategie", label: "Stratégie digitale", emoji: "🎯" },
  { value: "cas-clients", label: "Cas clients", emoji: "📖" },
  { value: "outils", label: "Outils pratiques", emoji: "🛠️" },
];

const categoryColors: Record<string, string> = {
  "expression-besoin": "bg-primary/10 text-primary border-primary/20",
  "image-identite": "bg-secondary/10 text-secondary border-secondary/20",
  "strategie": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "cas-clients": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "outils": "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts", activeCategory, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (activeCategory !== "all") {
        query = query.eq("category", activeCategory);
      }
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: popularPosts } = useQuery({
    queryKey: ["blog-popular"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title, view_count")
        .eq("is_published", true)
        .order("view_count", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const handleNewsletterSubscribe = async () => {
    if (!newsletterEmail) return;
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: newsletterEmail });
    if (error) {
      if (error.code === "23505") toast.info("Vous êtes déjà inscrit !");
      else toast.error("Erreur lors de l'inscription");
    } else {
      toast.success("Inscription réussie ! 🎉");
      setNewsletterEmail("");
    }
  };

  return (
    <>
      <SEOHead
        title="Blog — Conseils en stratégie digitale et expression du besoin"
        description="Articles experts sur l'expression du besoin, la stratégie digitale, le cahier des charges et les bonnes pratiques pour réussir votre projet digital."
        canonical="/blog"
        jsonLd={breadcrumbSchema([
          { name: "Accueil", url: "/" },
          { name: "Blog", url: "/blog" },
        ])}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="outline" className="mb-4">Blog</Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">L'Atelier de la Clarté</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Conseils d'experts pour définir et réussir votre projet digital
              </p>
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Filters + Content */}
        <section className="py-12">
          <div className="container">
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-10">
              <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.value}
                    value={cat.value}
                    className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-2 text-sm"
                  >
                    {cat.emoji} {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              {/* Articles Grid */}
              <div className="lg:col-span-3">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <div className="h-48 bg-muted rounded-t-lg" />
                        <CardContent className="p-5 space-y-3">
                          <div className="h-4 bg-muted rounded w-20" />
                          <div className="h-5 bg-muted rounded w-full" />
                          <div className="h-4 bg-muted rounded w-3/4" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : posts && posts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {posts.map((post, i) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link to={`/blog/${post.slug}`}>
                          <Card className="group h-full hover:shadow-xl transition-all duration-500 overflow-hidden border-border/50 hover:-translate-y-1">
                            <div className="relative aspect-video bg-muted overflow-hidden">
                              {post.cover_image ? (
                                <img
                                  src={post.cover_image}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                                  <span className="text-4xl">{categories.find(c => c.value === post.category)?.emoji || "📝"}</span>
                                </div>
                              )}
                              {/* Gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              <Badge variant="outline" className={`absolute top-3 left-3 text-xs backdrop-blur-md bg-background/70 ${categoryColors[post.category] || ""}`}>
                                {categories.find(c => c.value === post.category)?.emoji}{" "}
                                {categories.find(c => c.value === post.category)?.label || post.category}
                              </Badge>
                            </div>
                            <CardContent className="p-5 space-y-3">
                              <h3 className="font-display font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                {post.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {post.published_at ? format(new Date(post.published_at), "d MMM yyyy", { locale: fr }) : "—"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {post.reading_time} min
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-lg text-muted-foreground mb-2">Aucun article pour le moment</p>
                    <p className="text-sm text-muted-foreground">Nos premiers articles arrivent bientôt !</p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Newsletter */}
                <Card className="overflow-hidden">
                  <div className="gradient-primary p-5 text-primary-foreground">
                    <Mail className="h-6 w-6 mb-2" />
                    <h3 className="font-display font-bold text-lg">Newsletter</h3>
                    <p className="text-sm opacity-90">Recevez nos conseils toutes les 2 semaines</p>
                  </div>
                  <CardContent className="p-5 space-y-3">
                    <Input
                      placeholder="votre@email.com"
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                    />
                    <Button onClick={handleNewsletterSubscribe} className="w-full gradient-primary border-0">
                      S'inscrire
                    </Button>
                  </CardContent>
                </Card>

                {/* Popular articles */}
                {popularPosts && popularPosts.length > 0 && (
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="font-display font-bold mb-4">Articles populaires</h3>
                      <div className="space-y-3">
                        {popularPosts.map((p, i) => (
                          <Link
                            key={p.slug}
                            to={`/blog/${p.slug}`}
                            className="flex gap-3 items-start group"
                          >
                            <span className="text-lg font-bold text-muted-foreground/40 font-display">{i + 1}</span>
                            <span className="text-sm font-medium group-hover:text-primary transition-colors leading-tight">
                              {p.title}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
