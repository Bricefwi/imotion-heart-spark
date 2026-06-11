import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EmailPreview } from "@/components/EmailPreview";
import { renderTemplate } from "@/lib/automation-variables";

interface AutomationEmailPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruleName?: string;
  subject: string;
  body: string;
  recipientEmail?: string;
}

/**
 * Modale d'aperçu d'email d'automatisation, utilisant le même rendu
 * que l'onglet Templates (bandeau dégradé flame + logo + Inter).
 * Les variables `{{nom}}…` sont remplacées par leurs valeurs d'exemple.
 */
export function AutomationEmailPreviewModal({
  open,
  onOpenChange,
  ruleName,
  subject,
  body,
  recipientEmail,
}: AutomationEmailPreviewModalProps) {
  const renderedSubject = renderTemplate(subject || "Email IMOTION");
  const renderedBody = renderTemplate(body || "");

  // EmailPreview attend un markdown commençant par "**Objet** : …"
  const content = `**Objet** : ${renderedSubject}\n\n---\n\n${renderedBody}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            Aperçu : {ruleName || "Email automatisé"}
          </DialogTitle>
          <DialogDescription>
            Rendu identique à ce que recevra le client. Les variables affichent ici des valeurs d'exemple.
          </DialogDescription>
        </DialogHeader>
        <EmailPreview content={content} recipientEmail={recipientEmail} />
      </DialogContent>
    </Dialog>
  );
}
