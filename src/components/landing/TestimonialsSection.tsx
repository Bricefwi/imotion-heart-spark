import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

type Review = {
  id: string;
  author_name: string | null;
  author_role: string | null;
  author_company: string | null;
  rating: number | null;
  content: string;
  created_at: string;
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

/**
 * Témoignages réels uniquement.
 * Aucun persona inventé n'est affiché.
 * La section disparaît tant qu'aucun avis modéré n'existe en base.
 */
export function TestimonialsSection() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("client_reviews")
          .select("id, author_name, author_role, author_company, rating, content, created_at")
          .eq("status", "approved")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(3);
        if (!active) return;
        if (error) {
          setReviews([]);
          return;
        }
        setReviews((data as Review[] | null) ?? []);
      } catch {
        if (active) setReviews([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Tant que le chargement n'est pas terminé OU s'il n'y a aucun avis réel,
  // on n'affiche rien (zéro contenu fake côté UI).
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]" />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 px-4 py-1.5 border-primary/20 text-primary">
            {t("testimonials.badge", "Avis clients")}
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            {t("testimonials.title", "Ils nous ont fait confiance")}
          </h2>
          <p className="text-muted-foreground/70 max-w-lg mx-auto text-lg">
            Retours de clients réels, modérés avant publication.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <Card className="h-full border-border/30 hover:border-primary/20 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden group relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 to-primary/5" />
                <CardContent className="p-7 flex flex-col h-full">
                  <Quote className="h-7 w-7 text-primary/30 mb-4" />
                  <p className="text-sm leading-relaxed text-foreground/85 flex-1 mb-5">
                    "{review.content}"
                  </p>
                  {review.rating ? (
                    <div className="flex items-center gap-0.5 mb-3">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-3.5 w-3.5 ${
                            idx < (review.rating ?? 0)
                              ? "fill-primary text-primary"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  ) : null}
                  <div className="text-sm">
                    <div className="font-semibold text-foreground">
                      {review.author_name ?? "Client vérifié"}
                    </div>
                    {(review.author_role || review.author_company) && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {[review.author_role, review.author_company].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
