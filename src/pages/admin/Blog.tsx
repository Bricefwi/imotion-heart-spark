import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BookOpen, Calendar, Loader2, Eye, EyeOff, Pencil, Trash2, RefreshCw,
  Play, CheckCircle2, XCircle, Clock, AlertTriangle, FileText, Plus,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import type { SupabaseError } from "@/types/admin";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

const CATEGORIES = [
  { value: "expression-besoin", label: "Expression du besoin", emoji: "💬" },
  { value: "image-identite", label: "Image & Identité", emoji: "🎨" },
  { value: "strategie", label: "Stratégie digitale", emoji: "🎯" },
  { value: "cas-clients", label: "Cas clients", emoji: "📖" },
  { value: "outils", label: "Outils pratiques", emoji: "🛠️" },
];

const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  planned: { label: "Planifié", icon: Clock, className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  generating: { label: "En cours", icon: Loader2, className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  generated: { label: "Généré", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  published: { label: "Publié", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  failed: { label: "Échoué", icon: XCircle, className: "bg-primary/50/10 text-primary border-red-500/20" },
};

export default function AdminBlog() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("articles");
  const [editPost, setEditPost] = useState<Tables<"blog_posts"> | null>(null);
  const [editCalendar, setEditCalendar] = useState<(Tables<"blog_editorial_calendar"> & { _isNew?: boolean }) | null>(null);
  const [calendarFilter, setCalendarFilter] = useState("all");

  // === Queries ===
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: calendar = [], isLoading: calendarLoading } = useQuery({
    queryKey: ["admin-blog-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_editorial_calendar")
        .select("*")
        .order("planned_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: subscribers = [] } = useQuery({
    queryKey: ["admin-newsletter-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // === Mutations ===
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const update: Record<string, string | boolean> = { is_published };
      if (is_published && !posts.find(p => p.id === id)?.published_at) {
        update.published_at = new Date().toISOString();
      }
      const { error } = await supabase.from("blog_posts").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Statut mis à jour");
    },
    onError: (e: SupabaseError) => toast.error(e.message),
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Article supprimé");
    },
    onError: (e: SupabaseError) => toast.error(e.message),
  });

  const updatePostMutation = useMutation({
    mutationFn: async (post: Tables<"blog_posts">) => {
      const { id, ...data } = post;
      const { error } = await supabase.from("blog_posts").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Article mis à jour");
      setEditPost(null);
    },
    onError: (e: SupabaseError) => toast.error(e.message),
  });

  const resetCalendarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blog_editorial_calendar")
        .update({ status: "planned", generated_post_id: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-calendar"] });
      toast.success("Entrée réinitialisée");
    },
    onError: (e: SupabaseError) => toast.error(e.message),
  });

  const deleteCalendarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_editorial_calendar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-calendar"] });
      toast.success("Entrée supprimée");
    },
    onError: (e: SupabaseError) => toast.error(e.message),
  });

  const addCalendarMutation = useMutation({
    mutationFn: async (entry: TablesInsert<"blog_editorial_calendar">) => {
      const { error } = await supabase.from("blog_editorial_calendar").insert(entry);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-calendar"] });
      toast.success("Entrée ajoutée au calendrier");
      setEditCalendar(null);
    },
    onError: (e: SupabaseError) => toast.error(e.message),
  });

  const updateCalendarMutation = useMutation({
    mutationFn: async (entry: Tables<"blog_editorial_calendar"> & { _isNew?: boolean }) => {
      const { id, ...data } = entry;
      const { error } = await supabase.from("blog_editorial_calendar").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-calendar"] });
      toast.success("Entrée mise à jour");
      setEditCalendar(null);
    },
    onError: (e: SupabaseError) => toast.error(e.message),
  });

  const triggerGenerationMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-blog-post", {
        body: {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-calendar"] });
      if (data?.generated > 0) {
        toast.success(`${data.generated} article(s) généré(s) !`);
      } else {
        toast.info(data?.message || "Aucun article à générer");
      }
    },
    onError: (e: SupabaseError) => toast.error(e.message || "Erreur de génération"),
  });

  // Stats
  const publishedCount = posts.filter(p => p.is_published).length;
  const draftCount = posts.filter(p => !p.is_published).length;
  const totalViews = posts.reduce((sum, p) => sum + (p.view_count || 0), 0);
  const plannedCount = calendar.filter(c => c.status === "planned").length;
  const filteredCalendar = calendarFilter === "all" ? calendar : calendar.filter(c => c.status === calendarFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Gestion du Blog</h1>
          <p className="text-muted-foreground mt-1">
            Calendrier éditorial, articles et newsletter
          </p>
        </div>
        <Button
          className="gradient-primary border-0"
          onClick={() => triggerGenerationMutation.mutate()}
          disabled={triggerGenerationMutation.isPending}
        >
          {triggerGenerationMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Générer maintenant
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display">{publishedCount}</p>
            <p className="text-xs text-muted-foreground">Publiés</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display">{draftCount}</p>
            <p className="text-xs text-muted-foreground">Brouillons</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display">{plannedCount}</p>
            <p className="text-xs text-muted-foreground">Planifiés</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display">{totalViews}</p>
            <p className="text-xs text-muted-foreground">Vues totales</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display">{subscribers.length}</p>
            <p className="text-xs text-muted-foreground">Abonnés</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="articles" className="gap-2">
            <BookOpen className="h-4 w-4" /> Articles ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" /> Calendrier ({calendar.length})
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-2">
            <FileText className="h-4 w-4" /> Abonnés ({subscribers.length})
          </TabsTrigger>
        </TabsList>

        {/* === ARTICLES TAB === */}
        <TabsContent value="articles" className="mt-6">
          {postsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : posts.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">Aucun article</h3>
                <p className="text-muted-foreground text-sm">Lancez la génération pour créer vos premiers articles.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Article</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-center">Vues</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {post.cover_image ? (
                            <img src={post.cover_image} alt="" className="h-10 w-16 rounded object-cover shrink-0" />
                          ) : (
                            <div className="h-10 w-16 rounded bg-muted flex items-center justify-center shrink-0">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{post.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {post.published_at ? format(new Date(post.published_at), "d MMM yyyy", { locale: fr }) : "Non publié"}
                              {" · "}{post.reading_time} min
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORIES.find(c => c.value === post.category)?.emoji}{" "}
                          {CATEGORIES.find(c => c.value === post.category)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">{post.view_count || 0}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={post.is_published ? "bg-emerald-500/10 text-emerald-600" : "bg-yellow-500/10 text-yellow-600"}>
                          {post.is_published ? "Publié" : "Brouillon"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => togglePublishMutation.mutate({ id: post.id, is_published: !post.is_published })}
                            title={post.is_published ? "Dépublier" : "Publier"}
                          >
                            {post.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => setEditPost({ ...post })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => { if (confirm("Supprimer cet article ?")) deletePostMutation.mutate(post.id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* === CALENDAR TAB === */}
        <TabsContent value="calendar" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 flex-wrap">
              {["all", "planned", "published", "failed"].map((s) => (
                <Badge
                  key={s}
                  variant={calendarFilter === s ? "default" : "outline"}
                  className={`cursor-pointer ${calendarFilter === s ? "gradient-primary border-0" : ""}`}
                  onClick={() => setCalendarFilter(s)}
                >
                  {s === "all" ? "Tous" : statusConfig[s]?.label || s}
                  {" "}({s === "all" ? calendar.length : calendar.filter(c => c.status === s).length})
                </Badge>
              ))}
            </div>
            <Button
              variant="outline" size="sm"
              onClick={() => setEditCalendar({
                id: "",
                created_at: "",
                generated_post_id: "",
                week_number: 0,
                planned_date: "",
                title: "",
                category: "expression-besoin",
                angle: "",
                keywords: [] as string[],
                status: "planned",
                _isNew: true,
              } as never)}
            >
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </div>

          {calendarLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">S.</TableHead>
                    <TableHead className="w-28">Date</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalendar.map((entry) => {
                    const sc = statusConfig[entry.status] || statusConfig.planned;
                    const StatusIcon = sc.icon;
                    const isPast = new Date(entry.planned_date) < new Date();
                    return (
                      <TableRow key={entry.id} className={entry.status === "failed" ? "bg-primary/5/50" : ""}>
                        <TableCell className="text-xs font-mono text-muted-foreground">S{entry.week_number}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            {isPast && entry.status === "planned" && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                            {format(new Date(entry.planned_date), "d MMM yyyy", { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium truncate max-w-[300px]">{entry.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[300px]">{entry.angle}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {CATEGORIES.find(c => c.value === entry.category)?.emoji}{" "}
                            {CATEGORIES.find(c => c.value === entry.category)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`text-xs ${sc.className}`}>
                            <StatusIcon className={`h-3 w-3 mr-1 ${entry.status === "generating" ? "animate-spin" : ""}`} />
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8"
                              onClick={() => setEditCalendar({ ...entry })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {(entry.status === "failed" || entry.status === "generating") && (
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8 text-blue-600"
                                onClick={() => resetCalendarMutation.mutate(entry.id)}
                                title="Réinitialiser"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => { if (confirm("Supprimer cette entrée ?")) deleteCalendarMutation.mutate(entry.id); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* === SUBSCRIBERS TAB === */}
        <TabsContent value="subscribers" className="mt-6">
          {subscribers.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">Aucun abonné</h3>
                <p className="text-muted-foreground text-sm">Les inscriptions à la newsletter apparaîtront ici.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Date d'inscription</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((sub: { id: string; email: string; subscribed_at: string | null; is_active: boolean | null }) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(sub.subscribed_at), "d MMM yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={sub.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/50/10 text-primary"}>
                          {sub.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* === EDIT POST DIALOG === */}
      <Dialog open={!!editPost} onOpenChange={(open) => !open && setEditPost(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Modifier l'article</DialogTitle>
          </DialogHeader>
          {editPost && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input value={editPost.title} onChange={(e) => setEditPost({ ...editPost, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Extrait</Label>
                <Textarea value={editPost.excerpt} onChange={(e) => setEditPost({ ...editPost, excerpt: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={editPost.category} onValueChange={(v) => setEditPost({ ...editPost, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Temps de lecture (min)</Label>
                  <Input type="number" value={editPost.reading_time} onChange={(e) => setEditPost({ ...editPost, reading_time: parseInt(e.target.value) || 5 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom auteur</Label>
                  <Input value={editPost.author_name} onChange={(e) => setEditPost({ ...editPost, author_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Image de couverture (URL)</Label>
                  <Input value={editPost.cover_image || ""} onChange={(e) => setEditPost({ ...editPost, cover_image: e.target.value })} placeholder="/blog/cover-xxx.jpg" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={editPost.is_published} onCheckedChange={(v) => setEditPost({ ...editPost, is_published: v })} />
                  <Label className="text-sm">Publié</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contenu (Markdown)</Label>
                <Textarea
                  value={editPost.content}
                  onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                  rows={16}
                  className="font-mono text-sm"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditPost(null)}>Annuler</Button>
                <Button
                  className="gradient-primary border-0"
                  onClick={() => updatePostMutation.mutate(editPost)}
                  disabled={updatePostMutation.isPending}
                >
                  {updatePostMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sauvegarder
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* === EDIT/ADD CALENDAR DIALOG === */}
      <Dialog open={!!editCalendar} onOpenChange={(open) => !open && setEditCalendar(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editCalendar?._isNew ? "Ajouter au calendrier" : "Modifier l'entrée"}
            </DialogTitle>
          </DialogHeader>
          {editCalendar && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Titre de l'article</Label>
                <Input value={editCalendar.title} onChange={(e) => setEditCalendar({ ...editCalendar, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date planifiée</Label>
                  <Input type="date" value={editCalendar.planned_date} onChange={(e) => setEditCalendar({ ...editCalendar, planned_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Semaine</Label>
                  <Input type="number" value={editCalendar.week_number} onChange={(e) => setEditCalendar({ ...editCalendar, week_number: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={editCalendar.category} onValueChange={(v) => setEditCalendar({ ...editCalendar, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Angle éditorial</Label>
                <Textarea value={editCalendar.angle} onChange={(e) => setEditCalendar({ ...editCalendar, angle: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Mots-clés (séparés par des virgules)</Label>
                <Input
                  value={(editCalendar.keywords || []).join(", ")}
                  onChange={(e) => setEditCalendar({ ...editCalendar, keywords: e.target.value.split(",").map((k: string) => k.trim()).filter(Boolean) })}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditCalendar(null)}>Annuler</Button>
                <Button
                  className="gradient-primary border-0"
                  onClick={() => {
                    if (editCalendar._isNew) {
                      const { _isNew, ...entry } = editCalendar;
                      addCalendarMutation.mutate(entry);
                    } else {
                      updateCalendarMutation.mutate(editCalendar);
                    }
                  }}
                  disabled={addCalendarMutation.isPending || updateCalendarMutation.isPending}
                >
                  {(addCalendarMutation.isPending || updateCalendarMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editCalendar._isNew ? "Ajouter" : "Sauvegarder"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
