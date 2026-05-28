import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileCheck, MessageSquare, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionIndex } from "@/components/brand/SectionIndex";
import { Eyebrow } from "@/components/brand/Eyebrow";
import { FlameText } from "@/components/brand/FlameText";
import { EmberCard } from "@/components/brand/EmberCard";

const STEPS = [
  {
    icon: MessageSquare,
    title: "Audit & cahier des charges",
    description:
      "Une conversation guidée avec notre consultant IA, structurée en 7 phases. Vous repartez avec un CDC professionnel téléchargeable.",
    cost: "Gratuit",
  },
  {
    icon: FileCheck,
    title: "Devis personnalisé",
    description:
      "À partir du CDC, nous étudions votre projet et vous proposons une estimation détaillée, basée sur votre périmètre réel — pas sur une grille standard.",
    cost: "Sur mesure",
  },
  {
    icon: Sparkles,
    title: "Accompagnement",
    description:
      "Réalisation, livraison, maintenance : chaque mission fait l'objet d'une proposition adaptée à vos contraintes, votre rythme et votre budget.",
    cost: "Selon périmètre",
  },
];

const FACTORS = [
  "Périmètre fonctionnel et nombre d'écrans",
  "Niveau de personnalisation design",
  "Intégrations tierces (CRM, paiement, API…)",
  "Volumétrie et performances attendues",
  "Délai souhaité et disponibilité de l'équipe",
  "Niveau d'accompagnement post-livraison",
];

export function PricingSection() {
  return (
    <section
      id="approche"
      className="relative py-24 md:py-32 overflow-hidden"
      style={{ background: "hsl(var(--imo-ink-50))" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
        style={{ background: "var(--imo-glow-coral)" }}
      />

      <div className="container relative">
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 mb-16 items-end">
          <div>
            <SectionIndex number="04" label="Notre approche" className="mb-4" />
            <Eyebrow className="mb-3">Honnête · Sur mesure · Sans grille standard</Eyebrow>
          </div>
          <h2
            className="imo-display text-[2.25rem] sm:text-4xl lg:text-5xl"
            style={{ color: "hsl(var(--imo-ink-900))" }}
          >
            Le cahier des charges est <FlameText>gratuit</FlameText>. Le devis est{" "}
            <FlameText>personnalisé</FlameText>.
          </h2>
        </div>

        <p
          className="max-w-2xl text-base lg:text-lg mb-12 leading-relaxed"
          style={{ color: "hsl(var(--imo-fg-muted))" }}
        >
          Nous ne publions pas de grille tarifaire. Chaque projet est unique : afficher des prix
          standards conduirait soit à sur-évaluer des projets simples, soit à sous-évaluer des
          projets complexes. Vous méritez une estimation précise, pas un prix d'appel.
        </p>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-16">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <EmberCard variant="paper" className="!p-8 h-full flex flex-col" glowOnHover>
                <div className="flex items-center justify-between mb-5">
                  <span
                    className="font-mono text-[10px] font-bold tabular-nums uppercase tracking-[0.18em]"
                    style={{ color: "hsl(var(--imo-coral-600))" }}
                  >
                    Étape 0{i + 1}
                  </span>
                  <span
                    className="text-[11px] font-mono uppercase tracking-[0.12em] px-2.5 py-1 rounded-full"
                    style={{
                      background: "hsl(var(--imo-amber-50))",
                      color: "hsl(var(--imo-amber-700))",
                      border: "1px solid hsl(var(--imo-amber-200))",
                    }}
                  >
                    {step.cost}
                  </span>
                </div>

                <div
                  className="size-10 rounded-lg flex items-center justify-center mb-4"
                  style={{
                    background: "hsl(var(--imo-coral-50))",
                    border: "1px solid hsl(var(--imo-coral-200))",
                  }}
                >
                  <step.icon className="size-5" style={{ color: "hsl(var(--imo-coral-600))" }} />
                </div>

                <h3
                  className="text-xl font-bold mb-2 imo-display"
                  style={{ color: "hsl(var(--imo-ink-900))" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "hsl(var(--imo-fg-muted))" }}
                >
                  {step.description}
                </p>
              </EmberCard>
            </motion.div>
          ))}
        </div>

        {/* Facteurs d'estimation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto rounded-2xl p-8 md:p-10"
          style={{
            background: "hsl(var(--imo-bg-elevated))",
            border: "1px solid hsl(var(--imo-border))",
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="size-5" style={{ color: "hsl(var(--imo-coral-600))" }} />
            <h3
              className="text-lg font-bold imo-display"
              style={{ color: "hsl(var(--imo-ink-900))" }}
            >
              Ce qui influence votre devis
            </h3>
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {FACTORS.map((factor) => (
              <li
                key={factor}
                className="flex items-start gap-3 text-sm"
                style={{ color: "hsl(var(--imo-ink-800))" }}
              >
                <span
                  className="mt-1.5 size-1.5 rounded-full shrink-0"
                  style={{ background: "hsl(var(--imo-coral-500))" }}
                />
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button
            size="lg"
            asChild
            className="gap-2 text-white border-0 font-semibold text-base h-12 px-7"
            style={{
              backgroundImage: "var(--imo-gradient-flame)",
              boxShadow: "var(--imo-shadow-glow-lg)",
            }}
          >
            <Link to="/register">
              Démarrer mon cahier des charges gratuit
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <p
            className="text-xs font-mono uppercase tracking-[0.14em] mt-5"
            style={{ color: "hsl(var(--imo-fg-muted))" }}
          >
            Sans carte bancaire · Sans engagement · CDC téléchargeable en PDF
          </p>
        </motion.div>
      </div>
    </section>
  );
}
