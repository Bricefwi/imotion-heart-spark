import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

type Variant = "chevrons" | "spark" | "flame";

const PALETTE = [
  { name: "Coral 600 — Primary", hsl: "11 79% 47%", hex: "#D63B1A" },
  { name: "Coral 500", hsl: "12 89% 56%", hex: "#F24E2A" },
  { name: "Amber 500 — Secondary", hsl: "34 100% 47%", hex: "#F08A00" },
  { name: "Amber 300", hsl: "38 100% 65%", hex: "#FFC04D" },
  { name: "Ink 900 — Foreground", hsl: "30 17% 5%", hex: "#0F0D0B" },
  { name: "Ink 500 — Muted text", hsl: "25 6% 35%", hex: "#5E5953" },
  { name: "Ink 200 — Border", hsl: "28 13% 88%", hex: "#E5E1DC" },
  { name: "Ink 50 — Background", hsl: "24 14% 98%", hex: "#FAF8F7" },
];

export default function BrandPreview() {
  const [chosen, setChosen] = useState<Variant | null>(null);

  const variants: { key: Variant; title: string; subtitle: string }[] = [
    {
      key: "chevrons",
      title: "Direction A — Chevrons",
      subtitle: "Vectorisation propre du logo actuel : 3 chevrons noir / coral / ambre. Lecture immédiate de la marque, continuité forte.",
    },
    {
      key: "spark",
      title: "Direction B — Spark",
      subtitle: "Mark cube arrondi avec un « I » et un point d'accent. Plus app-icon, parfait pour favicon, sidebar collapsed, app stores.",
    },
    {
      key: "flame",
      title: "Direction C — Flame",
      subtitle: "Silhouette de flamme organique en gradient flame. Évoque l'énergie, l'IA générative, le « heart-spark ». Plus signature, moins corporate.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between py-4">
          <Logo size="md" showText variant="chevrons" />
          <Badge variant="outline" className="font-mono text-xs">brand-preview · phase 1</Badge>
        </div>
      </header>

      <main className="container mx-auto py-12 space-y-16">
        {/* Intro */}
        <section className="max-w-2xl">
          <Badge className="bg-gradient-flame border-0 text-white mb-4">Refonte v2</Badge>
          <h1 className="font-display text-5xl font-semibold tracking-tight mb-4">
            Choisis la direction du <span className="bg-gradient-text bg-clip-text text-transparent">logo IMOTION</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Les 3 propositions ci-dessous utilisent le nouveau système de couleurs (coral / amber / ink) et la
            typographie display <span className="font-display font-semibold">General Sans</span>. Une fois ta direction
            validée, elle sera propagée à toute l'app + le footer + le favicon.
          </p>
        </section>

        {/* Logo variants */}
        <section className="grid gap-6 md:grid-cols-3">
          {variants.map((v) => (
            <Card
              key={v.key}
              className={`relative p-6 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${
                chosen === v.key ? "ring-2 ring-primary shadow-glow" : ""
              }`}
              onClick={() => setChosen(v.key)}
            >
              {chosen === v.key && (
                <div className="absolute top-4 right-4 size-7 rounded-full bg-gradient-flame flex items-center justify-center text-white">
                  <Check className="size-4" />
                </div>
              )}

              <div className="bg-gradient-paper rounded-xl p-8 mb-4 flex items-center justify-center min-h-[160px]">
                <Logo size="xl" variant={v.key} />
              </div>

              {/* Dark sample */}
              <div className="bg-gradient-dusk rounded-xl p-8 mb-4 flex items-center justify-center min-h-[120px]">
                <Logo size="lg" variant={v.key} showText tone="light" />
              </div>

              {/* Mono sample */}
              <div className="bg-muted rounded-xl p-6 mb-4 flex items-center justify-center min-h-[80px] text-foreground/80">
                <Logo size="md" variant={v.key} tone="mono" />
              </div>

              <h3 className="font-display font-semibold text-lg mb-1">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.subtitle}</p>
            </Card>
          ))}
        </section>

        {/* Selection summary */}
        {chosen && (
          <section className="rounded-2xl border border-primary/20 bg-gradient-glow p-8 text-center">
            <Badge className="bg-gradient-flame border-0 text-white mb-3">Sélection</Badge>
            <p className="text-lg">
              Tu as choisi la <span className="font-semibold">direction {chosen.toUpperCase()}</span>. Dis-moi
              "valide cette direction" et je l'applique à tous les layouts (header public, sidebar, footer, login, favicon).
            </p>
          </section>
        )}

        {/* Color palette */}
        <section>
          <h2 className="font-display text-3xl font-semibold mb-6">Palette v2</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {PALETTE.map((c) => (
              <div key={c.hex} className="rounded-xl overflow-hidden border border-border bg-card">
                <div className="h-24" style={{ background: `hsl(${c.hsl})` }} />
                <div className="p-3">
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{c.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gradients */}
        <section>
          <h2 className="font-display text-3xl font-semibold mb-6">Gradients signature</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: "Flame", cls: "bg-gradient-flame" },
              { name: "Ember", cls: "bg-gradient-ember" },
              { name: "Dusk", cls: "bg-gradient-dusk" },
              { name: "Dawn", cls: "bg-gradient-dawn" },
            ].map((g) => (
              <div key={g.name} className={`${g.cls} h-32 rounded-2xl flex items-end p-4`}>
                <span className="font-display text-white font-semibold text-xl drop-shadow">{g.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="font-display text-3xl font-semibold mb-6">Typographie</h2>
          <Card className="p-8 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Display — General Sans</div>
              <p className="font-display text-5xl font-semibold tracking-tight">
                Transformez votre vision en réalité digitale.
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Body — Inter</div>
              <p className="text-base leading-relaxed max-w-2xl">
                Notre IA vous guide pour définir précisément votre besoin et génère automatiquement votre cahier des
                charges — 100% gratuit, en 45 minutes, sans engagement.
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Mono — JetBrains Mono</div>
              <p className="font-mono text-sm bg-muted rounded p-3">
                <span className="text-primary">$</span> imotion generate --type cdc --phase 7
              </p>
            </div>
          </Card>
        </section>

        {/* Buttons preview */}
        <section>
          <h2 className="font-display text-3xl font-semibold mb-6">Boutons</h2>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-gradient-flame border-0 shadow-glow hover:shadow-glow-lg transition-shadow">
              CTA Primary (gradient flame)
            </Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 mt-16 py-8 text-center text-sm text-muted-foreground">
        Phase 1 · Fondations · Brand v2 — IMOTION Creator Studio
      </footer>
    </div>
  );
}
