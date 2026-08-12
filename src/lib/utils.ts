import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Rôles applicatifs, du moins privilégié au plus privilégié. */
export type AppRole = "client" | "consultant" | "admin" | "super_admin";

/**
 * Formate un montant en euros (fr-FR).
 * Remplace les `toLocaleString("fr-FR") + " EUR"` dispersés dans l'app.
 */
export function formatCurrencyEUR(
  amount: number | null | undefined,
  { decimals = 0 }: { decimals?: number } = {},
): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Page d'accueil d'un utilisateur selon ses rôles (hiérarchie :
 * admin/super_admin > consultant > client). Source unique partagée par
 * Login, Register et ProtectedRoute — ne pas dupliquer cette logique.
 */
export function getRoleHome(roles: readonly string[], fallback = "/client/dashboard"): string {
  if (roles.includes("admin") || roles.includes("super_admin")) return "/admin/dashboard";
  if (roles.includes("consultant")) return "/consultant/dashboard";
  return fallback;
}

/**
 * Extrait un message d'erreur lisible depuis un `unknown` de catch.
 * Remplace les `err instanceof Error ? err.message : "…"` répétés.
 */
export function getErrorMessage(err: unknown, fallback = "Une erreur est survenue"): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}
