import logoImotion from "@/assets/logo-imotion.png";
import { GRADIENTS } from "@/lib/brand-tokens";

interface DocumentHeaderProps {
  documentName: string;
  projectCode?: string;
  date: string;
}

/** Header standard partagé par tous les documents commerciaux (CDC, devis, BC, facture). */
export function DocumentHeader({ documentName, projectCode, date }: DocumentHeaderProps) {
  return (
    <div
      className="px-8 py-5 flex items-center justify-between"
      style={{ background: GRADIENTS.flame }}
    >
      <div className="flex items-center gap-4">
        <img src={logoImotion} alt="i-MOTION Conseil" className="h-10 w-auto" crossOrigin="anonymous" />
        <span className="text-white/85 text-[11px] font-medium tracking-wide uppercase">
          Cabinet IA &amp; NoCode
        </span>
      </div>
      <div className="text-right text-white/90 text-xs">
        <p className="font-semibold text-white text-sm">{documentName}</p>
        {projectCode && <p>Ref. {projectCode}</p>}
        <p>{date}</p>
      </div>
    </div>
  );
}
