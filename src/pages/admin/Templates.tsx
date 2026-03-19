import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { FileText, Plus, Pencil, Trash2, Loader2, Copy, ToggleLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SupabaseError } from "@/types/admin";
import type { Json } from "@/integrations/supabase/types";

const TEMPLATE_TYPES = [
  { value: "cdc", label: "Cahier des Charges" },
  { value: "proposal", label: "Proposition Commerciale" },
  { value: "contract", label: "Contrat" },
  { value: "email", label: "Email" },
  { value: "system_prompt", label: "System Prompt IA" },
];

const CATEGORIES = [
  { value: "document", label: "Document" },
  { value: "communication", label: "Communication" },
  { value: "ai", label: "Intelligence Artificielle" },
];

const emptyTemplate = {
  name: "",
  slug: "",
  type: "cdc",
  category: "document",
  content: "",
  is_active: true,
  is_default: false,
  tags: [] as string[],
  variables: [] as { name: string; description: string; default_value: string }[],
};

export default function AdminTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyTemplate);
  const [tagInput, setTagInput] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["admin-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("type")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        type: form.type,
        category: form.category,
        content: form.content,
        is_active: form.is_active,
        is_default: form.is_default,
        tags: form.tags,
        variables: form.variables as unknown as Json,
        created_by: user?.id,
      };

      if (editId) {
        const { error } = await supabase.from("templates").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("templates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      toast.success(editId ? "Template mis à jour !" : "Template créé !");
      resetForm();
    },
    onError: (e: SupabaseError) => toast.error(e.message || "Erreur"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      toast.success("Template supprimé.");
    },
    onError: (e: SupabaseError) => toast.error(e.message || "Erreur"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("templates").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
    },
  });

  const resetForm = () => {
    setForm(emptyTemplate);
    setEditId(null);
    setDialogOpen(false);
    setTagInput("");
  };

  const openEdit = (tpl: typeof templates[number]) => {
    setEditId(tpl.id);
    setForm({
      name: tpl.name,
      slug: tpl.slug,
      type: tpl.type,
      category: tpl.category || "document",
      content: tpl.content,
      is_active: tpl.is_active,
      is_default: tpl.is_default,
      tags: tpl.tags || [],
      variables: tpl.variables || [],
    });
    setDialogOpen(true);
  };

  const duplicateTemplate = (tpl: typeof templates[number]) => {
    setEditId(null);
    setForm({
      name: `${tpl.name} (copie)`,
      slug: `${tpl.slug}-copy`,
      type: tpl.type,
      category: tpl.category || "document",
      content: tpl.content,
      is_active: false,
      is_default: false,
      tags: tpl.tags || [],
      variables: tpl.variables || [],
    });
    setDialogOpen(true);
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const addVariable = () => {
    setForm({
      ...form,
      variables: [...form.variables, { name: "", description: "", default_value: "" }],
    });
  };

  const filteredTemplates = filterType === "all" ? templates : templates.filter((t) => t.type === filterType);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les modèles de documents, prompts IA et emails.
          </p>
        </div>
        <Button
          className="gradient-primary border-0"
          onClick={() => { resetForm(); setDialogOpen(true); }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nouveau template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={filterType === "all" ? "default" : "outline"}
          className={`cursor-pointer ${filterType === "all" ? "gradient-primary border-0" : ""}`}
          onClick={() => setFilterType("all")}
        >
          Tous ({templates.length})
        </Badge>
        {TEMPLATE_TYPES.map((t) => {
          const count = templates.filter((tpl) => tpl.type === t.value).length;
          return (
            <Badge
              key={t.value}
              variant={filterType === t.value ? "default" : "outline"}
              className={`cursor-pointer ${filterType === t.value ? "gradient-primary border-0" : ""}`}
              onClick={() => setFilterType(t.value)}
            >
              {t.label} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Templates list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Aucun template</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Créez votre premier template pour standardiser vos documents.
            </p>
            <Button className="gradient-primary border-0" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Créer un template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((tpl) => (
            <Card key={tpl.id} className={`border-0 shadow-sm transition-all hover:shadow-md ${!tpl.is_active ? "opacity-60" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-sm">{tpl.name}</CardTitle>
                      <p className="text-[10px] text-muted-foreground font-mono">{tpl.slug}</p>
                    </div>
                  </div>
                  <Switch
                    checked={tpl.is_active}
                    onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: tpl.id, is_active: checked })}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge variant="secondary" className="text-[10px]">
                    {TEMPLATE_TYPES.find((t) => t.value === tpl.type)?.label || tpl.type}
                  </Badge>
                  {tpl.is_default && (
                    <Badge variant="default" className="text-[10px] gradient-primary border-0">Par défaut</Badge>
                  )}
                  {(tpl.tags || []).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {tpl.content.substring(0, 120)}...
                </p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(tpl)}>
                    <Pencil className="h-3 w-3 mr-1" /> Éditer
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => duplicateTemplate(tpl)}>
                    <Copy className="h-3 w-3 mr-1" /> Dupliquer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Supprimer ce template ?")) deleteMutation.mutate(tpl.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editId ? "Modifier le template" : "Nouveau template"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: CDC Standard"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="cdc-standard"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label className="text-sm">Actif</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_default}
                  onCheckedChange={(v) => setForm({ ...form, is_default: v })}
                />
                <Label className="text-sm">Par défaut</Label>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Ajouter un tag..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>+</Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs cursor-pointer" onClick={() => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Variables */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Variables</Label>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addVariable}>
                  <Plus className="h-3 w-3 mr-1" /> Variable
                </Button>
              </div>
              {form.variables.map((v, i) => (
                <div key={`var-${i}-${v.name}`} className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Nom"
                    value={v.name}
                    className="text-sm"
                    onChange={(e) => {
                      const vars = [...form.variables];
                      vars[i] = { ...vars[i], name: e.target.value };
                      setForm({ ...form, variables: vars });
                    }}
                  />
                  <Input
                    placeholder="Description"
                    value={v.description}
                    className="text-sm"
                    onChange={(e) => {
                      const vars = [...form.variables];
                      vars[i] = { ...vars[i], description: e.target.value };
                      setForm({ ...form, variables: vars });
                    }}
                  />
                  <div className="flex gap-1">
                    <Input
                      placeholder="Défaut"
                      value={v.default_value}
                      className="text-sm flex-1"
                      onChange={(e) => {
                        const vars = [...form.variables];
                        vars[i] = { ...vars[i], default_value: e.target.value };
                        setForm({ ...form, variables: vars });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive"
                      onClick={() => setForm({ ...form, variables: form.variables.filter((_, j) => j !== i) })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label>Contenu du template</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Contenu Markdown avec {{variables}}..."
                rows={14}
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                Utilisez {"{{variable}}"} pour insérer des variables dynamiques.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Annuler</Button>
            <Button
              className="gradient-primary border-0"
              onClick={() => saveMutation.mutate()}
              disabled={!form.name || !form.content || saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editId ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
