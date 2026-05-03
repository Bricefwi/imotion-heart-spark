import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Check,
  Building2,
  FileText,
  Euro,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

const auditLines = [
  "Prospect qualifié identifié",
  "Douleur quantifiée : -12 h/semaine",
  "Budget confirmé : 25 000 — 40 000 €",
  "CDC généré (2 400 mots)",
  "Devis pré-rempli — lead grade A",
];

function AuditTerminal() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= auditLines.length) {
      const t = setTimeout(() => setVisibleCount(0), 3500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleCount((c) => c + 1), 900);
    return () => clearTimeout(t);
  }, [visibleCount]);

  return (
    <div className="rounded-2xl bg-[#0F0D0B] border border-white/10 shadow-2xl overflow-hidden font-mono text-[13px] leading-relaxed">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#FF5F57]" />
          <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="size-2.5 rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-white/50 text-xs tracking-tight">
          clarivi — audit IA
        </span>
        <span className="ml-auto text-emerald-400 text-xs">● live</span>
      </div>
      <div className="p-5 space-y-2 min-h-[180px]">
        {auditLines.map((line, i) => {
          const isVisible = i < visibleCount;
          const isFinal = i === auditLines.length - 1 && isVisible;
          return (
            <motion.div
              key={line}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -8 }}
              transition={{ duration: 0.35 }}
              className="flex items-start gap-2.5"
            >
              {isFinal ? (
                <Sparkles className="size-3.5 text-primary mt-0.5 shrink-0 animate-pulse" />
              ) : (
                <Check
                  className={`size-3.5 mt-0.5 shrink-0 ${isVisible ? "text-emerald-400" : "text-white/20"}`}
                />
              )}
              <span className={isFinal ? "text-primary font-medium" : "text-white/85"}>
                {line}
              </span>
            </motion.div>
          );
        })}
      </div>
      <div className="px-5 pb-4 flex gap-3">
        <div className="flex-1 rounded-lg bg-white/5 border border-white/10 p-3 text-center">
          <div className="text-xs text-white/50 mb-0.5">CDC livré</div>
          <div className="text-emerald-400 font-semibold text-sm">6 min</div>
        </div>
        <div className="flex-1 rounded-lg bg-white/5 border border-white/10 p-3 text-center">
          <div className="text-xs text-white/50 mb-0.5">Coût LLM</div>
          <div className="text-emerald-400 font-semibold text-sm">~0,80 €</div>
        </div>
        <div className="flex-1 rounded-lg bg-white/5 border border-white/10 p-3 text-center">
          <div className="text-xs text-white/50 mb-0.5">Lead grade</div>
          <div className="text-amber-400 font-bold text-sm">A</div>
        </div>
      </div>
    </div>
  );
}

const benefits = [
  { icon: Building2, text: "White-label complet — votre marque, vos couleurs" },
  { icon: FileText, text: "CDC + devis pré-rempli à chaque audit" },
  { icon: Euro, text: "Grille tarifaire agence intégrée" },
  { icon: Zap, text: "Audit conversationnel en 6 min (3 phases)" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-background pt-20 pb-16">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-6">
                <Sparkles className="size-3" />
                B2B2B · Agences digitales · White-label
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            >
              Embarquez un{" "}
              <span className="text-primary">audit IA</span>{" "}
              dans votre tunnel commercial
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-lg text-muted-foreground mb-8 max-w-xl"
            >
              Clarivi transforme chaque prospect en lead qualifié en 6 minutes.
              Votre agence reçoit automatiquement un{" "}
              <strong className="text-foreground">CDC professionnel</strong> et un{" "}
              <strong className="text-foreground">devis pré-rempli</strong> à vos tarifs.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="space-y-3 mb-10"
            >
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="size-3.5 text-primary" />
                  </span>
                  {text}
                </li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Button size="lg" asChild className="gap-2">
                <Link to="/inscription">
                  Essayer 14 jours gratuit
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/tarifs">Voir les tarifs</Link>
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 text-xs text-muted-foreground"
            >
              5 audits inclus · Sans carte bancaire · Annulation à tout moment
            </motion.p>
          </div>

          {/* Right — terminal */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl" />
            <div className="relative">
              <AuditTerminal />
              {/* Social proof badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute -bottom-4 -left-4 rounded-xl bg-card border shadow-lg px-4 py-3 text-sm"
              >
                <div className="font-semibold">+340 audits ce mois</div>
                <div className="text-xs text-muted-foreground">par 40+ agences en France</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
