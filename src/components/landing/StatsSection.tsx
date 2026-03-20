import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import statsWave from "@/assets/stats-wave.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export function StatsSection() {
  const { t } = useTranslation();

  const stats = [
    { value: "7", label: t("stats.phases") },
    { value: "~45 min", label: t("stats.duration") },
    { value: "100%", label: t("stats.structured") },
  ];

  return (
    <section className="py-16 border-y border-border/30 bg-gradient-to-b from-muted/40 to-background relative overflow-hidden">
      <img
        src={statsWave}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-[0.04] pointer-events-none"
      />

      <div className="container relative">
        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={i}
              className="text-center group"
            >
              <div className="text-4xl md:text-5xl font-black gradient-text tracking-tight">{stat.value}</div>
              <div className="text-sm text-muted-foreground/60 mt-2 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
