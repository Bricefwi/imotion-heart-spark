import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, ShoppingCart, Smartphone, Building2,
};

// Fallback data in case DB is empty
const FALLBACK_BUILD = [
  { code: "vitrine", name: "Site Vitrine", description: "Présentez votre activité avec élégance", icon: "Globe", base_price: 2490, price_range_min: 2490, price_range_max: 6000, duration_weeks_min: 3, duration_weeks_max: 5, default_features: ["3-5 pages", "Design personnalisé", "Responsive mobile", "SEO de base", "Formulaire contact"], is_popular: false, display_order: 1 },
  { code: "ecommerce", name: "E-commerce", description: "Vendez vos produits en ligne", icon: "ShoppingCart", base_price: 4990, price_range_min: 4990, price_range_max: 15000, duration_weeks_min: 6, duration_weeks_max: 10, default_features: ["Catalogue produits", "Paiement sécurisé", "Gestion stocks", "Espace client", "Tableau de bord"], is_popular: true, display_order: 2 },
  { code: "webapp", name: "Application Web", description: "Digitalisez vos processus métier", icon: "Smartphone", base_price: 9990, price_range_min: 9990, price_range_max: 35000, duration_weeks_min: 10, duration_weeks_max: 14, default_features: ["Authentification", "Dashboard interactif", "API sur-mesure", "Intégrations", "Multi-utilisateurs"], is_popular: false, display_order: 3 },
  { code: "plateforme", name: "Plateforme", description: "Projets complexes et ambitieux", icon: "Building2", base_price: 25000, price_range_min: 25000, price_range_max: null, duration_weeks_min: 16, duration_weeks_max: null, default_features: ["Architecture scalable", "Multi-tenants", "IA & automatisation", "Intégrations avancées", "Support dédié"], is_popular: false, display_order: 4 },
];

const FALLBACK_RUN = [
  { code: "essentiel", name: "Essentiel", description: "Pour les sites vitrines", monthly_price: 199, sla_percentage: 99, features: ["Hébergement sécurisé", "Mises à jour de sécurité", "Sauvegarde quotidienne", "Support email 48h"], is_highlighted: false, evolution_hours_included: 0 },
  { code: "confort", name: "Confort", description: "Pour les e-commerces et apps", monthly_price: 399, sla_percentage: 99.5, features: ["Hébergement haute dispo", "Mises à jour de sécurité", "Sauvegarde quotidienne", "Support réactif 24h", "2h d'évolutions/mois", "Monitoring 24/7"], is_highlighted: true, evolution_hours_included: 2 },
  { code: "premium", name: "Premium", description: "Pour les plateformes critiques", monthly_price: 799, sla_percentage: 99.9, features: ["Infrastructure dédiée", "Mises à jour prioritaires", "Sauvegarde temps réel", "Support téléphone 4h", "5h d'évolutions/mois", "Account manager dédié"], is_highlighted: false, evolution_hours_included: 5 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function formatPriceRange(min: number, max: number | null): string {
  if (!max) return `À partir de ${min.toLocaleString("fr-FR")}€`;
  return `${min.toLocaleString("fr-FR")}€ - ${max.toLocaleString("fr-FR")}€`;
}

export function PricingSection() {
  const [activeTab, setActiveTab] = useState<"build" | "run">("build");

  const { data: buildPlans = FALLBACK_BUILD } = useQuery({
    queryKey: ["pricing-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_config")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error || !data || data.length === 0) return FALLBACK_BUILD;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: runPlans = FALLBACK_RUN } = useQuery({
    queryKey: ["pricing-maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_maintenance")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error || !data || data.length === 0) return FALLBACK_RUN;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

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
              {buildPlans.map((project) => {
                const IconComp = ICON_MAP[project.icon] || Globe;
                const features: string[] = Array.isArray(project.default_features) ? (project.default_features as string[]) : [];
                const isPopular = project.is_popular;

                return (
                  <motion.div
                    key={project.code}
                    variants={itemVariants}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    className={cn(
                      "relative bg-background rounded-2xl border p-6 transition-shadow hover:shadow-xl",
                      isPopular && "border-primary shadow-lg shadow-primary/10"
                    )}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="gradient-primary border-0 text-primary-foreground">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Populaire
                        </Badge>
                      </div>
                    )}

                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                      isPopular ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}>
                      <IconComp className="w-6 h-6" />
                    </div>

                    <h4 className="text-lg font-display font-bold mb-1">{project.name}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{project.description}</p>

                    <div className="mb-2">
                      {project.price_range_max ? (
                        <>
                          <span className="text-sm text-muted-foreground">À partir de</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-display font-bold text-primary">
                              {project.base_price.toLocaleString("fr-FR")}
                            </span>
                            <span className="text-lg text-primary">€</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-muted-foreground">À partir de</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-display font-bold text-primary">
                              {project.base_price.toLocaleString("fr-FR")}
                            </span>
                            <span className="text-lg text-primary">€</span>
                          </div>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      {formatPriceRange(project.price_range_min, project.price_range_max)}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Clock className="w-4 h-4" />
                      <span>
                        {project.duration_weeks_max
                          ? `${project.duration_weeks_min}-${project.duration_weeks_max} semaines`
                          : "Sur mesure"}
                      </span>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {features.map((f: string) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      variant={isPopular ? "default" : "outline"}
                      className={cn("w-full rounded-xl", isPopular && "gradient-primary border-0")}
                    >
                      <Link to="/register">Estimer mon projet</Link>
                    </Button>
                  </motion.div>
                );
              })}
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
                ].map((item) => (
                  <div key={item.title} className="text-center">
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
              {runPlans.map((plan) => {
                const features: string[] = Array.isArray(plan.features) ? (plan.features as string[]) : [];
                const isHighlighted = plan.is_highlighted;

                return (
                  <motion.div
                    key={plan.code}
                    variants={itemVariants}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    className={cn(
                      "relative bg-background rounded-2xl border p-6 transition-shadow",
                      isHighlighted ? "border-primary shadow-xl shadow-primary/10 scale-105" : "hover:shadow-lg"
                    )}
                  >
                    {isHighlighted && (
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
                        <span className={cn("text-4xl font-display font-bold", isHighlighted ? "text-primary" : "text-foreground")}>
                          {plan.monthly_price}
                        </span>
                        <span className="text-lg text-muted-foreground">€/mois</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">SLA {plan.sla_percentage}% garanti</p>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {features.map((feature: string) => (
                        <li key={feature} className="flex items-center gap-3 text-sm">
                          <Check className="w-4 h-4 shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      variant={isHighlighted ? "default" : "outline"}
                      className={cn("w-full rounded-xl", isHighlighted && "gradient-primary border-0")}
                    >
                      <Link to="/contact">Choisir {plan.name}</Link>
                    </Button>
                  </motion.div>
                );
              })}
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
