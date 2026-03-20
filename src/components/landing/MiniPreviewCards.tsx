import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, MessageSquare, FileText, Wallet, Star, BookOpen } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
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
    gradient: "from-primary/15 to-primary/5",
    iconColor: "text-primary",
  },
  {
    icon: FileText,
    badge: "Comment ça marche",
    title: "De l'idée au CDC en 45 min",
    description: "Un processus simple en 4 étapes pour transformer votre vision en document concret.",
    link: "/fonctionnalites",
    gradient: "from-secondary/15 to-secondary/5",
    iconColor: "text-secondary",
  },
  {
    icon: Wallet,
    badge: "Tarifs",
    title: "CDC gratuit, réalisation sur devis",
    description: "Votre cahier des charges est 100% gratuit. La réalisation démarre à partir de 5 000€.",
    link: "/tarifs",
    gradient: "from-emerald-500/15 to-emerald-500/5",
    iconColor: "text-emerald-600",
  },
  {
    icon: Star,
    badge: "Témoignages",
    title: "98% de clients satisfaits",
    description: "Découvrez comment nos clients ont transformé leurs idées en solutions concrètes.",
    link: "/a-propos",
    gradient: "from-amber-500/15 to-amber-500/5",
    iconColor: "text-amber-600",
  },
  {
    icon: BookOpen,
    badge: "Blog",
    title: "Ressources & conseils",
    description: "Articles, guides et retours d'expérience pour réussir votre projet digital.",
    link: "/blog",
    gradient: "from-blue-500/15 to-blue-500/5",
    iconColor: "text-blue-600",
  },
];

export function MiniPreviewCards() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 border-border/40">Explorez</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Tout ce qu'il faut pour <span className="gradient-text">réussir votre projet</span>
          </h2>
          <p className="text-muted-foreground/70 max-w-xl mx-auto text-lg leading-relaxed">
            Découvrez nos outils, notre méthode et nos ressources.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {previews.map((item, i) => (
            <motion.div
              key={item.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <Link to={item.link} className="block group">
                <Card className="h-full border-border/40 hover:border-primary/20 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1.5 overflow-hidden">
                  <CardContent className="p-6 relative">
                    {/* Background gradient on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative">
                      <div className={`inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br ${item.gradient} ${item.iconColor} mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                        <item.icon className="h-6 w-6" />
                      </div>
                      <Badge variant="muted" className="mb-3 text-xs">
                        {item.badge}
                      </Badge>
                      <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground/70 leading-relaxed mb-4">
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
