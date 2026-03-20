import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Lightbulb, ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import heroImg from "@/assets/hero-illustration.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const letterVariants = {
  hidden: { opacity: 0, y: 20, rotateX: -90 },
  visible: (i: number) => ({
    opacity: 1, y: 0, rotateX: 0,
    transition: { delay: i * 0.04, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export function HeroSection() {
  const { t } = useTranslation();
  const brandName = "IMOTION";
  const brandSuffix = "Creator Studio";

  return (
    <section className="relative py-24 md:py-36 overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/8 via-primary/3 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_40%,transparent_100%)]" />
      </div>

      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <Badge variant="secondary" className="mb-8 px-4 py-2 text-sm font-medium bg-primary/5 text-primary border border-primary/20 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
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
                    className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight gradient-text inline-block"
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
                className="block text-lg md:text-xl lg:text-2xl font-semibold tracking-[0.25em] uppercase text-muted-foreground/60 mt-1"
              >
                {brandSuffix}
              </motion.span>
            </div>

            <motion.h1
              initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-6 leading-tight"
            >
              {t("hero.headline")}{" "}
              <span className="gradient-text">{t("hero.headlineHighlight")}</span>
            </motion.h1>
            <motion.p
              initial="hidden" animate="visible" variants={fadeUp} custom={3}
              className="text-lg md:text-xl text-muted-foreground/70 max-w-xl mb-10 leading-relaxed"
            >
              {t("hero.subtitle")} <strong className="text-foreground">{t("hero.subtitleFree")}</strong>.
            </motion.p>
            <motion.div
              initial="hidden" animate="visible" variants={fadeUp} custom={4}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button asChild size="lg" className="gradient-primary border-0 text-base px-8 h-13 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:-translate-y-0.5">
                <Link to="/register">
                  <Lightbulb className="mr-2 h-5 w-5" />
                  {t("hero.ctaPrimary")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base h-13 hover:-translate-y-0.5 transition-all duration-300">
                <a href="#how-it-works">{t("hero.ctaSecondary")} <ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative"
          >
            {/* Glow behind image */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent rounded-3xl blur-2xl scale-110" />
            <img
              src={heroImg}
              alt="IMOTION Creator Studio — Dashboard de gestion de projets digitaux"
              className="relative w-full max-w-md lg:max-w-lg mx-auto rounded-2xl shadow-2xl ring-1 ring-border/20"
              loading="eager"
              width={512}
              height={512}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
