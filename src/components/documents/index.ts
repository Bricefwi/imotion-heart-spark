/**
 * Hub des composants documents commerciaux (CDC, devis, BC, factures, contrats).
 *
 * Tous les rendus PDF/UI documents DOIVENT importer depuis ce dossier
 * pour partager exactement les mêmes tokens (src/lib/brand-tokens.ts) que les
 * emails (supabase/functions/_shared/brand-tokens.ts).
 *
 * Composants disponibles :
 *  - ProfessionalDocument : layout principal markdown → PDF (CDC, propositions)
 *
 * À venir (squelettes prêts pour devis/BC/facture) :
 *  - QuoteDocument, PurchaseOrderDocument, InvoiceDocument
 *    → réutiliseront DocumentHeader/DocumentFooter ci-dessous.
 */
export { ProfessionalDocument } from "../ProfessionalDocument";
export { DocumentHeader } from "./DocumentHeader";
export { DocumentFooter } from "./DocumentFooter";
