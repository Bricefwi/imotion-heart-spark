import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Lightbulb, ArrowRight, Sparkles, Play, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import heroImg from "@/assets/hero-illustration.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const letterVariants = {
  hidden: { opacity: 0, y: 20, rotateX: -90 },
  visible: (i: number) => ({
    opacity: 1, y: 0, rotateX: 0,
    transition: { delay: i * 0.04, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

/* Simulated AI typing lines */
const aiLines = [
  { text: "Analyse du besoin client...", delay: 0 },
  { text: "Objectifs principaux identifiés", delay: 1200 },
  { text: "Architecture technique recommandée", delay: 2600 },
  { text: "Budget estimatif : 12 500 € — 18 000 €", delay: 4000 },
  { text: "Cahier des charges généré !", delay: 5500 },
];

function AITypingDemo() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [lineComplete, setLineComplete] = useState<boolean[]>([]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    aiLines.forEach((line, idx) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(idx + 1);
          setCurrentText("");
          // Animate typing character by character
          const chars = line.text.split("");
          chars.forEach((_, charIdx) => {
            timers.push(
              setTimeout(() => {
                setCurrentText(line.text.slice(0, charIdx + 1));
                if (charIdx === chars.length - 1) {
                  setLineComplete((prev) => {
                    const next = [...prev];
                    next[idx] = true;
                    return next;
                  });
                }
              }, charIdx * 25)
            );
          });
        }, line.delay)
      );
    });

    // Loop the animation
    const loopTimer = setTimeout(() => {
      setVisibleLines(0);
      setCurrentText("");
      setLineComplete([]);
    }, 8000);
    timers.push(loopTimer);

    const interval = setInterval(() => {
      setVisibleLines(0);
      setCurrentText("");
      setLineComplete([]);
      aiLines.forEach((line, idx) => {
        timers.push(
          setTimeout(() => {
            setVisibleLines(idx + 1);
            setCurrentText("");
            const chars = line.text.split("");
            chars.forEach((_, charIdx) => {
              timers.push(
                setTimeout(() => {
                  setCurrentText(line.text.slice(0, charIdx + 1));
                  if (charIdx === chars.length - 1) {
                    setLineComplete((prev) => {
                      const next = [...prev];
                      next[idx] = true;
                      return next;
                    });
                  }
                }, charIdx * 25)
              );
            });
          }, line.delay)
        );
      });
    }, 9000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl w-full max-w-sm">
      {/* Terminal header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[11px] text-white/40 font-mono ml-2">marc-ia — consultant</span>
      </div>
      {/* AI lines */}
      <div className="space-y-2.5 font-mono text-[12px] min-h-[140px]">
        {aiLines.slice(0, visibleLines).map((line, idx) => {
          const isLast = idx === visibleLines - 1;
          const isComplete = lineComplete[idx];
          const displayText = isLast && !isComplete ? currentText : line.text;
          const isFinal = idx === aiLines.length - 1 && isComplete;

          return (
            <div key={idx} className="flex items-start gap-2">
              {isComplete ? (
                <CheckCircle2 className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${isFinal ? "text-green-400" : "text-primary/70"}`} />
              ) : (
                <div className="h-3.5 w-3.5 mt-0.5 shrink-0 rounded-full border-2 border-primary/50 border-t-transparent animate-spin" />
              )}
              <span className={`${isFinal ? "text-green-400 font-semibold" : "text-white/70"} leading-relaxed`}>
                {displayText}
                {isLast && !isComplete && (
                  <span className="inline-block w-[2px] h-3.5 bg-primary ml-0.5 animate-pulse" />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Floating decorative elements */
function FloatingShapes() {
  return (
    <>
      <motion.div
        animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-[15%] w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm border border-white/10 hidden lg:block"
      />
      <motion.div
        animate={{ y: [10, -15, 10], rotate: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-32 left-[10%] w-12 h-12 rounded-full bg-gradient-to-br from-secondary/25 to-primary/15 backdrop-blur-sm border border-white/10 hidden lg:block"
      />
      <motion.div
        animate={{ y: [-8, 12, -8], x: [-5, 5, -5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-1/2 right-[5%] w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-primary/10 backdrop-blur-sm border border-white/10 hidden xl:block"
      />
    </>
  );
}

export function HeroSection() {
  const { t } = useTranslation();
  const brandName = "IMOTION";
  const brandSuffix = "Creator Studio";

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const orbX = useTransform(mouseX, [0, 1], [-20, 20]);
  const orbY = useTransform(mouseY, [0, 1], [-20, 20]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  return (
    <section
      className="relative py-20 md:py-32 lg:py-40 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Premium multi-layer background */}
      <div className="absolute inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/95 to-background" />

        {/* Animated gradient orbs */}
        <motion.div style={{ x: orbX, y: orbY }} className="absolute top-[-20%] left-1/3 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[120px]" />
        <motion.div style={{ x: orbX, y: orbY }} className="absolute bottom-[-10%] right-1/4 w-[500px] h-[500px] bg-secondary/12 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-blue-600/8 rounded-full blur-[80px]" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_40%,transparent_100%)]" />

        {/* Radial spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(255,255,255,0.08),transparent_60%)]" />
      </div>

      <FloatingShapes />

      <div className="container relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text content */}
          <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <Badge variant="secondary" className="mb-8 px-4 py-2 text-sm font-medium bg-white/5 text-white/90 border border-white/15 shadow-lg backdrop-blur-sm hover:bg-white/10 transition-colors">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-secondary" />
                {t("hero.badge")}
              </Badge>
            </motion.div>

            <div className="mb-6">
              <div className="flex items-baseline justify-center lg:justify-start gap-0 flex-wrap">
                {brandName.split("").map((letter, i) => (
                  <motion.span
                    key={`${letter}-${i}`}
                    initial="hidden"
                    animate="visible"
                    variants={letterVariants}
                    custom={i}
                    className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent inline-block"
                    style={{ perspective: "500px" }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </div>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="block text-lg md:text-xl lg:text-2xl font-semibold tracking-[0.25em] uppercase text-white/30 mt-1"
              >
                {brandSuffix}
              </motion.span>
            </div>

            <motion.h1
              initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-6 leading-tight text-white"
            >
              {t("hero.headline")}{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">{t("hero.headlineHighlight")}</span>
            </motion.h1>
            <motion.p
              initial="hidden" animate="visible" variants={fadeUp} custom={3}
              className="text-lg md:text-xl text-white/50 max-w-xl mb-10 leading-relaxed"
            >
              {t("hero.subtitle")} <strong className="text-white/90">{t("hero.subtitleFree")}</strong>.
            </motion.p>
            <motion.div
              initial="hidden" animate="visible" variants={fadeUp} custom={4}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button asChild size="lg" className="gradient-primary border-0 text-base px-8 h-13 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02]">
                <Link to="/register">
                  <Lightbulb className="mr-2 h-5 w-5" />
                  {t("hero.ctaPrimary")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base h-13 hover:-translate-y-0.5 transition-all duration-300 border-white/20 text-white hover:bg-white/10 hover:text-white">
                <a href="#how-it-works">
                  <Play className="mr-2 h-4 w-4" />
                  {t("hero.ctaSecondary")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </motion.div>

            {/* Trust micro-indicators */}
            <motion.div
              initial="hidden" animate="visible" variants={fadeUp} custom={5}
              className="flex items-center gap-6 mt-8 justify-center lg:justify-start text-white/40 text-sm"
            >
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-400/70" /> 100% gratuit</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-400/70" /> Sans engagement</span>
              <span className="flex items-center gap-1.5 hidden sm:flex"><CheckCircle2 className="h-4 w-4 text-green-400/70" /> En 45 min</span>
            </motion.div>
          </div>

          {/* Right side: AI Demo + Hero image */}
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
            className="relative flex items-center justify-center"
          >
            {/* Glow behind */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/15 to-blue-600/10 rounded-3xl blur-3xl scale-110" />

            {/* Main hero image */}
            <div className="relative">
              <img
                src={heroImg}
                alt="IMOTION Creator Studio — Dashboard de gestion de projets digitaux"
                className="relative w-full max-w-md mx-auto rounded-2xl shadow-2xl ring-1 ring-white/10"
                loading="eager"
                width={512}
                height={512}
              />

              {/* AI Demo overlay - positioned bottom-left, overlapping the image */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.2 }}
                className="absolute -bottom-8 -left-8 md:-left-16 z-10"
              >
                <AITypingDemo />
              </motion.div>

              {/* Small floating badge top-right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="absolute -top-4 -right-4 bg-green-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm"
              >
                CDC prêt en 45 min
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
