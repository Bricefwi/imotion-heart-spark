import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionIndex } from "@/components/brand/SectionIndex";
import { Eyebrow } from "@/components/brand/Eyebrow";
import { FlameText } from "@/components/brand/FlameText";
import { Stamp } from "@/components/brand/Stamp";

/**
 * CTASection signature imotion — section sombre dawn-gradient avec halo ember
 * et structure éditoriale. Termine la landing en mode "appel à l'action premium".
 */
export function CTASectionImotion() {
  return (
    <section
      className="relative overflow-hidden py-24 md:py-32"
      style={{ background: "var(--imo-gradient-dawn)" }}
    >
      {/* Glow ember diffus */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--imo-glow-amber)" }}
      />

      {/* Halo radial central */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] blur-3xl opacity-50"
        style={{ background: "radial-gradient(circle, hsl(var(--imo-coral-600) / 0.4) 0%, transparent 70%)" }}
      />

      <div className="container relative">

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6 flex justify-center"
          >
            <SectionIndex number="05" label="Démarrer maintenant" tone="light" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-5 flex justify-center"
          >
            <Eyebrow tone="light">14 jours · Sans CB · Annulation libre</Eyebrow>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="imo-display text-[2.5rem] sm:text-5xl lg:text-6xl mb-6"
            style={{ color: "hsl(var(--imo-ink-50))" }}
          >
            Transformez votre tunnel commercial{" "}
            <FlameText>cette semaine.</FlameText>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-lg mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: "hsl(var(--imo-ink-300))" }}
          >
            Setup en moins de 10 minutes. Premier audit prospect prêt à envoyer
            dans la foulée. Vous gardez 100 % de la marge.
          </motion.p>

          {/* Stamps preview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-10"
          >
            <Stamp tone="dashed" className="!text-[hsl(var(--imo-coral-300))] !border-[hsl(var(--imo-coral-400)/0.5)] !bg-[hsl(var(--imo-ink-900)/0.4)]">
              5 audits inclus
            </Stamp>
            <Stamp tone="dashed" className="!text-[hsl(var(--imo-amber-300))] !border-[hsl(var(--imo-amber-400)/0.5)] !bg-[hsl(var(--imo-ink-900)/0.4)]">
              White-label day 1
            </Stamp>
            <Stamp tone="dashed" className="!text-[hsl(var(--imo-coral-300))] !border-[hsl(var(--imo-coral-400)/0.5)] !bg-[hsl(var(--imo-ink-900)/0.4)]">
              CDC + Devis auto
            </Stamp>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Button
              size="lg"
              asChild
              className="gap-2 imo-flame-shimmer text-white border-0 font-semibold text-base h-13 px-8"
              style={{
                backgroundImage: "var(--imo-gradient-flame)",
                boxShadow: "var(--imo-shadow-glow-lg)",
                height: "52px",
              }}
            >
              <Link to="/inscription">
                Démarrer mon essai gratuit
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="font-medium px-7"
              style={{
                borderColor: "hsl(var(--imo-ink-600))",
                color: "hsl(var(--imo-ink-100))",
                background: "transparent",
                height: "52px",
              }}
            >
              <Link to="/contact">Réserver une démo</Link>
            </Button>
          </motion.div>

          {/* Reassurance line */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-10 text-xs font-mono uppercase tracking-[0.14em]"
            style={{ color: "hsl(var(--imo-ink-500))" }}
          >
            Hébergé en UE · RGPD · Données prospects chiffrées
          </motion.p>
        </div>
      </div>
    </section>
  );
}
