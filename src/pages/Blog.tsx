import { useState } from "react";
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center"><Logo size="md" /></Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Accueil</Link>
            <Link to="/blog" className="text-sm font-medium text-foreground">Blog</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/login">Se connecter</Link></Button>
            <Button asChild className="gradient-primary border-0"><Link to="/register">Démarrer</Link></Button>
          </div>
        </div>
      </header>

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
                          <Card className="group h-full hover:shadow-lg transition-all duration-300 overflow-hidden border-border/50">
                            {post.cover_image ? (
                              <div className="aspect-video bg-muted overflow-hidden">
                                <img
                                  src={post.cover_image}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                            ) : (
                              <div className="aspect-video bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                                <span className="text-4xl">{categories.find(c => c.value === post.category)?.emoji || "📝"}</span>
                              </div>
                            )}
                            <CardContent className="p-5 space-y-3">
                              <Badge variant="outline" className={`text-xs ${categoryColors[post.category] || ""}`}>
                                {categories.find(c => c.value === post.category)?.label || post.category}
                              </Badge>
                              <h3 className="font-display font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                {post.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
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

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} IMOTION Conseil. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
