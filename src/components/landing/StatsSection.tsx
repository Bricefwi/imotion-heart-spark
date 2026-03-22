import { motion, useInView } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useRef, useEffect, useState } from "react";
import { Layers, Clock, Target } from "lucide-react";
import statsWave from "@/assets/stats-wave.png";

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * value);
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value]);

  return <span ref={ref}>{display}{suffix}</span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export function StatsSection() {
  const { t } = useTranslation();

  const stats = [
    { icon: Layers, value: 7, suffix: "", label: t("stats.phases"), accent: "from-primary to-secondary" },
    { icon: Clock, value: 45, suffix: " min", label: t("stats.duration"), accent: "from-secondary to-amber-500" },
    { icon: Target, value: 100, suffix: "%", label: t("stats.structured"), accent: "from-blue-500 to-primary" },
  ];

  return (
    <section className="py-20 border-y border-border/20 bg-gradient-to-b from-muted/30 via-background to-muted/20 relative overflow-hidden">
      <img
        src={statsWave}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-[0.03] pointer-events-none"
      />

      <div className="container relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={i}
              className="text-center group"
            >
              <div className="relative inline-flex flex-col items-center">
                {/* Icon with gradient background */}
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${stat.accent} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
                {/* Animated number */}
                <div className="text-5xl md:text-6xl font-black gradient-text tracking-tight mb-1">
                  {stat.suffix === " min" ? (
                    <><AnimatedNumber value={stat.value} /><span className="text-3xl ml-1 text-muted-foreground/50">min</span></>
                  ) : stat.suffix === "%" ? (
                    <><AnimatedNumber value={stat.value} /><span className="text-3xl">%</span></>
                  ) : (
                    <AnimatedNumber value={stat.value} />
                  )}
                </div>
                <div className="text-sm text-muted-foreground/60 font-medium tracking-wide uppercase">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
