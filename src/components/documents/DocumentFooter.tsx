import { BRAND } from "@/lib/brand-tokens";

interface DocumentFooterProps {
  page?: number;
  totalPages?: number;
  version?: number;
}

/** Footer standard partagé par tous les documents commerciaux. */
export function DocumentFooter({ page, totalPages, version }: DocumentFooterProps) {
  return (
    <div className="px-8 py-3 border-t border-imo-ink-200 flex items-center justify-between text-[10px] text-imo-ink-400">
      <span>{BRAND.productName} | Document confidentiel | {BRAND.url.replace("https://", "")}</span>
      {page && totalPages && <span>Page {page} / {totalPages}</span>}
      {version && <span>v{version}</span>}
    </div>
  );
}
