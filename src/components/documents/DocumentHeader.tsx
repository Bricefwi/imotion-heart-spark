import { GRADIENTS } from "@/lib/brand-tokens";
import { Logo } from "@/components/Logo";

interface DocumentHeaderProps {
  documentName: string;
  projectCode?: string;
  date: string;
}

/**
 * Header standard partagé par tous les documents commerciaux (CDC, devis, BC, facture).
 * Bande sombre (logo lisible) + dégradé flame (titre doc) pour respecter l'identité du site.
 */
export function DocumentHeader({ documentName, projectCode, date }: DocumentHeaderProps) {
  return (
    <div className="flex items-stretch">
      <div
        className="flex items-center px-6 py-5 shrink-0"
        style={{ background: "#0F0D0B" }}
      >
        <Logo variant="flux" size="md" showText tone="light" decorative />
      </div>
      <div
        className="flex-1 px-6 py-5 flex items-center justify-end"
        style={{ background: "linear-gradient(100deg, #E85A2A 0%, #ED7A1F 55%, #F08A00 100%)" }}
      >
        <div className="text-right text-white">
          <p className="font-semibold text-base leading-tight">{documentName}</p>
          {projectCode && <p className="text-white/90 text-xs mt-0.5">Ref. {projectCode}</p>}
          <p className="text-white/85 text-xs">{date}</p>
        </div>
      </div>
    </div>
  );
}
