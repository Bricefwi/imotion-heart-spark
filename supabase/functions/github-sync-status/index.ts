import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type GithubAuthor = {
  login: string;
  avatar_url: string;
} | null;

type GithubCommitPayload = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string } | null;
  };
  author: GithubAuthor;
};

type RequestBody = {
  repo?: string;
  branch?: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizeRepo = (input: string): string | null => {
  const cleaned = input
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/^git@github\.com:/i, "")
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "");

  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return `${parts[0]}/${parts[1]}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return json({ error: "backend_not_configured" }, 500);

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "missing_authorization" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "invalid_session" }, 401);

  const [{ data: isAdmin }, { data: isSuperAdmin }] = await Promise.all([
    userClient.rpc("has_role", { _user_id: userData.user.id, _role: "admin" }),
    userClient.rpc("has_role", { _user_id: userData.user.id, _role: "super_admin" }),
  ]);
  if (!isAdmin && !isSuperAdmin) return json({ error: "forbidden" }, 403);

  let body: RequestBody = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const repo = normalizeRepo(body.repo ?? "");
  const branch = (body.branch ?? "main").trim() || "main";
  if (!repo) return json({ error: "invalid_repo" }, 400);

  const token = Deno.env.get("GITHUB_TOKEN");
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "clarivi-github-sync-status",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const githubUrl = `https://api.github.com/repos/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=10`;

  try {
    const res = await fetch(githubUrl, { headers });
    const rateLimit = {
      limit: res.headers.get("x-ratelimit-limit"),
      remaining: res.headers.get("x-ratelimit-remaining"),
      reset: res.headers.get("x-ratelimit-reset"),
    };

    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: "GitHub ne répond pas correctement." }));
      const message = typeof payload.message === "string" ? payload.message : "GitHub ne répond pas correctement.";
      return json({ error: "github_error", status: res.status, message, repo, branch, rateLimit, tokenConfigured: Boolean(token) }, 200);
    }

    const commits = (await res.json()) as GithubCommitPayload[];
    return json({ ok: true, repo, branch, commits, checkedAt: new Date().toISOString(), rateLimit, tokenConfigured: Boolean(token) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur réseau inconnue.";
    return json({ error: "network_error", message, repo, branch, tokenConfigured: Boolean(token) }, 200);
  }
});