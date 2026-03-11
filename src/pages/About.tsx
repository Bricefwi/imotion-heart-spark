import { Badge } from "@/components/ui/badge";
import { StatsSection } from "@/components/landing/StatsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { SEOHead, organizationSchema, breadcrumbSchema } from "@/components/SEOHead";
import teamImg from "@/assets/team-collaboration.jpg";

export default function About() {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="À propos — Notre mission et notre équipe"
        description="IMOTION Creator Studio transforme vos idées en projets digitaux concrets grâce à l'IA et l'expertise humaine. +150 entreprises accompagnées."
        canonical="/a-propos"
        jsonLd={[
          organizationSchema,
          breadcrumbSchema([
            { name: "Accueil", url: "/" },
            { name: "À propos", url: "/a-propos" },
          ]),
        ]}
      />
      <section className="py-20 md:py-28">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">À propos</Badge>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-6">
              IMOTION Creator Studio
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nous transformons vos idées en projets digitaux concrets grâce à l'intelligence artificielle et l'expertise humaine.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden mb-16">
            <img src={teamImg} alt="L'équipe IMOTION Creator Studio en réunion de travail" className="w-full h-64 md:h-80 object-cover" loading="lazy" />
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground text-lg leading-relaxed">
              IMOTION Creator Studio est né d'un constat simple : trop de projets digitaux échouent par manque de cadrage initial. Notre plateforme combine l'IA conversationnelle et l'expertise de consultants pour vous aider à définir précisément votre besoin.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              En 45 minutes de conversation guidée, notre système analyse vos besoins, identifie les enjeux et génère automatiquement un cahier des charges professionnel, prêt à être partagé avec vos équipes techniques.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Plus de 150 entreprises nous font déjà confiance pour transformer leur vision en réalité digitale.
            </p>
          </div>
        </div>
      </section>

      <StatsSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}
