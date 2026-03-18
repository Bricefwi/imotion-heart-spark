import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import avatarMarie from "@/assets/avatar-marie.jpg";
import avatarThomas from "@/assets/avatar-thomas.jpg";
import avatarSophie from "@/assets/avatar-sophie.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
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
    },
    {
      quote: t("testimonials.quote2"),
      name: "Thomas Martin",
      role: "CEO",
      company: "StartupFlow",
      avatar: avatarThomas,
    },
    {
      quote: t("testimonials.quote3"),
      name: "Sophie Bernard",
      role: "Product Manager",
      company: "DataCorp",
      avatar: avatarSophie,
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">{t("testimonials.badge")}</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            {t("testimonials.title")}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testi, i) => (
            <motion.div
              key={testi.name}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={i}
            >
              <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <p className="text-foreground/80 mb-6 leading-relaxed italic">"{testi.quote}"</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={testi.avatar}
                      alt={testi.name}
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20"
                    />
                    <div>
                      <p className="font-semibold text-sm">{testi.name}</p>
                      <p className="text-xs text-muted-foreground">{testi.role}, {testi.company}</p>
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
