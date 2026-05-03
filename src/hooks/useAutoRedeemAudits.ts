import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const SESSION_FLAG = "lovelibAutoRedeemDone";

interface RedeemAudit {
  audit_id: string;
  external_id: string | null;
  company_name: string | null;
  website_url: string | null;
  score: number | null;
  summary: string | null;
}

interface RedeemResult {
  claimed: number;
  audits: RedeemAudit[];
}

/**
 * Auto-réconciliation des audits lovelib en attente.
 * Exécuté une fois par session dès qu'un utilisateur authentifié est détecté
 * dans l'espace client. Idempotent côté DB (RPC redeem_pending_audits).
 */
export function useAutoRedeemAudits() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const ranRef = useRef(false);

  useEffect(() => {
    if (loading || !user || ranRef.current) return;
    if (sessionStorage.getItem(SESSION_FLAG) === user.id) return;
    ranRef.current = true;

    (async () => {
      try {
        const { data, error } = await supabase.rpc("redeem_pending_audits");
        if (error) {
          console.warn("[autoRedeem] RPC error:", error.message);
          return;
        }
        sessionStorage.setItem(SESSION_FLAG, user.id);

        const result = (data ?? { claimed: 0, audits: [] }) as unknown as RedeemResult;
        if (result.claimed > 0) {
          // Cleanup any stale claim hint stored before login
          sessionStorage.removeItem("pendingAuditClaimEmail");

          // Refresh any audit-related caches so the UI reflects the new audits
          queryClient.invalidateQueries({ queryKey: ["marketing-audits"] });
          queryClient.invalidateQueries({ queryKey: ["my-audits"] });
          queryClient.invalidateQueries({ queryKey: ["client-activities"] });

          const label =
            result.claimed === 1
              ? "1 audit lovelib récupéré"
              : `${result.claimed} audits lovelib récupérés`;

          toast.success(label, {
            description: "Vos audits marketing sont disponibles dans votre espace.",
            action: {
              label: "Voir mes audits",
              onClick: () => navigate("/client/audits"),
            },
            duration: 8000,
          });
        }
      } catch (err) {
        console.warn("[autoRedeem] unexpected error:", err);
      }
    })();
  }, [user, loading, queryClient, navigate]);
}
