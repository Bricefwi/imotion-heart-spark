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
        description="i-MOTION Conseil est un cabinet de conseil IA & NoCode augmenté par des agents IA. Audit, cadrage et accompagnement de projets digitaux pour PME et entrepreneurs."
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
              i-MOTION Conseil
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cabinet de conseil IA &amp; NoCode. Nous cadrons, concevons et accompagnons vos projets digitaux, avec l'appui d'agents IA spécialisés en arrière-plan et la supervision systématique d'un consultant humain.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden mb-16">
            <img src={teamImg} alt="L'équipe i-MOTION Conseil en réunion de travail" className="w-full h-64 md:h-80 object-cover" loading="lazy" />
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground text-lg leading-relaxed">
              i-MOTION Conseil aide entrepreneurs et PME à clarifier, cadrer et concrétiser leurs projets numériques. Notre conviction : la majorité des projets digitaux échouent par manque de cadrage initial, pas par manque d'outils.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Notre approche associe l'expertise de nos consultants à un cabinet d'agents IA spécialisés (intake, analyse du besoin, scoping, contrôle qualité). Les agents préparent et structurent la matière ; le consultant valide, arbitre et engage le cabinet.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Nous ne promettons ni automatisation totale, ni résultats garantis. Nous nous engageons sur une méthode lisible : un audit gratuit, un cahier des charges clair, une proposition personnalisée et un suivi de mission transparent.
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
