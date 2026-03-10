import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Lightbulb, ArrowRight, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero-illustration.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-32">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[120px]" />
      </div>

      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Propulsé par l'IA
              </Badge>
            </motion.div>
            <motion.h1
              initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6"
            >
              Transformez vos idées en{" "}
              <span className="gradient-text">projets digitaux concrets</span>
            </motion.h1>
            <motion.p
              initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10"
            >
              Notre IA vous guide pour définir précisément votre besoin et génère automatiquement votre cahier des charges.
            </motion.p>
            <motion.div
              initial="hidden" animate="visible" variants={fadeUp} custom={3}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button asChild size="lg" className="gradient-primary border-0 text-base px-8 h-12 shadow-lg hover:shadow-xl transition-all">
                <Link to="/register">
                  <Lightbulb className="mr-2 h-5 w-5" />
                  Commencer gratuitement
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base h-12">
                <a href="#how-it-works">Voir comment ça marche <ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
            </motion.div>
          </div>

          {/* Right — Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          >
            <img
              src={heroImg}
              alt="IMOTION Creator Studio — Dashboard de gestion de projets digitaux"
              className="w-full max-w-md lg:max-w-lg mx-auto drop-shadow-2xl rounded-2xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
