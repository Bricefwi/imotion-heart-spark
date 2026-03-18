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
    <section className="py-14 border-y bg-muted/30 relative overflow-hidden">
      <img
        src={statsWave}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-[0.06] pointer-events-none"
      />

      <div className="container relative">
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={i}
              className="text-center"
            >
              <div className="font-display text-3xl md:text-4xl font-extrabold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
