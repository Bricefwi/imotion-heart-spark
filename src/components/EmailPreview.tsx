import ReactMarkdown from "react-markdown";
import { GRADIENTS } from "@/lib/brand-tokens";
import { Logo } from "@/components/Logo";

interface EmailPreviewProps {
  content: string;
  recipientEmail?: string;
}

/**
 * Aperçu d'email pro respectant la charte (logo + bandeau dégradé flame subtil, Inter).
 * Le markdown source est rendu en HTML stylisé email-safe (largeur max 640px, fond clair).
 */
export function EmailPreview({ content, recipientEmail }: EmailPreviewProps) {
  // Extrait la ligne d'objet "**Objet** : …" puis retire la ligne et le séparateur --- initial
  let subject = "Email IMOTION";
  let body = content;
  const subjectMatch = body.match(/^\*\*Objet\*\*\s*:\s*(.+)$/m);
  if (subjectMatch) {
    subject = subjectMatch[1].trim();
    body = body.replace(subjectMatch[0], "").replace(/^\s*---\s*$/m, "").trim();
  }

  return (
    <div className="bg-muted/30 p-6 rounded-lg">
      {/* En-tête simulé client mail */}
      <div className="max-w-[680px] mx-auto mb-3 px-2 text-xs text-muted-foreground space-y-0.5">
        <div><span className="font-semibold text-foreground">De :</span> IMOTION Cabinet Conseil &lt;noreply@imotion-conseils.fr&gt;</div>
        <div><span className="font-semibold text-foreground">À :</span> {recipientEmail || "client@exemple.fr"}</div>
        <div><span className="font-semibold text-foreground">Objet :</span> {subject}</div>
      </div>

      {/* Carte email */}
      <div
        className="max-w-[680px] mx-auto bg-white rounded-xl overflow-hidden shadow-lg border border-border"
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        {/* Bandeau : logo (fond sombre) + dégradé flame subtil */}
        <div className="flex">
          <div
            className="flex items-center px-6 py-5 shrink-0"
            style={{ background: "#0F0D0B", minWidth: 220 }}
          >
            <Logo variant="flux" showText tone="light" decorative />
          </div>
          <div
            className="flex-1 flex items-center px-6 py-5"
            style={{ background: GRADIENTS.flameSubtle }}
          >
            <div className="text-white">
              <div className="text-[11px] uppercase tracking-[0.18em] opacity-90 font-semibold">
                Cabinet Conseil
              </div>
              <div className="text-lg font-semibold leading-tight">
                Espace projet IMOTION
              </div>
            </div>
          </div>
        </div>

        {/* Corps */}
        <div className="px-8 py-7 text-[15px] leading-relaxed" style={{ color: "#2a2a2a" }}>
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold mt-2 mb-4" style={{ color: "#0F0D0B" }}>{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-bold mt-6 mb-3" style={{ color: "#0F0D0B" }}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-bold mt-5 mb-2" style={{ color: "#D63B1A" }}>{children}</h3>
              ),
              p: ({ children }) => <p className="my-3">{children}</p>,
              strong: ({ children }) => (
                <strong className="font-semibold" style={{ color: "#0F0D0B" }}>{children}</strong>
              ),
              ul: ({ children }) => <ul className="my-3 pl-5 space-y-1.5 list-disc">{children}</ul>,
              ol: ({ children }) => <ol className="my-3 pl-5 space-y-1.5 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="inline-block mt-2 px-5 py-2.5 rounded-md text-white font-semibold no-underline shadow-md hover:opacity-90 transition-opacity"
                  style={{ background: GRADIENTS.flameSubtle }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              blockquote: ({ children }) => (
                <div
                  className="my-5 p-4 rounded-md border-l-4"
                  style={{ background: "#FFF8EC", borderLeftColor: "#F08A00" }}
                >
                  {children}
                </div>
              ),
              hr: () => (
                <div
                  className="my-6 h-px"
                  style={{ background: "linear-gradient(90deg, transparent, #D63B1A, #F08A00, transparent)" }}
                />
              ),
              em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
            }}
          >
            {body}
          </ReactMarkdown>
        </div>

        {/* Footer */}
        <div
          className="px-8 py-5 text-[11px] text-center border-t"
          style={{ background: "#fafafa", color: "#888", borderColor: "#eee" }}
        >
          <div className="mb-1.5">
            <strong style={{ color: "#0F0D0B" }}>IMOTION Cabinet Conseil</strong> · imotion-conseils.fr
          </div>
          <div>
            Vous recevez cet email car vous êtes le contact principal d'un projet en cours.
          </div>
        </div>
      </div>
    </div>
  );
}
