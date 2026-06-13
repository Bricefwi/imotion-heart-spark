-- Migration: e-invoicing compliance fields + document status audit log
-- Prepares for the mandatory French e-invoicing requirement (September 2026)
-- and adds server-side status transition validation + full audit trail.

-- ─── 1. E-invoicing compliance fields on documents ────────────────────────────

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS payment_due_date     DATE,
  ADD COLUMN IF NOT EXISTS invoice_number       TEXT,
  ADD COLUMN IF NOT EXISTS e_invoice_data       JSONB;

COMMENT ON COLUMN public.documents.payment_due_date IS 'Net payment due date (mandatory for e-invoicing under art. L441-9)';
COMMENT ON COLUMN public.documents.invoice_number   IS 'Sequential invoice number (FAC-YYYY-NNNN), mirrors generated_documents.document_number';
COMMENT ON COLUMN public.documents.e_invoice_data   IS 'Full e-invoice payload (PDP-compliant JSON: seller, buyer, lines, totals, compliance)';

-- ─── 2. Document status history / audit log ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.document_status_history (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID        NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  old_status    TEXT,
  new_status    TEXT        NOT NULL,
  changed_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  note          TEXT
);

CREATE INDEX IF NOT EXISTS idx_doc_status_history_document_id
  ON public.document_status_history (document_id);

CREATE INDEX IF NOT EXISTS idx_doc_status_history_changed_at
  ON public.document_status_history (changed_at DESC);

-- RLS: admins and consultants can read, system writes via trigger
ALTER TABLE public.document_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read status history"
  ON public.document_status_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Consultants can read status history"
  ON public.document_status_history FOR SELECT
  USING (has_role(auth.uid(), 'consultant'::app_role));

-- ─── 3. Status transition validation + logging trigger ────────────────────────
-- Valid transitions (invoice-first model: Brouillon → Générée → Validée → Archivée):
--   draft     → review | sent | archived
--   review    → approved | rejected | draft
--   approved  → sent | archived | rejected
--   sent      → signed | archived | rejected
--   signed    → archived
--   rejected  → draft
-- Any state → archived is always allowed.
-- Terminal states: archived, signed (cannot regress).

CREATE OR REPLACE FUNCTION public.validate_and_log_document_status()
RETURNS TRIGGER AS $$
DECLARE
  allowed_transitions JSONB := '{
    "draft":    ["review","sent","approved","archived"],
    "review":   ["approved","rejected","draft"],
    "approved": ["sent","archived","rejected"],
    "sent":     ["signed","archived","rejected"],
    "signed":   ["archived"],
    "rejected": ["draft","archived"]
  }'::JSONB;
  allowed_next TEXT[];
BEGIN
  -- No change — skip
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- archived is a terminal state — block any exit
  IF OLD.status = 'archived' AND NEW.status <> 'archived' THEN
    RAISE EXCEPTION 'Document status transition blocked: archived is a terminal state (document_id: %)', OLD.id;
  END IF;

  -- Look up allowed next states for the current status
  SELECT ARRAY(SELECT jsonb_array_elements_text(allowed_transitions -> OLD.status))
    INTO allowed_next;

  IF allowed_next IS NOT NULL AND NEW.status <> ALL(allowed_next) THEN
    RAISE EXCEPTION 'Document status transition blocked: % → % is not a valid transition (document_id: %)',
      OLD.status, NEW.status, OLD.id;
  END IF;

  -- Log the transition
  INSERT INTO public.document_status_history (document_id, old_status, new_status, changed_by)
  VALUES (OLD.id, OLD.status, NEW.status, auth.uid());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

DROP TRIGGER IF EXISTS trg_document_status_audit ON public.documents;

CREATE TRIGGER trg_document_status_audit
  BEFORE UPDATE OF status ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_and_log_document_status();

-- ─── 4. Backfill payment_due_date for existing invoices (net 30 days) ─────────

UPDATE public.documents
SET payment_due_date = (created_at + INTERVAL '30 days')::DATE
WHERE type = 'invoice'
  AND payment_due_date IS NULL
  AND created_at IS NOT NULL;
