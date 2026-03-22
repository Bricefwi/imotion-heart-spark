import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ctaImg from "@/assets/cta-illustration.png";

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl p-10 md:p-16 lg:p-20 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white"
        >
          {/* Multi-layer gradient orbs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px]" />

          {/* Radial overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.06),transparent)]" />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />

          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-3xl border border-white/10" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/60"
              >
                <Sparkles className="h-4 w-4 text-secondary" />
                100% gratuit — Sans carte bancaire
              </motion.div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 tracking-tight leading-tight">
                {t("cta.title")}
              </h2>
              <p className="text-white/45 text-lg mb-8 max-w-xl leading-relaxed">
                {t("cta.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-white/90 text-base h-14 px-10 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-300 border-0 font-semibold">
                  <Link to="/register">
                    {t("cta.button")} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base h-14 border-white/20 text-white hover:bg-white/10 hover:text-white transition-all">
                  <Link to="/tarifs">
                    Voir les tarifs
                  </Link>
                </Button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 40, rotate: -2 }}
              whileInView={{ opacity: 1, x: 0, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="hidden lg:flex justify-center relative"
            >
              {/* Glow behind CTA illustration */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/15 rounded-3xl blur-2xl scale-110" />
              <img
                src={ctaImg}
                alt="Démarrez votre projet avec IMOTION"
                className="w-80 drop-shadow-2xl relative hover:scale-105 transition-transform duration-500"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
