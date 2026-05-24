import { motion } from "framer-motion";
import { SectionIndex } from "@/components/brand/SectionIndex";
import { Eyebrow } from "@/components/brand/Eyebrow";
import { FlameText } from "@/components/brand/FlameText";
import { DocumentFrame } from "@/components/brand/DocumentFrame";
import { Stamp } from "@/components/brand/Stamp";

export function DocumentsPreview() {
  return (
    <section
      className="relative py-24 md:py-32 overflow-hidden imo-grain"
      style={{ background: "hsl(var(--imo-bg-elevated))" }}
    >
      <div className="container">

        {/* Header */}
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 mb-16 items-end">
          <div>
            <SectionIndex number="03" label="Livrables" className="mb-4" />
            <Eyebrow className="mb-3">À chaque audit complété</Eyebrow>
          </div>
          <h2
            className="imo-display text-[2.25rem] sm:text-4xl lg:text-5xl"
            style={{ color: "hsl(var(--imo-ink-900))" }}
          >
            Un cahier des charges{" "}
            <FlameText>professionnel et actionnable</FlameText>,{" "}
            prêt à partager.
          </h2>
        </div>

        <div className="imo-editorial-rule mb-12">
          <span>Aperçu — exemple fictif à but illustratif</span>
        </div>

        {/* Two documents grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">

          {/* CDC */}
          <motion.div
            initial={{ opacity: 0, x: -24, rotate: -1 }}
            whileInView={{ opacity: 1, x: 0, rotate: -1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <DocumentFrame docType="CDC" reference="CDC-2026-0142" date="03 mai 2026" status="livré" ribbon="coral">
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.14em]" style={{ color: "hsl(var(--imo-coral-600))" }}>
                    Projet Aurora
                  </div>
                  <div className="text-2xl font-bold mt-1 leading-tight imo-display" style={{ color: "hsl(var(--imo-ink-900))" }}>
                    Plateforme de gestion <FlameText>de projets digitaux</FlameText>
                  </div>
                  <p className="text-sm mt-2" style={{ color: "hsl(var(--imo-fg-muted))" }}>
                    Document généré par les 8 agents Clarivi sur la base d'un audit conversationnel de 6 minutes.
                  </p>
                </div>

                {/* Metrics row */}
                <div
                  className="grid grid-cols-4 gap-px rounded-lg overflow-hidden"
                  style={{ background: "hsl(var(--imo-border))" }}
                >
                  {[
                    { k: "Client", v: "Exemple" },
                    { k: "Type", v: "Plateforme" },
                    { k: "Délai", v: "à définir" },
                    { k: "Phase", v: "3/3" },
                  ].map(({ k, v }) => (
                    <div key={k} className="px-3 py-2.5" style={{ background: "hsl(var(--imo-bg-elevated))" }}>
                      <div className="text-[9px] uppercase tracking-[0.14em] font-mono" style={{ color: "hsl(var(--imo-fg-subtle))" }}>{k}</div>
                      <div className="font-bold text-sm mt-0.5 tabular-nums" style={{ color: "hsl(var(--imo-ink-900))" }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Sections list */}
                <div className="space-y-1">
                  {[
                    { n: "01", t: "Contexte & objectifs" },
                    { n: "02", t: "Architecture technique" },
                    { n: "03", t: "Périmètre fonctionnel" },
                    { n: "04", t: "Budget estimatif" },
                  ].map(({ n, t }, i) => (
                    <div
                      key={n}
                      className="flex items-center gap-3 py-1.5"
                      style={{ opacity: i === 3 ? 0.5 : 1 }}
                    >
                      <span className="text-[10px] font-mono font-bold tabular-nums" style={{ color: "hsl(var(--imo-coral-600))" }}>{n}</span>
                      <span className="text-sm" style={{ color: "hsl(var(--imo-ink-800))" }}>{t}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] font-mono pt-3 border-t" style={{ color: "hsl(var(--imo-fg-subtle))", borderColor: "hsl(var(--imo-ink-100))" }}>
                  ~2 400 mots · 8 sections · Markdown + PDF
                </div>
              </div>
            </DocumentFrame>

            {/* Floating badge */}
            <div className="absolute -top-3 -left-3 imo-stamp-wobble">
              <Stamp tone="coral">CDC livré</Stamp>
            </div>
          </motion.div>

          {/* Aperçu des sections — pas de devis chiffré */}
          <motion.div
            initial={{ opacity: 0, x: 24, rotate: 1 }}
            whileInView={{ opacity: 1, x: 0, rotate: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative lg:mt-8"
          >
            <DocumentFrame docType="CDC" reference="Aperçu" date="Exemple" status="démo" ribbon="ember">
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.14em]" style={{ color: "hsl(var(--imo-amber-600))" }}>
                    Structure type d'un CDC
                  </div>
                  <div className="text-2xl font-bold mt-1 leading-tight imo-display" style={{ color: "hsl(var(--imo-ink-900))" }}>
                    Sections <FlameText variant="ember">générées</FlameText>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {[
                    { n: "01", t: "Contexte & objectifs métier" },
                    { n: "02", t: "Personas & parcours utilisateurs" },
                    { n: "03", t: "Périmètre fonctionnel détaillé" },
                    { n: "04", t: "Architecture & contraintes techniques" },
                    { n: "05", t: "Modèle de données & intégrations" },
                    { n: "06", t: "Sécurité, conformité & RGPD" },
                    { n: "07", t: "Planning prévisionnel & jalons" },
                    { n: "08", t: "Critères de réussite" },
                  ].map(({ n, t }) => (
                    <div
                      key={n}
                      className="flex items-center gap-3 py-1.5 border-b"
                      style={{ borderColor: "hsl(var(--imo-ink-100))" }}
                    >
                      <span className="text-[10px] font-mono font-bold tabular-nums" style={{ color: "hsl(var(--imo-amber-600))" }}>
                        {n}
                      </span>
                      <span className="text-sm flex-1" style={{ color: "hsl(var(--imo-ink-800))" }}>
                        {t}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] font-mono pt-1" style={{ color: "hsl(var(--imo-fg-subtle))" }}>
                  Le devis associé est ensuite construit sur mesure, hors plateforme.
                </div>
              </div>
            </DocumentFrame>

            <div className="absolute -top-3 -right-3 imo-stamp-wobble" style={{ animationDelay: "1.5s" }}>
              <Stamp tone="amber">Structure type</Stamp>
            </div>
          </motion.div>
        </div>

        {/* Note de bas de section */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm mt-16 max-w-xl mx-auto"
          style={{ color: "hsl(var(--imo-fg-muted))" }}
        >
          Aperçu non contractuel à but illustratif. Le contenu réel de votre CDC est{" "}
          <strong style={{ color: "hsl(var(--imo-ink-900))" }}>construit à partir de vos réponses</strong>{" "}
          et téléchargeable en PDF.
        </motion.p>
      </div>
    </section>
  );
}
