import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, AlertTriangle, Compass, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionIndex } from "@/components/brand/SectionIndex";
import { Eyebrow } from "@/components/brand/Eyebrow";
import { FlameText } from "@/components/brand/FlameText";

const ETAPES = [
  { n: "01", label: "Diagnostic", desc: "Nous évaluons votre maturité digitale." },
  { n: "02", label: "Conseil", desc: "Nous concevons une solution réaliste." },
  { n: "03", label: "Build", desc: "Nous la construisons avec vous." },
  { n: "04", label: "Run", desc: "Nous l'accompagnons dans la durée." },
];

export function ConstatReponseSection() {
  return (
    <section className="relative py-24 md:py-32 bg-background border-t border-border">
      <div className="container max-w-6xl">

        <div className="mb-12">
          <SectionIndex number="03" label="Le constat & notre réponse" className="mb-4" />
        </div>

        {/* Constat */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-[auto_1fr] gap-6 mb-16 items-start"
        >
          <div
            className="size-14 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "hsl(var(--imo-coral-50))",
              border: "1px solid hsl(var(--imo-coral-200))",
            }}
          >
            <AlertTriangle className="size-6" style={{ color: "hsl(var(--imo-coral-600))" }} />
          </div>
          <div>
            <Eyebrow className="mb-3">Le constat</Eyebrow>
            <h2 className="imo-display text-2xl md:text-3xl font-bold mb-3" style={{ color: "hsl(var(--imo-ink-900))" }}>
              Beaucoup de projets digitaux échouent <FlameText>par manque de cadrage.</FlameText>
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-3xl">
              Périmètre flou, budget mal estimé, solution mal choisie. Nous commençons toujours par
              clarifier le besoin avant de proposer quoi que ce soit.
            </p>
          </div>
        </motion.div>

        {/* Notre réponse */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid md:grid-cols-[auto_1fr] gap-6 mb-12 items-start"
        >
          <div
            className="size-14 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "hsl(var(--imo-amber-50))",
              border: "1px solid hsl(var(--imo-amber-200))",
            }}
          >
            <Compass className="size-6" style={{ color: "hsl(var(--imo-amber-700))" }} />
          </div>
          <div>
            <Eyebrow className="mb-3">Notre réponse</Eyebrow>
            <h2 className="imo-display text-2xl md:text-3xl font-bold mb-3" style={{ color: "hsl(var(--imo-ink-900))" }}>
              Une méthode en <FlameText>quatre temps.</FlameText>
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-3xl mb-6">
              Nous diagnostiquons votre maturité, nous concevons une solution réaliste, nous la
              construisons, puis nous l'accompagnons dans la durée. Chaque étape produit un livrable concret.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ETAPES.map((e) => (
                <div
                  key={e.n}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="text-xs font-mono font-bold tracking-[0.18em] mb-2" style={{ color: "hsl(var(--imo-coral-600))" }}>
                    {e.n} · {e.label}
                  </div>
                  <p className="text-sm text-muted-foreground">{e.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Cabinet augmenté + Offres teasers */}
        <div className="grid md:grid-cols-2 gap-6 mt-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-border bg-card p-7"
          >
            <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center mb-4">
              <Users className="size-5" />
            </div>
            <h3 className="font-bold text-xl mb-3">Cabinet augmenté</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Nos consultants IA spécialisés analysent chaque dossier qualifié — cadrage,
              faisabilité, chiffrage, qualité — sous la supervision d'un consultant humain.
              Vous gagnez en rapidité et en rigueur, sans sacrifier le jugement humain.
            </p>
            <Button variant="ghost" asChild className="gap-2 -ml-3">
              <Link to="/cabinet">
                En savoir plus sur notre cabinet <ArrowRight className="size-4" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-7"
          >
            <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center mb-4">
              <Sparkles className="size-5" />
            </div>
            <h3 className="font-bold text-xl mb-3">Nos offres</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Diagnostic · Conseil stratégique · Build · Run. Du cadrage à la mise en production,
              puis l'accompagnement.
            </p>
            <Button variant="ghost" asChild className="gap-2 -ml-3">
              <Link to="/offres">
                Voir les offres <ArrowRight className="size-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
