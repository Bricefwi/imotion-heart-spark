import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between py-4">
          <Logo size="md" showText />
          <Badge variant="outline" className="font-mono text-xs">brand-preview · v2 · logo officiel</Badge>
        </div>
      </header>

      <main className="container mx-auto py-12 space-y-16">
        {/* Intro */}
        <section className="max-w-2xl">
          <Badge className="bg-gradient-flame border-0 text-white mb-4">Logo officiel</Badge>
          <h1 className="font-display text-5xl font-semibold tracking-tight mb-4">
            <span className="bg-gradient-text bg-clip-text text-transparent">imotion</span> — wordmark Flux
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Wordmark <span className="font-semibold">imotion</span> où le « i » est remplacé par une flèche verticale
            gradient orange→rouge. Inspiré Stripe / Resend / Ramp. Typographique, durable, signature.
          </p>
        </section>

        {/* Logo showcase — light / dark / mono */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Light bg */}
          <Card className="p-8 bg-gradient-paper">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-6">Sur fond clair</div>
            <div className="flex flex-col gap-8 items-start">
              <Logo size="xl" />
              <Logo size="lg" showText />
              <Logo size="md" showText />
            </div>
          </Card>

          {/* Dark bg */}
          <Card className="p-8 bg-gradient-dusk border-0">
            <div className="text-xs uppercase tracking-widest text-white/50 mb-6">Sur fond sombre</div>
            <div className="flex flex-col gap-8 items-start">
              <Logo size="xl" tone="light" />
              <Logo size="lg" tone="light" showText />
              <Logo size="md" tone="light" showText />
            </div>
          </Card>

          {/* Mono */}
          <Card className="p-8 bg-muted">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-6">Mono — application stricte</div>
            <div className="flex flex-col gap-8 items-start text-foreground">
              <Logo size="lg" tone="mono" />
              <Logo size="md" tone="mono" showText />
            </div>
          </Card>

          {/* Inverted mono on coral */}
          <Card className="p-8 border-0" style={{ background: "hsl(11 79% 47%)" }}>
            <div className="text-xs uppercase tracking-widest text-white/70 mb-6">Mono blanc sur coral</div>
            <div className="flex flex-col gap-8 items-start text-white">
              <Logo size="lg" tone="mono" />
              <Logo size="md" tone="mono" showText />
            </div>
          </Card>
        </section>

        {/* Sizes scale */}
        <section>
          <h2 className="font-display text-3xl font-semibold mb-6">Échelle des tailles</h2>
          <Card className="p-8">
            <div className="flex flex-wrap items-end gap-10">
              {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
                <div key={s} className="flex flex-col items-start gap-2">
                  <Logo size={s} />
                  <span className="text-xs font-mono text-muted-foreground">size="{s}"</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

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
        Brand v2 · Logo Flux officiel — IMOTION Creator Studio
      </footer>
    </div>
  );
}
