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
        <div className="gradient-primary rounded-3xl p-10 md:p-16 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-center lg:text-left">
              <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-4">
                {t("cta.title")}
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl">
                {t("cta.subtitle")}
              </p>
              <Button asChild size="lg" variant="secondary" className="bg-background text-primary hover:bg-background/90 text-base h-12 px-8">
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
