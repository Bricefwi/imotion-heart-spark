import { motion } from "framer-motion";
import { MessageCircle, FileText, FileCheck, ArrowRight } from "lucide-react";
import { SectionIndex } from "@/components/brand/SectionIndex";
import { Eyebrow } from "@/components/brand/Eyebrow";
import { FlameText } from "@/components/brand/FlameText";
import { EmberCard } from "@/components/brand/EmberCard";
import { Stamp } from "@/components/brand/Stamp";

const STEPS = [
  {
    n: "01",
    label: "Diagnostic gratuit",
    icon: MessageCircle,
    title: "Diagnostic gratuit",
    desc: "Un audit de maturité et une découverte guidée de votre besoin, en quelques minutes.",
    bullets: ["Audit de maturité", "Découverte guidée", "Sans engagement"],
  },
  {
    n: "02",
    label: "Cahier des charges",
    icon: FileText,
    title: "Cahier des charges",
    desc: "Un document initial téléchargeable, qui vous appartient, sans engagement.",
    bullets: ["Document structuré", "Téléchargeable PDF", "Votre propriété"],
  },
  {
    n: "03",
    label: "Proposition sur mesure",
    icon: FileCheck,
    title: "Proposition sur mesure",
    desc: "Pour les projets que nous prenons en charge : une analyse approfondie et un chiffrage validé par un expert.",
    bullets: ["Analyse approfondie", "Chiffrage personnalisé", "Validation humaine"],
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
            <Eyebrow className="mb-3">Trois étapes claires</Eyebrow>
          </div>
          <h2
            className="imo-display text-[2.25rem] sm:text-4xl lg:text-5xl"
            style={{ color: "hsl(var(--imo-ink-900))" }}
          >
            Du premier échange à la{" "}
            <FlameText>proposition validée par un consultant.</FlameText>
          </h2>
        </div>

        <div className="imo-editorial-rule mb-12">
          <span>Votre parcours</span>
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
              {i < STEPS.length - 1 && (
                <ArrowRight
                  className="hidden md:block absolute -right-5 lg:-right-7 top-12 size-5 z-10 opacity-40"
                  style={{ color: "hsl(var(--imo-coral-600))" }}
                />
              )}

              <EmberCard variant="paper" className="h-full !p-7">
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
                  <Stamp tone="amber">Étape</Stamp>
                </div>

                <div
                  className="size-10 rounded-lg flex items-center justify-center mb-4"
                  style={{
                    background: "hsl(var(--imo-amber-50))",
                    border: "1px solid hsl(var(--imo-amber-200))",
                  }}
                >
                  <step.icon className="size-5" style={{ color: "hsl(var(--imo-coral-600))" }} />
                </div>

                <h3 className="text-xl font-bold mb-2 imo-display" style={{ color: "hsl(var(--imo-ink-900))" }}>
                  {step.title}
                </h3>

                <p className="text-sm mb-5 leading-relaxed" style={{ color: "hsl(var(--imo-fg-muted))" }}>
                  {step.desc}
                </p>

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
      </div>
    </section>
  );
}
