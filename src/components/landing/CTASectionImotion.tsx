import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionIndex } from "@/components/brand/SectionIndex";
import { Eyebrow } from "@/components/brand/Eyebrow";
import { FlameText } from "@/components/brand/FlameText";
import { Stamp } from "@/components/brand/Stamp";

/**
 * CTASection signature imotion — section CLAIRE (coral-50) en contrepoint
 * du hero sombre : titre encre, CTA coral plein, aucun halo empilé.
 */
export function CTASectionImotion() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32 bg-imo-coral-50">
      <div className="container relative">

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6 flex justify-center"
          >
            <SectionIndex number="05" label="Démarrer maintenant" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-5 flex justify-center"
          >
            <Eyebrow>Sans engagement · Cahier des charges offert · Validation humaine</Eyebrow>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-display imo-display text-[2.5rem] sm:text-5xl lg:text-6xl mb-6 text-imo-ink-900"
          >
            Prêt à clarifier votre projet ?{" "}
            <FlameText>Commencez par le diagnostic gratuit.</FlameText>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-lg mb-10 max-w-2xl mx-auto leading-relaxed text-imo-ink-600"
          >
            En quelques minutes, évaluez votre maturité, structurez votre besoin et repartez avec
            un cahier des charges initial. Vous restez libre à chaque étape.
          </motion.p>

          {/* Stamps preview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-10"
          >
            <Stamp tone="dashed" className="!text-[hsl(var(--imo-coral-700))] !border-[hsl(var(--imo-coral-300))] !bg-white/60">
              Gratuit
            </Stamp>
            <Stamp tone="dashed" className="!text-[hsl(var(--imo-amber-700))] !border-[hsl(var(--imo-amber-300))] !bg-white/60">
              Sans engagement
            </Stamp>
            <Stamp tone="dashed" className="!text-[hsl(var(--imo-coral-700))] !border-[hsl(var(--imo-coral-300))] !bg-white/60">
              Validation humaine
            </Stamp>
          </motion.div>

          {/* CTAs — coral plein, glow uniquement au hover */}
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
              className="gap-2 bg-imo-coral-600 hover:bg-imo-coral-700 hover:shadow-glow text-white border-0 font-semibold text-base h-[52px] px-8 transition-colors"
            >
              <Link to="/diagnostic">
                Démarrer mon diagnostic
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="font-medium px-7 h-[52px] border-imo-ink-300 text-imo-ink-700 bg-transparent hover:bg-white/60"
            >
              <Link to="/methode">Découvrir la méthode</Link>
            </Button>
          </motion.div>

          {/* Reassurance line */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-10 text-xs font-mono uppercase tracking-[0.14em] text-imo-ink-500"
          >
            Hébergé en UE · RGPD · Données prospects chiffrées
          </motion.p>
        </div>
      </div>
    </section>
  );
}
