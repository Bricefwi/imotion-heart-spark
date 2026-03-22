import { motion } from "framer-motion";
import { Shield, Award, Zap, Lock } from "lucide-react";

const trustBadges = [
  { icon: Shield, label: "Données sécurisées", sublabel: "Hébergement EU" },
  { icon: Zap, label: "IA de dernière génération", sublabel: "GPT & Claude" },
  { icon: Award, label: "+150 entreprises", sublabel: "nous font confiance" },
  { icon: Lock, label: "RGPD conforme", sublabel: "100% transparent" },
];

export function TrustBar() {
  return (
    <section className="py-10 border-b border-border/20 bg-muted/20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-14"
        >
          {trustBadges.map((badge) => (
            <div key={badge.label} className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                <badge.icon className="h-5 w-5 text-primary/70" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground/80">{badge.label}</div>
                <div className="text-[11px] text-muted-foreground/60">{badge.sublabel}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
