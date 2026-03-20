import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import ctaImg from "@/assets/cta-illustration.png";

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="relative rounded-3xl p-10 md:p-16 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          {/* Gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.06),transparent)]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
                {t("cta.title")}
              </h2>
              <p className="text-white/50 text-lg mb-8 max-w-xl leading-relaxed">
                {t("cta.subtitle")}
              </p>
              <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-white/90 text-base h-13 px-8 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 border-0">
                <Link to="/register">
                  {t("cta.button")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="hidden lg:flex justify-center">
              <img
                src={ctaImg}
                alt="Démarrez votre projet avec IMOTION"
                className="w-72 drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
