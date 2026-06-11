import { useMemo } from "react";
import type { Profile, Project } from "@/types/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building2, Mail, Phone, Globe, Target, Star, Euro, FolderKanban,
  Filter, Download, MoreHorizontal, X, Send, Tag, UserPlus, Flame, Sparkles,
} from "lucide-react";

export function computeClientScore(profile: Profile, clientProjects: Project[]): number {
  let score = 0;
  if (profile?.company_name) score += 10;
  if (profile?.phone) score += 5;
  if (profile?.website) score += 5;
  if (profile?.industry) score += 5;
  if (profile?.onboarding_completed) score += 15;
  score += Math.min(clientProjects.length * 10, 30);
  const signed = clientProjects.filter((p) => ["signed", "completed", "delivered"].includes(p.status));
  score += signed.length * 10;
  const totalMsgs = clientProjects.reduce(
    (s, p: Project & { total_messages?: number }) => s + (p.total_messages || 0),
    0,
  );
  score += Math.min(totalMsgs, 20);
  return Math.min(score, 100);
}

function segmentOf(score: number, daysInactive: number | null): "hot" | "warm" | "cold" | "dormant" {
  if (daysInactive !== null && daysInactive > 60) return "dormant";
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

const SEGMENT_META: Record<string, { label: string; cls: string; icon: typeof Flame }> = {
  hot:     { label: "Chaud",   cls: "bg-[hsl(var(--imo-coral-600)/0.12)] text-[hsl(var(--imo-coral-600))] border-[hsl(var(--imo-coral-600)/0.3)]", icon: Flame },
  warm:    { label: "Tiède",   cls: "bg-[hsl(var(--imo-amber-500)/0.12)] text-[hsl(var(--imo-amber-700))] border-[hsl(var(--imo-amber-500)/0.3)]", icon: Sparkles },
  cold:    { label: "Froid",   cls: "bg-blue-500/10 text-blue-700 border-blue-500/20", icon: Star },
  dormant: { label: "Dormant", cls: "bg-muted text-muted-foreground border-border", icon: Star },
};

function exportProfilesToCsv(rows: Array<Profile & { _score: number; _projects: number; _budget: number; _segment: string }>) {
  const headers = ["Nom", "Email", "Entreprise", "Téléphone", "Secteur", "Site", "Segment", "Score", "Projets", "CA (€)", "Créé le"];
  const lines = [
    headers.join(","),
    ...rows.map((p) => [
      JSON.stringify(p.full_name ?? ""),
      JSON.stringify(p.email ?? ""),
      JSON.stringify(p.company_name ?? ""),
      JSON.stringify(p.phone ?? ""),
      JSON.stringify(p.industry ?? ""),
      JSON.stringify(p.website ?? ""),
      p._segment,
      p._score,
      p._projects,
      p._budget,
      p.created_at ?? "",
    ].join(",")),
  ].join("\n");
  const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `crm-clients-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  profiles: Profile[];
  projects: Project[];
  search: string;
  industryFilter: string;
  setIndustryFilter: (v: string) => void;
  scoreFilter: string;
  setScoreFilter: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  selectedIds: Set<string>;
  setSelectedIds: (s: Set<string>) => void;
  onOpen: (id: string) => void;
}

export function ClientsBoard({
  profiles, projects, search,
  industryFilter, setIndustryFilter,
  scoreFilter, setScoreFilter,
  sortBy, setSortBy,
  selectedIds, setSelectedIds,
  onOpen,
}: Props) {
  // Build enriched list
  const enriched = useMemo(() => {
    const s = search.toLowerCase();
    return profiles.map((p) => {
      const clientProjects = projects.filter((pr) => pr.client_id === p.id);
      const score = computeClientScore(p, clientProjects);
      const activeCount = clientProjects.filter((pr) => !["archived", "lost", "cancelled"].includes(pr.status)).length;
      const signedCount = clientProjects.filter((pr) => ["signed", "completed", "delivered"].includes(pr.status)).length;
      const budget = clientProjects.reduce((sum, pr) => sum + (pr.contract_amount || pr.proposal_amount || pr.estimated_budget_max || 0), 0);
      const daysInactive = p.last_seen_at
        ? Math.floor((Date.now() - new Date(p.last_seen_at).getTime()) / 86400000)
        : null;
      const segment = segmentOf(score, daysInactive);
      const matchSearch = !s
        || p.full_name?.toLowerCase().includes(s)
        || p.email?.toLowerCase().includes(s)
        || p.company_name?.toLowerCase().includes(s)
        || p.industry?.toLowerCase().includes(s);
      return { profile: p, clientProjects, score, activeCount, signedCount, budget, daysInactive, segment, matchSearch };
    });
  }, [profiles, projects, search]);

  const industries = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach((p) => { if (p.industry) set.add(p.industry); });
    return Array.from(set).sort();
  }, [profiles]);

  const filtered = useMemo(() => {
    return enriched
      .filter((e) => e.matchSearch)
      .filter((e) => industryFilter === "all" || e.profile.industry === industryFilter)
      .filter((e) => scoreFilter === "all" || e.segment === scoreFilter)
      .sort((a, b) => {
        switch (sortBy) {
          case "score":    return b.score - a.score;
          case "projects": return b.clientProjects.length - a.clientProjects.length;
          case "ca":       return b.budget - a.budget;
          case "name":     return (a.profile.full_name ?? "").localeCompare(b.profile.full_name ?? "");
          case "recent":
          default: {
            const aT = a.profile.last_seen_at ?? a.profile.created_at ?? "";
            const bT = b.profile.last_seen_at ?? b.profile.created_at ?? "";
            return bT.localeCompare(aT);
          }
        }
      });
  }, [enriched, industryFilter, scoreFilter, sortBy]);

  const segCounts = useMemo(() => {
    const c = { hot: 0, warm: 0, cold: 0, dormant: 0 };
    enriched.forEach((e) => { c[e.segment]++; });
    return c;
  }, [enriched]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((e) => selectedIds.has(e.profile.id));

  function toggle(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }
  function toggleAllVisible() {
    if (allVisibleSelected) {
      const next = new Set(selectedIds);
      filtered.forEach((e) => next.delete(e.profile.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filtered.forEach((e) => next.add(e.profile.id));
      setSelectedIds(next);
    }
  }
  function clearSelection() { setSelectedIds(new Set()); }

  const selectedRows = enriched.filter((e) => selectedIds.has(e.profile.id));

  function handleExport(scope: "selected" | "all") {
    const src = scope === "selected" ? selectedRows : filtered;
    if (src.length === 0) {
      toast.error("Aucun client à exporter");
      return;
    }
    exportProfilesToCsv(src.map((e) => ({
      ...e.profile,
      _score: e.score,
      _projects: e.clientProjects.length,
      _budget: e.budget,
      _segment: SEGMENT_META[e.segment].label,
    })));
    toast.success(`${src.length} client${src.length > 1 ? "s" : ""} exporté${src.length > 1 ? "s" : ""}`);
  }

  function handleBulkEmail() {
    const emails = selectedRows.map((e) => e.profile.email).filter(Boolean) as string[];
    if (emails.length === 0) { toast.error("Aucune adresse email"); return; }
    // Mailto fallback (≤ ~20 destinataires). Pour plus, branchez Brevo plus tard.
    if (emails.length > 30) {
      navigator.clipboard.writeText(emails.join(", "));
      toast.success(`${emails.length} adresses copiées dans le presse-papiers`);
      return;
    }
    window.location.href = `mailto:?bcc=${encodeURIComponent(emails.join(","))}`;
  }

  function handleBulkTagPlaceholder() {
    toast.message("Ajout de tag en lot", { description: "Bientôt disponible — câblé sur la prochaine itération." });
  }

  function handleBulkAssignPlaceholder() {
    toast.message("Assignation en lot", { description: "Bientôt disponible — câblé sur la prochaine itération." });
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            <strong className="text-foreground tabular-nums">{filtered.length}</strong>
            {" / "}
            <span>{enriched.length}</span>
            {" client"}{enriched.length > 1 ? "s" : ""}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          {(["hot", "warm", "cold", "dormant"] as const).map((seg) => {
            const Icon = SEGMENT_META[seg].icon;
            const active = scoreFilter === seg;
            return (
              <button
                key={seg}
                type="button"
                onClick={() => setScoreFilter(active ? "all" : seg)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all ${SEGMENT_META[seg].cls} ${active ? "ring-2 ring-offset-1 ring-primary/40" : "opacity-80 hover:opacity-100"}`}
              >
                <Icon className="h-3 w-3" />
                {SEGMENT_META[seg].label}
                <span className="tabular-nums opacity-70">{segCounts[seg]}</span>
              </button>
            );
          })}
          {scoreFilter !== "all" && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setScoreFilter("all")}>
              <X className="h-3 w-3 mr-1" /> reset
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Secteur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous secteurs</SelectItem>
              {industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Tri : récents</SelectItem>
              <SelectItem value="score">Tri : score ↓</SelectItem>
              <SelectItem value="projects">Tri : projets ↓</SelectItem>
              <SelectItem value="ca">Tri : CA ↓</SelectItem>
              <SelectItem value="name">Tri : nom A-Z</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={toggleAllVisible}>
            {allVisibleSelected ? "Tout désélectionner" : "Tout sélectionner"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Download className="h-3 w-3 mr-1" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("all")}>
                CSV — clients filtrés ({filtered.length})
              </DropdownMenuItem>
              <DropdownMenuItem disabled={selectedRows.length === 0} onClick={() => handleExport("selected")}>
                CSV — sélection ({selectedRows.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedRows.length > 0 && (
        <div className="flex items-center justify-between gap-3 p-2 pl-3 rounded-lg border border-primary/30 bg-primary/5">
          <span className="text-sm font-medium">
            {selectedRows.length} client{selectedRows.length > 1 ? "s" : ""} sélectionné{selectedRows.length > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleBulkEmail}>
              <Send className="h-3 w-3 mr-1" /> Email
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleBulkTagPlaceholder}>
              <Tag className="h-3 w-3 mr-1" /> Tag
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleBulkAssignPlaceholder}>
              <UserPlus className="h-3 w-3 mr-1" /> Assigner
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleExport("selected")}>
              <Download className="h-3 w-3 mr-1" /> CSV
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={clearSelection}>
              <X className="h-3 w-3 mr-1" /> Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground">
            <Filter className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun client ne correspond aux filtres actifs.</p>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setScoreFilter("all"); setIndustryFilter("all"); }}>
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(({ profile, clientProjects, score, activeCount, signedCount, budget, daysInactive, segment }) => {
            const meta = SEGMENT_META[segment];
            const SegIcon = meta.icon;
            const isSelected = selectedIds.has(profile.id);
            return (
              <Card
                key={profile.id}
                className={`relative border shadow-sm hover:shadow-md transition-all cursor-pointer group ${isSelected ? "ring-2 ring-primary/50 border-primary/50" : ""}`}
                onClick={() => onOpen(profile.id)}
              >
                <CardContent className="p-0">
                  {/* Selection checkbox */}
                  <div
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => { e.stopPropagation(); toggle(profile.id); }}
                  >
                    <Checkbox checked={isSelected} className="bg-background shadow-sm" />
                  </div>

                  {/* Quick actions menu */}
                  <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel className="text-xs">Actions rapides</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onOpen(profile.id)}>
                          Voir la fiche complète
                        </DropdownMenuItem>
                        {profile.email && (
                          <DropdownMenuItem onClick={() => { window.location.href = `mailto:${profile.email}`; }}>
                            Envoyer un email
                          </DropdownMenuItem>
                        )}
                        {profile.phone && (
                          <DropdownMenuItem onClick={() => { window.location.href = `tel:${profile.phone}`; }}>
                            Appeler
                          </DropdownMenuItem>
                        )}
                        {profile.website && (
                          <DropdownMenuItem onClick={() => { window.open(profile.website!.startsWith("http") ? profile.website! : `https://${profile.website}`, "_blank"); }}>
                            Ouvrir le site web
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(profile.email ?? "")}>
                          Copier l'email
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Header */}
                  <div className="p-4 pb-2 pl-10">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                        <AvatarFallback className="gradient-primary text-primary-foreground font-semibold text-sm">
                          {profile.full_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {profile.full_name || "Sans nom"}
                        </h3>
                        {profile.company_name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3 shrink-0" /> {profile.company_name}
                            {profile.company_role && <span className="opacity-50">· {profile.company_role}</span>}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${meta.cls}`}>
                            <SegIcon className="h-2.5 w-2.5" /> {meta.label}
                          </span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground">
                            <Star className="h-2.5 w-2.5" /> {score}
                          </span>
                          {daysInactive !== null && daysInactive > 30 && (
                            <Badge variant="outline" className="text-[9px] h-4">{daysInactive}j inact.</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact dense */}
                  <div className="px-4 pb-2 pt-1 space-y-0.5 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                    {profile.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile.industry && (
                      <div className="flex items-center gap-1.5">
                        <Target className="h-3 w-3 shrink-0" />
                        <span>{profile.industry}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3 shrink-0" />
                        <span className="truncate">{profile.website.replace(/^https?:\/\//, "")}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer stats */}
                  <div className="px-4 py-2 border-t bg-muted/20 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-0.5 font-medium text-foreground">
                        <FolderKanban className="h-3 w-3" /> {clientProjects.length}
                      </span>
                      {activeCount > 0 && (
                        <Badge className="gradient-primary border-0 text-[9px] h-4 px-1.5">{activeCount} actif</Badge>
                      )}
                      {signedCount > 0 && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-green-700 border-green-300">{signedCount} signé</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {budget > 0 && (
                        <span className="font-semibold text-foreground flex items-center gap-0.5">
                          <Euro className="h-3 w-3" />{(budget / 1000).toFixed(0)}k
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {profile.last_seen_at
                          ? formatDistanceToNow(new Date(profile.last_seen_at), { addSuffix: true, locale: fr })
                          : profile.created_at
                          ? formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: fr })
                          : "—"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
