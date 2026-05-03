import { motion } from "framer-motion";
import { CheckCircle2, Mail } from "lucide-react";

export default function AuditDone() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="size-8 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Audit terminé !</h1>
          <p className="text-muted-foreground text-sm">
            Votre cahier des charges et votre devis estimatif ont été générés et envoyés à votre conseiller.
          </p>
        </div>
        <div className="rounded-xl bg-muted px-6 py-5 space-y-2 text-sm text-left">
          <div className="flex items-center gap-2 font-medium">
            <Mail className="size-4 text-primary" />
            Prochaine étape
          </div>
          <p className="text-muted-foreground">
            Votre conseiller va étudier votre dossier et vous recontactera dans les <strong>24 heures ouvrées</strong> pour convenir d'un rendez-vous de cadrage.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Merci pour votre confiance. Vos données sont protégées et confidentielles.
        </p>
      </motion.div>
    </div>
  );
}
