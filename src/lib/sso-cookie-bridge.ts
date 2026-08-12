/**
 * SSO Cookie Bridge
 * ──────────────────────────────────────────────────────────────────────────
 * Synchronise la session Supabase entre les sous-domaines
 * `app.imotion-conseils.fr` (Clarivi) et `marketing.imotion-conseils.fr`
 * (lovelib) via un cookie partagé sur le domaine parent.
 *
 * Fonctionnement :
 *  1. Au boot : si un cookie de session valide existe sur `.imotion-conseils.fr`
 *     et que le client Supabase n'a pas encore de session locale, on l'injecte
 *     via `setSession()` → l'utilisateur est connecté automatiquement.
 *  2. À chaque changement d'auth (`onAuthStateChange`) : on écrit / efface le
 *     cookie pour propager l'état à l'autre sous-domaine.
 *
 * Sécurité :
 *  - Cookie `Secure; SameSite=Lax` (Lax explicite : permet la navigation entre
 *    sous-domaines tout en bloquant le CSRF cross-site).
 *  - `Max-Age` limité à 24 h (réduit depuis 30 jours — finding H1) pour
 *    borner la fenêtre d'exploitation d'un cookie volé.
 *  - HttpOnly impossible : le SDK Supabase est purement client et doit pouvoir
 *    rafraîchir le token.
 *
 * ⚠️ RISQUE RÉSIDUEL (documenté, non résolu par ce durcissement) :
 *  le cookie contient `access_token` + `refresh_token` en clair, lisible par
 *  tout JavaScript exécuté sur N'IMPORTE QUEL sous-domaine de
 *  `.imotion-conseils.fr`. Une XSS sur un sous-domaine quelconque permet
 *  toujours le vol de session. Compensations actuelles : CSP stricte
 *  (Caddyfile/nginx.conf), RLS strict, flow PKCE, fenêtre de validité
 *  désormais limitée à 24 h. À terme, privilégier un handoff serveur-à-
 *  serveur (issue/consume-bridge-token) ou un cookie HttpOnly posé par un
 *  backend (pattern BFF) plutôt qu'un cookie de session partagé.
 *
 * Activation conditionnelle :
 *  - Actif uniquement sur les hôtes `*.imotion-conseils.fr`.
 *  - Sur `localhost`, `*.lovable.app` ou tout autre hôte : no-op silencieux,
 *    le SDK continue d'utiliser localStorage normalement. Aucun risque de
 *    régression tant que le DNS custom n'est pas branché.
 */

import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const COOKIE_NAME = "imotion-sso";
const PARENT_DOMAIN = ".imotion-conseils.fr";
const SSO_HOST_SUFFIX = ".imotion-conseils.fr";

/**
 * Durée de vie du cookie SSO : 24 h maximum (finding H1 — réduit depuis
 * 30 jours). Borne la fenêtre d'exploitation en cas de vol du cookie.
 */
const SSO_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

/** Le SSO cookie n'est utile que si on est sur un sous-domaine du domaine custom. */
function isSsoEligibleHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  // Accepte exactement le domaine racine ou n'importe quel sous-domaine.
  return host === "imotion-conseils.fr" || host.endsWith(SSO_HOST_SUFFIX);
}

function isSecureContext(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "https:";
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const parts = document.cookie.split(";");
  for (const raw of parts) {
    const c = raw.trim();
    if (c.startsWith(prefix)) {
      return decodeURIComponent(c.substring(prefix.length));
    }
  }
  return null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined") return;
  const secure = isSecureContext() ? "; Secure" : "";
  document.cookie =
    `${name}=${encodeURIComponent(value)}` +
    `; Domain=${PARENT_DOMAIN}` +
    `; Path=/` +
    `; Max-Age=${maxAgeSeconds}` +
    `; SameSite=Lax` +
    secure;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie =
    `${name}=` +
    `; Domain=${PARENT_DOMAIN}` +
    `; Path=/` +
    `; Max-Age=0` +
    `; SameSite=Lax`;
}

interface CookiePayload {
  access_token: string;
  refresh_token: string;
}

function serialize(session: Session): string {
  const payload: CookiePayload = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  };
  return JSON.stringify(payload);
}

function parse(raw: string): CookiePayload | null {
  try {
    const obj = JSON.parse(raw) as Partial<CookiePayload>;
    if (typeof obj.access_token === "string" && typeof obj.refresh_token === "string") {
      return { access_token: obj.access_token, refresh_token: obj.refresh_token };
    }
    return null;
  } catch {
    return null;
  }
}

let initialized = false;

/**
 * Démarre le pont SSO. Idempotent : peut être appelé plusieurs fois sans effet.
 * À appeler une seule fois au boot de l'app (depuis main.tsx).
 */
export async function initSsoCookieBridge(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (!isSsoEligibleHost()) {
    // Hors prod (lovable.app, localhost, etc.) : on ne fait rien.
    return;
  }

  // 1. Hydratation initiale : si on a un cookie mais pas de session locale,
  //    on injecte la session dans le SDK.
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const raw = readCookie(COOKIE_NAME);
      if (raw) {
        const payload = parse(raw);
        if (payload) {
          const { error } = await supabase.auth.setSession(payload);
          if (error) {
            console.warn("[SSO] setSession from cookie failed:", error.message);
            deleteCookie(COOKIE_NAME);
          } else if (import.meta.env.DEV) {
            console.info("[SSO] Session restaurée depuis le cookie partagé");
          }
        }
      }
    } else {
      // Session locale présente : on s'assure que le cookie est à jour.
      writeCookie(COOKIE_NAME, serialize(data.session), SSO_COOKIE_MAX_AGE_SECONDS);
    }
  } catch (err) {
    console.warn("[SSO] Hydration error:", err);
  }

  // 2. Synchronisation continue.
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      deleteCookie(COOKIE_NAME);
      return;
    }
    if (session) {
      // Couvre SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION.
      writeCookie(COOKIE_NAME, serialize(session), SSO_COOKIE_MAX_AGE_SECONDS);
    }
  });
}
