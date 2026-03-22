import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, MessageSquare, FileText, Wallet, Star, BookOpen } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const previews = [
  {
    icon: MessageSquare,
    badge: "Fonctionnalités",
    title: "Conversation IA en 7 phases",
    description: "Notre IA vous guide pas à pas pour définir votre besoin avec précision.",
    link: "/fonctionnalites",
    gradient: "from-primary to-primary/70",
    bgGlow: "bg-primary/8",
  },
  {
    icon: FileText,
    badge: "Comment ça marche",
    title: "De l'idée au CDC en 45 min",
    description: "Un processus simple en 4 étapes pour transformer votre vision en document concret.",
    link: "/fonctionnalites",
    gradient: "from-secondary to-amber-500",
    bgGlow: "bg-secondary/8",
  },
  {
    icon: Wallet,
    badge: "Tarifs",
    title: "CDC gratuit, réalisation sur devis",
    description: "Votre cahier des charges est 100% gratuit. La réalisation démarre à partir de 5 000€.",
    link: "/tarifs",
    gradient: "from-emerald-500 to-emerald-600",
    bgGlow: "bg-emerald-500/8",
  },
  {
    icon: Star,
    badge: "Témoignages",
    title: "98% de clients satisfaits",
    description: "Découvrez comment nos clients ont transformé leurs idées en solutions concrètes.",
    link: "/a-propos",
    gradient: "from-amber-500 to-amber-600",
    bgGlow: "bg-amber-500/8",
  },
  {
    icon: BookOpen,
    badge: "Blog",
    title: "Ressources & conseils",
    description: "Articles, guides et retours d'expérience pour réussir votre projet digital.",
    link: "/blog",
    gradient: "from-blue-500 to-blue-600",
    bgGlow: "bg-blue-500/8",
  },
];

export function MiniPreviewCards() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 px-4 py-1.5 border-border/40">Explorez</Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            Tout ce qu'il faut pour <span className="gradient-text">réussir votre projet</span>
          </h2>
          <p className="text-muted-foreground/70 max-w-xl mx-auto text-lg leading-relaxed">
            Découvrez nos outils, notre méthode et nos ressources.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {previews.map((item, i) => (
            <motion.div
              key={item.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className={i >= 3 ? "sm:col-span-1 lg:col-span-1" : ""}
            >
              <Link to={item.link} className="block group h-full">
                <Card className="h-full border-border/30 hover:border-primary/25 hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 overflow-hidden relative">
                  <CardContent className="p-7 relative">
                    {/* Background glow on hover */}
                    <div className={`absolute inset-0 ${item.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    <div className="relative">
                      {/* Icon container with gradient */}
                      <div className={`inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br ${item.gradient} mb-5 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                        <item.icon className="h-7 w-7 text-white" />
                      </div>

                      <Badge variant="muted" className="mb-3 text-xs font-medium">
                        {item.badge}
                      </Badge>
                      <h3 className="text-lg font-bold mb-2.5 group-hover:text-primary transition-colors tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground/70 leading-relaxed mb-5">
                        {item.description}
                      </p>
                      <span className="inline-flex items-center text-sm font-semibold text-primary translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        En savoir plus <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
