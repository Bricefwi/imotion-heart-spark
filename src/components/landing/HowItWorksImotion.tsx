import { motion } from "framer-motion";
import { MessageCircle, Target, FileCheck, ArrowRight } from "lucide-react";
import { SectionIndex } from "@/components/brand/SectionIndex";
import { Eyebrow } from "@/components/brand/Eyebrow";
import { FlameText } from "@/components/brand/FlameText";
import { EmberCard } from "@/components/brand/EmberCard";
import { Stamp } from "@/components/brand/Stamp";

const STEPS = [
  {
    n: "P1",
    label: "Intake",
    duration: "2 min",
    icon: MessageCircle,
    title: "Identité & douleur",
    desc: "Capture le contexte du prospect, son rôle, son secteur — et quantifie sa douleur en heures ou en euros.",
    bullets: [
      "Persona & entreprise",
      "Enjeux & contexte",
      "Niveau d'impact",
    ],
  },
  {
    n: "P2",
    label: "Need analysis",
    duration: "2 min",
    icon: Target,
    title: "Vision & écosystème",
    desc: "Projette la solution idéale, cartographie les outils existants, distingue must-have et nice-to-have.",
    bullets: [
      "Vision projet à 6 mois",
      "Stack actuelle",
      "Features prioritaires",
    ],
  },
  {
    n: "P3",
    label: "Scoping",
    duration: "2 min",
    icon: FileCheck,
    title: "Périmètre & gouvernance",
    desc: "Cadre commercial : enveloppe indicative, délai, décideurs, urgence. Synthèse de qualification livrée.",
    bullets: [
      "Périmètre & timeline",
      "Décideurs identifiés",
      "Synthèse de qualification",
    ],
  },
];

export function HowItWorksImotion() {
  return (
    <section
      className="relative py-24 md:py-32 overflow-hidden"
      style={{ background: "hsl(var(--imo-ink-50))" }}
    >
      <div className="container">

        {/* Header éditorial */}
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 mb-16 items-end">
          <div>
            <SectionIndex number="02" label="Comment ça marche" className="mb-4" />
            <Eyebrow className="mb-3">3 phases · 6 minutes</Eyebrow>
          </div>
          <h2
            className="imo-display text-[2.25rem] sm:text-4xl lg:text-5xl"
            style={{ color: "hsl(var(--imo-ink-900))" }}
          >
            Un audit conversationnel{" "}
            <FlameText>guidé par 8 agents IA</FlameText>{" "}
            spécialisés.
          </h2>
        </div>

        {/* Editorial rule */}
        <div className="imo-editorial-rule mb-12">
          <span>Le parcours prospect</span>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Arrow between cards (desktop) */}
              {i < STEPS.length - 1 && (
                <ArrowRight
                  className="hidden md:block absolute -right-5 lg:-right-7 top-12 size-5 z-10 opacity-40"
                  style={{ color: "hsl(var(--imo-coral-600))" }}
                />
              )}

              <EmberCard variant="paper" className="h-full !p-7">
                {/* Phase index */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex size-9 items-center justify-center rounded-md font-mono font-bold text-sm tabular-nums"
                      style={{
                        background: "hsl(var(--imo-coral-600))",
                        color: "white",
                        boxShadow: "var(--imo-shadow-sm)",
                      }}
                    >
                      {step.n}
                    </span>
                    <Eyebrow tone="muted">{step.label}</Eyebrow>
                  </div>
                  <Stamp tone="amber">{step.duration}</Stamp>
                </div>

                {/* Icon */}
                <div
                  className="size-10 rounded-lg flex items-center justify-center mb-4"
                  style={{
                    background: "hsl(var(--imo-amber-50))",
                    border: "1px solid hsl(var(--imo-amber-200))",
                  }}
                >
                  <step.icon className="size-5" style={{ color: "hsl(var(--imo-coral-600))" }} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-2 imo-display" style={{ color: "hsl(var(--imo-ink-900))" }}>
                  {step.title}
                </h3>

                {/* Desc */}
                <p className="text-sm mb-5 leading-relaxed" style={{ color: "hsl(var(--imo-fg-muted))" }}>
                  {step.desc}
                </p>

                {/* Bullets — style ribbon */}
                <ul className="space-y-1.5">
                  {step.bullets.map((b) => (
                    <li
                      key={b}
                      className="text-xs imo-ribbon-left font-mono uppercase tracking-[0.06em] py-0.5"
                      style={{ color: "hsl(var(--imo-ink-700))" }}
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </EmberCard>
            </motion.div>
          ))}
        </div>

        {/* Phase finale — banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-10"
        >
          <div
            className="rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-8"
            style={{
              background: "var(--imo-gradient-dusk)",
              border: "1px solid hsl(var(--imo-ink-800))",
              boxShadow: "var(--imo-shadow-glow)",
            }}
          >
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-block h-8 w-[3px] rounded-full" style={{ background: "var(--imo-gradient-flame)" }} />
              <Stamp tone="dashed" className="!text-[hsl(var(--imo-coral-300))] !border-[hsl(var(--imo-coral-400)/0.7)] !bg-[hsl(var(--imo-coral-900)/0.4)]">
                Phase finale
              </Stamp>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1 imo-display" style={{ color: "hsl(var(--imo-ink-50))" }}>
                Validation & génération du <FlameText>cahier des charges</FlameText>.
              </h3>
              <p className="text-sm" style={{ color: "hsl(var(--imo-ink-300))" }}>
                Contrôle qualité, anti-hallucination, synthèse de qualification. Notification envoyée à l'équipe.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 shrink-0 md:gap-6 font-mono">
              {[
                { k: "Phases", v: "7" },
                { k: "Durée", v: "~45 min" },
                { k: "Livrable", v: "PDF" },
              ].map(({ k, v }) => (
                <div key={k} className="text-center">
                  <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "hsl(var(--imo-ink-500))" }}>{k}</div>
                  <div className="font-bold mt-0.5" style={{ color: "hsl(var(--imo-amber-400))" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
