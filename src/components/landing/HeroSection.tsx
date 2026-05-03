import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles, Building2, FileText, Euro, Zap } from "lucide-react";
import { useEffect, useState } from "react";

/* ─── Terminal animé ────────────────────────────────────────── */
const auditLines = [
  "Prospect qualifié identifié",
  "Douleur quantifiée : −12 h/semaine",
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
    <div
      className="rounded-2xl overflow-hidden shadow-2xl font-mono text-[13px] leading-relaxed"
      style={{ background: "var(--imo-gradient-dusk)", border: "1px solid hsl(var(--imo-ink-800))" }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b"
        style={{ borderColor: "hsl(var(--imo-ink-800))" }}
      >
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#FF5F57]" />
          <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="size-2.5 rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-xs tracking-tight" style={{ color: "hsl(var(--imo-ink-400))" }}>
          clarivi — audit IA
        </span>
        <span className="ml-auto text-xs font-medium" style={{ color: "hsl(var(--imo-coral-400))" }}>
          ● live
        </span>
      </div>

      {/* Body */}
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
                <Sparkles
                  className="size-3.5 mt-0.5 shrink-0 animate-pulse"
                  style={{ color: "hsl(var(--imo-coral-400))" }}
                />
              ) : (
                <Check
                  className="size-3.5 mt-0.5 shrink-0"
                  style={{ color: isVisible ? "hsl(var(--imo-amber-400))" : "hsl(var(--imo-ink-700))" }}
                />
              )}
              <span
                style={{
                  color: isFinal
                    ? "hsl(var(--imo-coral-400))"
                    : isVisible
                    ? "hsl(var(--imo-ink-100))"
                    : "hsl(var(--imo-ink-700))",
                  fontWeight: isFinal ? 500 : 400,
                }}
              >
                {line}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Metrics bar */}
      <div
        className="px-5 pb-4 grid grid-cols-3 gap-2"
      >
        {[
          { label: "CDC livré", value: "6 min" },
          { label: "Coût LLM", value: "~0,80 €" },
          { label: "Lead grade", value: "A", highlight: true },
        ].map(({ label, value, highlight }) => (
          <div
            key={label}
            className="rounded-lg p-3 text-center"
            style={{
              background: "hsl(var(--imo-ink-800) / 0.6)",
              border: "1px solid hsl(var(--imo-ink-700))",
            }}
          >
            <div className="text-xs mb-0.5" style={{ color: "hsl(var(--imo-ink-400))" }}>{label}</div>
            <div
              className="font-semibold text-sm"
              style={{ color: highlight ? "hsl(var(--imo-amber-400))" : "hsl(var(--imo-coral-400))" }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Bénéfices ─────────────────────────────────────────────── */
const benefits = [
  { icon: Building2, text: "White-label complet — votre marque, vos couleurs" },
  { icon: FileText, text: "CDC + devis pré-rempli à chaque audit" },
  { icon: Euro, text: "Grille tarifaire agence intégrée" },
  { icon: Zap, text: "Audit conversationnel en 6 min (3 phases)" },
];

/* ─── HeroSection ────────────────────────────────────────────── */
export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20 pb-16"
      style={{ background: "var(--imo-gradient-dawn)" }}
    >
      {/* Glow coral en haut */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--imo-glow-amber)" }}
      />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Copywriting ──────────────────────────────────── */}
          <div>
            {/* Badge B2B2B */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-6"
                style={{
                  border: "1px solid hsl(var(--imo-coral-600) / 0.35)",
                  background: "hsl(var(--imo-coral-900) / 0.4)",
                  color: "hsl(var(--imo-coral-300))",
                }}
              >
                <Sparkles className="size-3" />
                B2B2B · Agences digitales · White-label
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
              style={{ color: "hsl(var(--imo-ink-50))" }}
            >
              Embarquez un{" "}
              <span style={{ backgroundImage: "var(--imo-gradient-text)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                audit IA
              </span>{" "}
              dans votre tunnel commercial
            </motion.h1>

            {/* Sous-titre */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-lg mb-8 max-w-xl"
              style={{ color: "hsl(var(--imo-ink-300))" }}
            >
              Clarivi transforme chaque prospect en lead qualifié en 6 minutes.
              Votre agence reçoit automatiquement un{" "}
              <strong style={{ color: "hsl(var(--imo-ink-100))" }}>CDC professionnel</strong> et un{" "}
              <strong style={{ color: "hsl(var(--imo-ink-100))" }}>devis pré-rempli</strong> à vos tarifs.
            </motion.p>

            {/* Bénéfices */}
            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="space-y-3 mb-10"
            >
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm" style={{ color: "hsl(var(--imo-ink-300))" }}>
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "hsl(var(--imo-coral-600) / 0.15)" }}
                  >
                    <Icon className="size-3.5" style={{ color: "hsl(var(--imo-coral-400))" }} />
                  </span>
                  {text}
                </li>
              ))}
            </motion.ul>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Button size="lg" asChild className="gap-2" style={{ boxShadow: "var(--imo-shadow-glow)" }}>
                <Link to="/inscription">
                  Essayer 14 jours gratuit
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                style={{ borderColor: "hsl(var(--imo-ink-700))", color: "hsl(var(--imo-ink-100))", background: "transparent" }}
              >
                <Link to="/tarifs">Voir les tarifs</Link>
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 text-xs"
              style={{ color: "hsl(var(--imo-ink-500))" }}
            >
              5 audits inclus · Sans carte bancaire · Annulation à tout moment
            </motion.p>
          </div>

          {/* ── Terminal ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            {/* Halo derrière le terminal */}
            <div
              className="absolute -inset-6 rounded-3xl blur-3xl opacity-40"
              style={{ background: "radial-gradient(circle, hsl(var(--imo-coral-600) / 0.3) 0%, transparent 70%)" }}
            />
            <div className="relative">
              <AuditTerminal />

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute -bottom-4 -left-4 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: "hsl(var(--imo-bg-elevated))",
                  border: "1px solid hsl(var(--imo-border))",
                  boxShadow: "var(--imo-shadow-lg)",
                }}
              >
                <div className="font-semibold" style={{ color: "hsl(var(--imo-fg))" }}>+340 audits ce mois</div>
                <div className="text-xs" style={{ color: "hsl(var(--imo-fg-muted))" }}>par 40+ agences en France</div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
