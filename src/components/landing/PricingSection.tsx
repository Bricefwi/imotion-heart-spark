import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check,
  Sparkles,
  Globe,
  ShoppingCart,
  Smartphone,
  Building2,
  ArrowRight,
  Shield,
  Clock,
  Headphones,
  TrendingUp,
  FileText,
  Zap,
  MessageSquare,
  Star,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PROJECT_TYPES = [
  {
    id: "vitrine",
    icon: Globe,
    name: "Site Vitrine",
    description: "Présentez votre activité avec élégance",
    startingPrice: 2490,
    priceRange: "2 490€ - 6 000€",
    features: ["3-5 pages", "Design personnalisé", "Responsive mobile", "SEO de base", "Formulaire contact"],
    duration: "3-5 semaines",
    popular: false,
  },
  {
    id: "ecommerce",
    icon: ShoppingCart,
    name: "E-commerce",
    description: "Vendez vos produits en ligne",
    startingPrice: 4990,
    priceRange: "4 990€ - 15 000€",
    features: ["Catalogue produits", "Paiement sécurisé", "Gestion stocks", "Espace client", "Tableau de bord"],
    duration: "6-10 semaines",
    popular: true,
  },
  {
    id: "webapp",
    icon: Smartphone,
    name: "Application Web",
    description: "Digitalisez vos processus métier",
    startingPrice: 9990,
    priceRange: "9 990€ - 35 000€",
    features: ["Authentification", "Dashboard interactif", "API sur-mesure", "Intégrations", "Multi-utilisateurs"],
    duration: "10-14 semaines",
    popular: false,
  },
  {
    id: "plateforme",
    icon: Building2,
    name: "Plateforme",
    description: "Projets complexes et ambitieux",
    startingPrice: null,
    priceRange: "À partir de 25 000€",
    features: ["Architecture scalable", "Multi-tenants", "IA & automatisation", "Intégrations avancées", "Support dédié"],
    duration: "Sur mesure",
    popular: false,
  },
];

const RUN_PLANS = [
  {
    id: "essentiel",
    name: "Essentiel",
    price: 199,
    description: "Pour les sites vitrines",
    features: [
      { text: "Hébergement sécurisé", included: true },
      { text: "Mises à jour de sécurité", included: true },
      { text: "Sauvegarde quotidienne", included: true },
      { text: "Support email 48h", included: true },
      { text: "Évolutions mensuelles", included: false },
      { text: "Support prioritaire", included: false },
    ],
    sla: "99%",
    highlighted: false,
  },
  {
    id: "confort",
    name: "Confort",
    price: 399,
    description: "Pour les e-commerces et apps",
    features: [
      { text: "Hébergement haute dispo", included: true },
      { text: "Mises à jour de sécurité", included: true },
      { text: "Sauvegarde quotidienne", included: true },
      { text: "Support réactif 24h", included: true },
      { text: "2h d'évolutions/mois", included: true },
      { text: "Monitoring 24/7", included: true },
    ],
    sla: "99.5%",
    highlighted: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 799,
    description: "Pour les plateformes critiques",
    features: [
      { text: "Infrastructure dédiée", included: true },
      { text: "Mises à jour prioritaires", included: true },
      { text: "Sauvegarde temps réel", included: true },
      { text: "Support téléphone 4h", included: true },
      { text: "5h d'évolutions/mois", included: true },
      { text: "Account manager dédié", included: true },
    ],
    sla: "99.9%",
    highlighted: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function PricingSection() {
  const [activeTab, setActiveTab] = useState<"build" | "run">("build");

  return (
    <section id="pricing" className="py-20 md:py-32">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Tarifs transparents
          </Badge>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Un investissement,{" "}
            <span className="gradient-text">pas une dépense</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Des tarifs clairs, adaptés à la taille de votre projet.
            Commencez gratuitement avec votre cahier des charges personnalisé.
          </p>
        </motion.div>

        {/* CDC Gratuit Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="relative overflow-hidden rounded-3xl gradient-primary p-[2px]">
            <div className="bg-background rounded-[22px] p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <FileText className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary">Étape 1</p>
                      <h3 className="text-2xl font-display font-bold">Découverte & CDC</h3>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    15 minutes de conversation guidée par IA pour clarifier votre projet.
                    Vous repartez avec un <strong>Cahier des Charges professionnel</strong> et
                    une <strong>estimation budgétaire personnalisée</strong>.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {["100% gratuit", "Sans engagement", "CDC téléchargeable"].map((t) => (
                      <div key={t} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center md:text-right shrink-0">
                  <div className="mb-4">
                    <span className="text-5xl md:text-6xl font-display font-bold text-primary">0€</span>
                  </div>
                  <Button asChild size="lg" className="gradient-primary border-0 rounded-xl px-8 shadow-lg shadow-primary/25">
                    <Link to="/register">
                      Commencer gratuitement
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">Aucune carte bancaire requise</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs BUILD / RUN */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-muted rounded-2xl p-1.5">
            <button
              onClick={() => setActiveTab("build")}
              className={cn(
                "px-6 py-3 rounded-xl text-sm font-medium transition-all",
                activeTab === "build" ? "bg-background shadow-md text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              BUILD - Réalisation
            </button>
            <button
              onClick={() => setActiveTab("run")}
              className={cn(
                "px-6 py-3 rounded-xl text-sm font-medium transition-all",
                activeTab === "run" ? "bg-background shadow-md text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              RUN - Maintenance
            </button>
          </div>
        </div>

        {/* BUILD Section */}
        {activeTab === "build" && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-display font-bold mb-2">Étape 2 : Réalisation sur mesure</h3>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Une équipe dédiée pour concrétiser votre vision.
                Le budget final est défini précisément après votre découverte gratuite.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {PROJECT_TYPES.map((project) => (
                <motion.div
                  key={project.id}
                  variants={itemVariants}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className={cn(
                    "relative bg-background rounded-2xl border p-6 transition-shadow hover:shadow-xl",
                    project.popular && "border-primary shadow-lg shadow-primary/10"
                  )}
                >
                  {project.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="gradient-primary border-0 text-primary-foreground">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Populaire
                      </Badge>
                    </div>
                  )}

                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    project.popular ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}>
                    <project.icon className="w-6 h-6" />
                  </div>

                  <h4 className="text-lg font-display font-bold mb-1">{project.name}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{project.description}</p>

                  <div className="mb-2">
                    {project.startingPrice ? (
                      <>
                        <span className="text-sm text-muted-foreground">À partir de</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-display font-bold text-primary">
                            {project.startingPrice.toLocaleString("fr-FR")}
                          </span>
                          <span className="text-lg text-primary">€</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-2xl font-display font-bold text-primary">Sur devis</div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {project.priceRange}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4" />
                    <span>{project.duration}</span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {project.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    variant={project.popular ? "default" : "outline"}
                    className={cn("w-full rounded-xl", project.popular && "gradient-primary border-0")}
                  >
                    <Link to="/register">Estimer mon projet</Link>
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Note explicative */}
            <motion.div variants={itemVariants} className="bg-primary/5 border border-primary/10 rounded-2xl p-6 mb-12 max-w-3xl mx-auto">
              <div className="flex gap-4">
                <Info className="w-6 h-6 text-primary shrink-0" />
                <div>
                  <h4 className="font-semibold mb-2">Comment est calculé le prix final ?</h4>
                  <p className="text-sm text-muted-foreground">
                    Les prix "à partir de" correspondent à des projets simples. Le tarif exact dépend de :
                    <strong> nombre de pages/écrans</strong>, <strong>niveau de personnalisation du design</strong>,
                    <strong> fonctionnalités spécifiques</strong> et <strong>intégrations requises</strong>.
                    Votre CDC gratuit inclut une estimation détaillée.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Garanties BUILD */}
            <motion.div variants={itemVariants} className="bg-muted/50 rounded-2xl p-8 md:p-10">
              <h4 className="text-xl font-display font-bold text-center mb-8">Inclus dans chaque projet BUILD</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { icon: Check, title: "Équipe dédiée", desc: "Design + Dev" },
                  { icon: TrendingUp, title: "Sprints agiles", desc: "Suivi temps réel" },
                  { icon: Shield, title: "Garantie 3 mois", desc: "Corrections incluses" },
                  { icon: Headphones, title: "Formation", desc: "Prise en main" },
                ].map((item, idx) => (
                  <div key={idx} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-background shadow-sm flex items-center justify-center mx-auto mb-3">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* RUN Section */}
        {activeTab === "run" && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-display font-bold mb-2">Étape 3 : Maintenance & Évolution</h3>
              <p className="text-muted-foreground">Votre application reste performante, sécurisée et à jour</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {RUN_PLANS.map((plan) => (
                <motion.div
                  key={plan.id}
                  variants={itemVariants}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className={cn(
                    "relative bg-background rounded-2xl border p-6 transition-shadow",
                    plan.highlighted ? "border-primary shadow-xl shadow-primary/10 scale-105" : "hover:shadow-lg"
                  )}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="gradient-primary border-0 text-primary-foreground">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Recommandé
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h4 className="text-xl font-display font-bold mb-1">{plan.name}</h4>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={cn("text-4xl font-display font-bold", plan.highlighted ? "text-primary" : "text-foreground")}>
                        {plan.price}
                      </span>
                      <span className="text-lg text-muted-foreground">€/mois</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">SLA {plan.sla} garanti</p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm">
                        <Check className={cn("w-4 h-4 shrink-0", feature.included ? "text-primary" : "text-muted-foreground/30")} />
                        <span className={cn(!feature.included && "text-muted-foreground/50 line-through")}>{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    variant={plan.highlighted ? "default" : "outline"}
                    className={cn("w-full rounded-xl", plan.highlighted && "gradient-primary border-0")}
                  >
                    <Link to="/contact">Choisir {plan.name}</Link>
                  </Button>
                </motion.div>
              ))}
            </div>

            <motion.p variants={itemVariants} className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto">
              💡 Le forfait RUN est optionnel. Vous restez propriétaire de votre code et pouvez gérer votre hébergement vous-même.
            </motion.p>
          </motion.div>
        )}

        {/* Final CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-20">
          <div className="relative overflow-hidden rounded-3xl gradient-primary p-10 md:p-16 text-center text-primary-foreground">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-foreground rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
            </div>
            <div className="relative z-10">
              <MessageSquare className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h3 className="text-2xl md:text-4xl font-display font-bold mb-4">Prêt à clarifier votre projet ?</h3>
              <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
                15 minutes de conversation guidée. Un cahier des charges professionnel.
                Une estimation précise. <strong>Zéro engagement.</strong>
              </p>
              <Button asChild size="lg" variant="secondary" className="rounded-xl px-8 font-semibold">
                <Link to="/register">
                  Démarrer ma découverte gratuite
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
