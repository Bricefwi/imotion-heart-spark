import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const categoryLabels: Record<string, string> = {
  "expression-besoin": "Expression du besoin",
  "image-identite": "Image & Identité",
  "strategie": "Stratégie digitale",
  "cas-clients": "Cas clients",
  "outils": "Outils pratiques",
};

export function BlogPreviewSection() {
  const { data: posts } = useQuery({
    queryKey: ["blog-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  // Don't render the section if no posts
  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Blog</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">L'Atelier de la Clarté</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Nos conseils pour réussir votre projet digital
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={`/blog/${post.slug}`}>
                <Card className="h-full group hover:shadow-lg transition-all overflow-hidden border-border/50">
                  <div className="aspect-video bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                    <span className="text-4xl">
                      {post.category === "expression-besoin" ? "💬" :
                       post.category === "image-identite" ? "🎨" :
                       post.category === "strategie" ? "🎯" :
                       post.category === "cas-clients" ? "📖" : "🛠️"}
                    </span>
                  </div>
                  <CardContent className="p-5 space-y-3">
                    <Badge variant="outline" className="text-xs">
                      {categoryLabels[post.category] || post.category}
                    </Badge>
                    <h3 className="font-display font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.published_at ? format(new Date(post.published_at), "d MMM yyyy", { locale: fr }) : ""}
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

        <div className="text-center">
          <Button variant="outline" asChild className="group">
            <Link to="/blog">
              Voir tous les articles
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
