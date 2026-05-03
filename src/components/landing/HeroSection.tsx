import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Check,
  Clock,
  TrendingUp,
  Wallet,
  FileText,
  FileSignature,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

/* ---------- AI typing lines (terminal marc-ia) ---------- */
const aiLines = [
  "Analyse du besoin client",
  "Objectifs principaux identifiés",
  "Architecture technique recommandée",
  "Budget estimatif : 12 500 € — 18 000 €",
  "Cahier des charges généré",
];

function MarcTerminal() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= aiLines.length) {
      // restart loop after a pause
      const t = setTimeout(() => setVisibleCount(0), 3500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleCount((c) => c + 1), 900);
    return () => clearTimeout(t);
  }, [visibleCount]);

  return (
    <div className="rounded-2xl bg-[#0F0D0B] border border-white/10 shadow-2xl overflow-hidden font-mono text-[13px] leading-relaxed">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#FF5F57]" />
          <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="size-2.5 rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-white/50 text-xs tracking-tight">
          marc-ia — consultant
        </span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-2 min-h-[180px]">
        {aiLines.map((line, i) => {
          const isVisible = i < visibleCount;
          const isLast = i === visibleCount - 1;
          const isFinal = i === aiLines.length - 1 && isVisible;
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
                  className={`size-3.5 mt-0.5 shrink-0 ${
                    isVisible ? "text-emerald-400" : "text-white/20"
                  }`}
                />
              )}
              <span
                className={`${
                  isFinal ? "text-primary font-medium" : "text-white/85"
                }`}
              >
                {line}
                {isLast && (
                  <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 align-middle animate-pulse" />
                )}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectCard() {
  return (
    <div className="rounded-2xl bg-white shadow-2xl overflow-hidden border border-white/10">
      {/* Browser-like top bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-muted/40">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#FF5F57]" />
          <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="size-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 mx-3">
          <div className="text-[11px] text-muted-foreground text-center font-mono">
            imotion-conseils.fr/dashboard
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              Projet Aurora
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Phase 5 / 7 — Architecture
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
            <Sparkles className="size-3" />
            IA active
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "71%" }}
            transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
            className="h-full bg-gradient-flame rounded-full"
          />
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: TrendingUp, label: "PHASES", value: "5/7" },
            { icon: Clock, label: "DÉLAI", value: "32 min" },
            { icon: Wallet, label: "BUDGET", value: "14 200 €" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border/50 bg-muted/30 p-2.5"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <s.icon className="size-3" />
                <span className="text-[9px] font-semibold tracking-wider">
                  {s.label}
                </span>
              </div>
              <div className="text-sm font-display font-semibold text-foreground mt-1">
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- SCENE B : Devis terminal + CDC delivered ---------- */
const devisLines = [
  "CDC validé par le client",
  "Calcul du devis : 4 options",
  "Acompte 30% — 4 260 €",
  "Contrat prêt à signer",
];

function DevisTerminal() {
  const [visibleCount, setVisibleCount] = useState(0);
  useEffect(() => {
    if (visibleCount >= devisLines.length) {
      const t = setTimeout(() => setVisibleCount(0), 3000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleCount((c) => c + 1), 850);
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
          marc-ia — devis &amp; contrat
        </span>
      </div>
      <div className="p-5 space-y-2 min-h-[180px]">
        {devisLines.map((line, i) => {
          const isVisible = i < visibleCount;
          const isLast = i === visibleCount - 1;
          const isFinal = i === devisLines.length - 1 && isVisible;
          return (
            <motion.div
              key={line}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -8 }}
              transition={{ duration: 0.35 }}
              className="flex items-start gap-2.5"
            >
              {isFinal ? (
                <FileSignature className="size-3.5 text-primary mt-0.5 shrink-0 animate-pulse" />
              ) : (
                <Check
                  className={`size-3.5 mt-0.5 shrink-0 ${
                    isVisible ? "text-emerald-400" : "text-white/20"
                  }`}
                />
              )}
              <span
                className={`${
                  isFinal ? "text-primary font-medium" : "text-white/85"
                }`}
              >
                {line}
                {isLast && (
                  <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 align-middle animate-pulse" />
                )}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function DeliveryCard() {
  return (
    <div className="rounded-2xl bg-white shadow-2xl overflow-hidden border border-white/10">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-muted/40">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#FF5F57]" />
          <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="size-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 mx-3">
          <div className="text-[11px] text-muted-foreground text-center font-mono">
            imotion-conseils.fr/projets/aurora
          </div>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              CDC — Projet Aurora
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              24 pages · Prêt à signer
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-medium">
            <CheckCircle2 className="size-3" />
            Livré
          </div>
        </div>

        {/* Document preview lines */}
        <div className="rounded-xl border border-border/50 bg-muted/30 p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <FileText className="size-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-foreground">
              Cahier des charges complet
            </span>
          </div>
          {[88, 72, 60].map((w, i) => (
            <motion.div
              key={i}
              initial={{ width: 0 }}
              animate={{ width: `${w}%` }}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.15 }}
              className="h-1.5 rounded-full bg-gradient-to-r from-primary/40 to-primary/10"
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: FileText, label: "DEVIS", value: "14 200 €" },
            { icon: Clock, label: "DÉLAI", value: "6 sem." },
            { icon: FileSignature, label: "STATUT", value: "Signé" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border/50 bg-muted/30 p-2.5"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <s.icon className="size-3" />
                <span className="text-[9px] font-semibold tracking-wider">
                  {s.label}
                </span>
              </div>
              <div className="text-sm font-display font-semibold text-foreground mt-1">
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Alternating mockup composition ---------- */
const SCENES = [
  {
    id: "discovery",
    badge: "CDC prêt en 45 min",
    label: "Discovery",
    Card: ProjectCard,
    Terminal: MarcTerminal,
  },
  {
    id: "delivery",
    badge: "Devis & contrat générés",
    label: "Livraison",
    Card: DeliveryCard,
    Terminal: DevisTerminal,
  },
] as const;

function HeroMockup() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % SCENES.length), 6500);
    return () => clearTimeout(t);
  }, [index, paused]);

  const scene = SCENES[index];
  const Card = scene.Card;
  const Terminal = scene.Terminal;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Floating badge — re-mount on scene change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`badge-${scene.id}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.45 }}
          className="absolute -top-3 right-2 sm:-top-4 sm:right-4 z-30 flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-400/15 border border-emerald-400/30 backdrop-blur-md"
        >
          <CheckCircle2 className="size-3 sm:size-3.5 text-emerald-400" />
          <span className="text-[10px] sm:text-xs font-medium text-emerald-300 whitespace-nowrap">
            {scene.badge}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Scene crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative"
        >
          <div className="relative z-10">
            <Card />
          </div>
          <div className="absolute -bottom-8 sm:-bottom-10 lg:-bottom-12 left-2 sm:-left-6 lg:-left-16 w-[92%] sm:w-[82%] lg:w-[78%] z-20">
            <Terminal />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Scene indicators (clickable) */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Voir scène ${s.label}`}
            className="group flex items-center gap-1.5"
          >
            <span
              className={`block h-1.5 rounded-full transition-all duration-500 ${
                i === index ? "w-8 bg-primary" : "w-1.5 bg-white/30 group-hover:bg-white/60"
              }`}
            />
            <span
              className={`text-[10px] font-medium uppercase tracking-wider transition-colors ${
                i === index ? "text-white" : "text-white/40 group-hover:text-white/70"
              }`}
            >
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 80% at 85% 0%, rgba(245,124,0,0.18) 0%, rgba(214,59,26,0.08) 35%, transparent 70%), linear-gradient(180deg, #0B1020 0%, #0F1530 60%, #0B1020 100%)",
      }}
    >
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      {/* Soft halo top-right */}
      <div
        className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(245,138,0,0.35) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />

      <div className="container relative py-14 sm:py-20 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-10 sm:gap-14 lg:gap-16 items-center">
          {/* LEFT — Headline + CTA */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-white">
            {/* Brand wordmark display */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-display font-bold tracking-tight leading-none text-[44px] xs:text-[56px] sm:text-[80px] md:text-[96px] lg:text-[112px] text-white break-words">
                IMOTION
              </h1>
              <p className="mt-2 font-display uppercase tracking-[0.24em] sm:tracking-[0.32em] text-[10px] sm:text-xs md:text-sm text-white/50">
                Creator Studio
              </p>
            </motion.div>

            {/* Sub-headline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="space-y-5"
            >
              <h2 className="font-display text-[26px] sm:text-3xl md:text-4xl lg:text-[44px] font-semibold leading-[1.15] tracking-tight">
                Transformez vos idées en{" "}
                <span className="bg-gradient-to-r from-[#F57C00] to-[#D63B1A] bg-clip-text text-transparent">
                  projets digitaux concrets
                </span>
              </h2>
              <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-xl">
                Notre IA vous guide pour définir précisément votre besoin et
                génère automatiquement votre cahier des charges —{" "}
                <span className="font-semibold text-white">100% gratuit</span>.
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 w-full"
            >
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-[#F57C00] to-[#D63B1A] border-0 hover:shadow-[0_10px_40px_-10px_rgba(245,124,0,0.6)] hover:-translate-y-0.5 transition-all duration-300 h-14 px-5 sm:px-7 text-sm sm:text-base font-semibold"
              >
                <Link to="/register" className="flex items-center justify-center min-w-0">
                  <Sparkles className="size-4 mr-2 shrink-0" />
                  <span className="truncate">Créer mon CDC gratuitement</span>
                  <ArrowRight className="size-4 ml-2 shrink-0" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-14 px-5 sm:px-7 text-sm sm:text-base font-semibold bg-white/5 border-white/15 text-white hover:bg-white/10 hover:border-white/25 backdrop-blur-sm"
              >
                <Link to="/fonctionnalites" className="flex items-center justify-center">Voir la démo</Link>
              </Button>
            </motion.div>

            {/* Trust line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/60"
            >
              {["100% gratuit", "Sans engagement", "En 45 min"].map((label) => (
                <div key={label} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-400/80" />
                  {label}
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — Mockup composition */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-6 relative mt-4 lg:mt-0 pb-16 sm:pb-20 lg:pb-0"
          >
            {/* Floating badge "CDC prêt en 45 min" */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="absolute -top-3 right-2 sm:-top-4 sm:right-4 z-30 flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-400/15 border border-emerald-400/30 backdrop-blur-md"
            >
              <CheckCircle2 className="size-3 sm:size-3.5 text-emerald-400" />
              <span className="text-[10px] sm:text-xs font-medium text-emerald-300 whitespace-nowrap">
                CDC prêt en 45 min
              </span>
            </motion.div>

            {/* Project card (top layer) */}
            <div className="relative z-10">
              <ProjectCard />
            </div>

            {/* Marc terminal (overlapping) — décalage réduit en mobile pour ne pas déborder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute -bottom-8 sm:-bottom-10 lg:-bottom-12 left-2 sm:-left-6 lg:-left-16 w-[92%] sm:w-[82%] lg:w-[78%] z-20"
            >
              <MarcTerminal />
            </motion.div>

            {/* Subtle glow under cards */}
            <div
              className="absolute inset-0 -z-10 blur-3xl opacity-50"
              style={{
                background:
                  "radial-gradient(circle at 50% 60%, rgba(245,138,0,0.25), transparent 60%)",
              }}
              aria-hidden="true"
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-b from-transparent to-background pointer-events-none" />
    </section>
  );
}
