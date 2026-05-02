/**
 * Helper pour écrire un audit marketing directement dans un projet Clarivi.
 *
 * ⚠️ À copier dans le projet lovelib (marketing.imotion-conseils.fr).
 *    Ne sert pas dans ce projet (Clarivi) — c'est juste la référence canonique.
 *
 * Pré-requis (côté lovelib) :
 *   - Le SDK supabase pointe sur le MÊME projet Supabase que Clarivi
 *     (URL + anon key identiques — backend partagé, cf. mémoire Fusion).
 *   - L'utilisateur est authentifié (auth.uid() doit être défini).
 *   - L'utilisateur doit être client_id ou consultant_id du projet ciblé,
 *     sinon la RPC renvoie 42501 (access denied).
 *
 * Avantages vs webhook HMAC :
 *   - Pas de secret à gérer (RLS Supabase suffit)
 *   - Pas de service-role exposé
 *   - Cohérent avec le reste de l'auth utilisateur
 *
 * Le webhook /functions/v1/marketing-webhook reste utilisable pour les
 * appels server-to-server (cron lovelib, jobs anonymes pré-signup).
 */

import { supabase } from "@/integrations/supabase/client";

export interface MarketingAuditPayload {
  /** ID externe lovelib (idempotence : 1 audit / user / external_id). */
  external_id?: string;
  company_name?: string;
  website_url?: string;
  /** Score 0-100. */
  score?: number;
  summary?: string;
  recommendations?: unknown[];
  /** Discovery_data complet (sera stocké dans marketing_audits.full_payload). */
  full_payload?: Record<string, unknown>;
}

export interface MergeResult {
  ok: true;
  audit_id: string;
  project_id: string;
}

export async function mergeMarketingIntoProject(
  projectId: string,
  payload: MarketingAuditPayload,
): Promise<MergeResult> {
  const { data, error } = await supabase.rpc("merge_marketing_into_project", {
    _project_id: projectId,
    _audit_payload: payload as never,
  });

  if (error) {
    // 42501 = access denied (pas owner du projet)
    // 28000 = pas authentifié
    throw new Error(
      `Failed to merge marketing audit: ${error.message} (${error.code ?? "?"})`,
    );
  }

  return data as MergeResult;
}

/**
 * Exemple d'utilisation à la fin du workflow d'audit lovelib :
 *
 * ```ts
 * await mergeMarketingIntoProject(selectedProjectId, {
 *   external_id: auditRunId,
 *   company_name: form.companyName,
 *   website_url: form.websiteUrl,
 *   score: result.score,
 *   summary: result.summary,
 *   recommendations: result.recommendations,
 *   full_payload: result.discoveryData,
 * });
 * ```
 */
