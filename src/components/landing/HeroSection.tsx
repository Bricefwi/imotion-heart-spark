import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles, Building2, FileText, Euro, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/brand/Eyebrow";
import { SectionIndex } from "@/components/brand/SectionIndex";
import { FlameText } from "@/components/brand/FlameText";
import { Stamp } from "@/components/brand/Stamp";

/* ─── Mockup "Audit en cours" — EXEMPLE ILLUSTRATIF ─────────
   Aucun audit réel n'est affiché ici. Données fictives à but
   purement démonstratif (étiqueté "Exemple" dans l'UI).
─────────────────────────────────────────────────────────────── */
const auditFlow = [
  { phase: "P1 · Intake",       fact: "Pain quantifié — gain de temps estimé", status: "done" },
  { phase: "P2 · Need",         fact: "Vision : reporting automatisé", status: "done" },
  { phase: "P3 · Scoping",      fact: "Périmètre & jalons identifiés", status: "done" },
  { phase: "Critic · Validation", fact: "Lead qualifié", status: "live" },
];

function AuditMockup() {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (revealed >= auditFlow.length) {
      const t = setTimeout(() => setRevealed(0), 2400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRevealed((c) => c + 1), 950);
    return () => clearTimeout(t);
  }, [revealed]);

  return (
    <div className="relative">
      {/* Halo derrière */}
      <div
        aria-hidden
        className="absolute -inset-12 blur-3xl opacity-60 pointer-events-none"
        style={{ background: "radial-gradient(60% 60% at 50% 40%, hsl(var(--imo-coral-500) / 0.32) 0%, transparent 70%)" }}
      />

      <div
        className="relative rounded-2xl overflow-hidden font-mono text-[12px]"
        style={{
          background: "var(--imo-gradient-dusk)",
          border: "1px solid hsl(var(--imo-ink-700))",
          boxShadow: "var(--imo-shadow-xl), var(--imo-shadow-glow)",
        }}
      >
        {/* Top bar — meta */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 border-b"
          style={{ borderColor: "hsl(var(--imo-ink-800))", background: "hsl(var(--imo-ink-900) / 0.4)" }}
        >
          <span className="inline-block h-3 w-[2px] rounded-full" style={{ background: "hsl(var(--imo-coral-500))" }} />
          <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "hsl(var(--imo-ink-100))" }}>
            clarivi
          </span>
          <span className="text-[10px]" style={{ color: "hsl(var(--imo-ink-500))" }}>· audit en direct</span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider"
            style={{ color: "hsl(var(--imo-coral-300))" }}
          >
            <span className="size-1.5 rounded-full imo-ember-pulse" style={{ background: "hsl(var(--imo-coral-500))" }} />
            live
          </span>
        </div>

        {/* Reference mono */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "hsl(var(--imo-ink-500))" }}>Réf. audit</div>
            <div className="text-[11px] tabular-nums" style={{ color: "hsl(var(--imo-ink-200))" }}>AUD-2026-0142</div>
          </div>
          <Stamp tone="amber" className="!bg-transparent !border-[hsl(var(--imo-amber-500))] !text-[hsl(var(--imo-amber-300))]">
            6 min
          </Stamp>
        </div>

        {/* Phase rows */}
        <div className="px-5 pb-2 space-y-1.5">
          {auditFlow.map((row, i) => {
            const isVisible = i < revealed;
            const isLive = row.status === "live" && isVisible;
            return (
              <motion.div
                key={row.phase}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isVisible ? 1 : 0.25, x: isVisible ? 0 : -10 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex items-start gap-3 py-1.5"
              >
                <span
                  className="mt-0.5 size-4 shrink-0 rounded-full flex items-center justify-center"
                  style={{
                    background: isVisible ? "hsl(var(--imo-coral-600) / 0.18)" : "hsl(var(--imo-ink-800))",
                    border: `1px solid ${isVisible ? "hsl(var(--imo-coral-500))" : "hsl(var(--imo-ink-700))"}`,
                  }}
                >
                  {isVisible && <Check className="size-2.5" style={{ color: "hsl(var(--imo-coral-400))" }} strokeWidth={3} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "hsl(var(--imo-ink-500))" }}>
                    {row.phase}
                  </div>
                  <div
                    className="text-[12px] truncate"
                    style={{
                      color: isLive ? "hsl(var(--imo-coral-300))" : isVisible ? "hsl(var(--imo-ink-100))" : "hsl(var(--imo-ink-700))",
                    }}
                  >
                    {row.fact}
                  </div>
                </div>
                {isLive && (
                  <Sparkles className="size-3.5 mt-1 shrink-0 animate-pulse" style={{ color: "hsl(var(--imo-coral-400))" }} />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer — outputs */}
        <div
          className="mt-2 grid grid-cols-3 gap-px"
          style={{ background: "hsl(var(--imo-ink-800))" }}
        >
          {[
            { k: "CDC", v: "✓", note: "2 400 mots" },
            { k: "Devis", v: "✓", note: "27 700 €" },
            { k: "Lead", v: "A", note: "87/100" },
          ].map(({ k, v, note }) => (
            <div key={k} className="px-3 py-3 text-center" style={{ background: "hsl(var(--imo-ink-900))" }}>
              <div className="text-[9px] uppercase tracking-[0.18em]" style={{ color: "hsl(var(--imo-ink-500))" }}>
                {k}
              </div>
              <div className="font-bold text-base mt-0.5" style={{ color: "hsl(var(--imo-coral-400))" }}>
                {v}
              </div>
              <div className="text-[10px] tabular-nums" style={{ color: "hsl(var(--imo-ink-300))" }}>
                {note}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating stamp */}
      <div className="absolute -top-3 -right-3 imo-stamp-wobble">
        <Stamp tone="dashed" className="!text-[hsl(var(--imo-coral-300))] !border-[hsl(var(--imo-coral-400)/0.7)] !bg-[hsl(var(--imo-ink-900)/0.8)] backdrop-blur shadow-lg">
          Lead Grade A
        </Stamp>
      </div>
    </div>
  );
}

/* ─── Bénéfices ─────────────────────────────────────────────── */
const benefits = [
  { icon: Building2, text: "White-label complet — votre marque, vos couleurs" },
  { icon: FileText,  text: "CDC + devis pré-rempli à chaque audit" },
  { icon: Euro,      text: "Grille tarifaire agence intégrée" },
  { icon: Zap,       text: "Audit conversationnel en 6 min" },
];

/* ─── HeroSection ────────────────────────────────────────────── */
export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden pt-24 pb-20"
      style={{ background: "var(--imo-gradient-dawn)" }}
    >
      {/* Glow ambient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--imo-glow-amber)" }}
      />
      {/* Grain texture */}
      <div className="absolute inset-0 imo-grain pointer-events-none opacity-50" aria-hidden />

      <div className="container relative z-10">

        {/* Section index — éditorial */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 lg:mb-14"
        >
          <SectionIndex number="01" label="Hero — Clarivi for Agencies" tone="light" />
        </motion.div>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">

          {/* ═══ Colonne gauche : copywriting ═══ */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <Eyebrow tone="light">B2B2B · Agences digitales · White-label</Eyebrow>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="imo-display text-[2.5rem] sm:text-5xl lg:text-[4rem] mb-6"
              style={{ color: "hsl(var(--imo-ink-50))" }}
            >
              Embarquez un{" "}
              <FlameText>audit IA</FlameText>{" "}
              <br className="hidden sm:block" />
              dans votre tunnel commercial
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base lg:text-lg mb-8 max-w-xl leading-relaxed"
              style={{ color: "hsl(var(--imo-ink-300))" }}
            >
              Clarivi transforme chaque prospect en lead qualifié en 6 minutes.
              Votre agence reçoit automatiquement un{" "}
              <span style={{ color: "hsl(var(--imo-ink-100))", fontWeight: 600 }}>cahier des charges</span>{" "}
              et un{" "}
              <span style={{ color: "hsl(var(--imo-ink-100))", fontWeight: 600 }}>devis pré-rempli</span>{" "}
              à vos tarifs.
            </motion.p>

            {/* Bénéfices avec ribbon-left */}
            <motion.ul
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mb-10"
            >
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm" style={{ color: "hsl(var(--imo-ink-200))" }}>
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-md"
                    style={{
                      background: "hsl(var(--imo-coral-600) / 0.12)",
                      border: "1px solid hsl(var(--imo-coral-600) / 0.3)",
                    }}
                  >
                    <Icon className="size-3.5" style={{ color: "hsl(var(--imo-coral-400))" }} />
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </motion.ul>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Button
                size="lg"
                asChild
                className="gap-2 imo-flame-shimmer text-white border-0 font-semibold text-base h-12 px-7"
                style={{
                  backgroundImage: "var(--imo-gradient-flame)",
                  boxShadow: "var(--imo-shadow-glow-lg)",
                }}
              >
                <Link to="/inscription">
                  Essayer 14 jours gratuit
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="h-12 px-6 font-medium"
                style={{
                  borderColor: "hsl(var(--imo-ink-600))",
                  color: "hsl(var(--imo-ink-100))",
                  background: "transparent",
                }}
              >
                <Link to="/tarifs">Voir les tarifs</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-5 flex items-center gap-4 text-xs font-mono"
              style={{ color: "hsl(var(--imo-ink-500))" }}
            >
              <span className="flex items-center gap-1.5">
                <Check className="size-3" style={{ color: "hsl(var(--imo-amber-400))" }} strokeWidth={3} />
                5 audits inclus
              </span>
              <span style={{ color: "hsl(var(--imo-ink-700))" }}>·</span>
              <span className="flex items-center gap-1.5">
                <Check className="size-3" style={{ color: "hsl(var(--imo-amber-400))" }} strokeWidth={3} />
                Sans CB
              </span>
              <span style={{ color: "hsl(var(--imo-ink-700))" }}>·</span>
              <span className="flex items-center gap-1.5">
                <Check className="size-3" style={{ color: "hsl(var(--imo-amber-400))" }} strokeWidth={3} />
                Annulation libre
              </span>
            </motion.div>
          </div>

          {/* ═══ Colonne droite : audit mockup ═══ */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <AuditMockup />

            {/* Social proof — flottant */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute -bottom-6 -left-4 sm:-left-8 max-w-[240px]"
            >
              <div
                className="rounded-xl px-4 py-3.5"
                style={{
                  background: "hsl(var(--imo-bg-elevated))",
                  border: "1px solid hsl(var(--imo-border))",
                  boxShadow: "var(--imo-shadow-lg)",
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-block h-3 w-[2px] rounded-full" style={{ background: "hsl(var(--imo-coral-600))" }} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] font-mono" style={{ color: "hsl(var(--imo-coral-600))" }}>
                    Cette semaine
                  </span>
                </div>
                <div className="font-bold text-lg leading-tight" style={{ color: "hsl(var(--imo-fg))" }}>
                  340 audits
                </div>
                <div className="text-xs mt-0.5" style={{ color: "hsl(var(--imo-fg-muted))" }}>
                  par 40+ agences en France
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bas de section — bandeau de transition vers le clair */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--imo-ink-50)))" }}
      />
    </section>
  );
}
