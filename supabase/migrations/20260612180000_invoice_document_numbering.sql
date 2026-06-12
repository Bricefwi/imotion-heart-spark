-- Migration: add 'invoice' doctype to the sequential document numbering trigger.
-- The existing trigger only handled 'facture'; 'invoice' (English key used in the
-- Edge Function) now also gets the FAC-YYYY-NNNN prefix.

CREATE OR REPLACE FUNCTION public.generate_document_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  year_str TEXT;
  seq_num INTEGER;
BEGIN
  prefix := CASE NEW.document_type
    WHEN 'cdc'            THEN 'CDC'
    WHEN 'devis'          THEN 'DEV'
    WHEN 'contrat'        THEN 'CTR'
    WHEN 'contract_fr'    THEN 'CTR'
    WHEN 'facture'        THEN 'FAC'
    WHEN 'invoice'        THEN 'FAC'
    WHEN 'pv_reception'   THEN 'PVR'
    ELSE 'DOC'
  END;

  year_str := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(document_number FROM 10 FOR 4) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM generated_documents
  WHERE document_number LIKE prefix || '-' || year_str || '-%';

  NEW.document_number := prefix || '-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;
