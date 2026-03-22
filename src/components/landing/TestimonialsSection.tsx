import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useTranslation } from "react-i18next";
import avatarMarie from "@/assets/avatar-marie.jpg";
import avatarThomas from "@/assets/avatar-thomas.jpg";
import avatarSophie from "@/assets/avatar-sophie.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export function TestimonialsSection() {
  const { t } = useTranslation();

  const testimonials = [
    {
      quote: t("testimonials.quote1"),
      name: "Marie Dupont",
      role: "Directrice Marketing",
      company: "TechVision",
      avatar: avatarMarie,
      accent: "from-primary/20 to-primary/5",
    },
    {
      quote: t("testimonials.quote2"),
      name: "Thomas Martin",
      role: "CEO",
      company: "StartupFlow",
      avatar: avatarThomas,
      accent: "from-secondary/20 to-secondary/5",
    },
    {
      quote: t("testimonials.quote3"),
      name: "Sophie Bernard",
      role: "Product Manager",
      company: "DataCorp",
      avatar: avatarSophie,
      accent: "from-blue-500/20 to-blue-500/5",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
      {/* Subtle background decoration */}
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
          <Badge variant="outline" className="mb-4 px-4 py-1.5 border-primary/20 text-primary">{t("testimonials.badge")}</Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            {t("testimonials.title")}
          </h2>
          <p className="text-muted-foreground/70 max-w-lg mx-auto text-lg">
            Découvrez les retours de nos clients sur leur expérience avec IMOTION.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testi, i) => (
            <motion.div
              key={testi.name}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={i}
            >
              <Card className="h-full border-border/30 hover:border-primary/20 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden group relative">
                {/* Gradient top border */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${testi.accent}`} />

                <CardContent className="p-8 relative">
                  {/* Quote icon */}
                  <Quote className="h-8 w-8 text-primary/10 mb-4 group-hover:text-primary/20 transition-colors" />

                  {/* Stars */}
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-secondary text-secondary" />
                    ))}
                  </div>

                  <p className="text-foreground/80 mb-8 leading-relaxed text-[15px]">
                    &ldquo;{testi.quote}&rdquo;
                  </p>

                  <div className="flex items-center gap-3 pt-5 border-t border-border/30">
                    <img
                      src={testi.avatar}
                      alt={testi.name}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/15 ring-offset-2 ring-offset-background"
                    />
                    <div>
                      <p className="font-semibold text-sm">{testi.name}</p>
                      <p className="text-xs text-muted-foreground">{testi.role}, <span className="text-primary/70">{testi.company}</span></p>
                    </div>
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
