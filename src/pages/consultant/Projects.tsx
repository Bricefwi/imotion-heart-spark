import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Star, Eye, MessageSquare, FileText } from "lucide-react";
import { useState } from "react";

const projects = [
  { id: "1", name: "Refonte E-commerce Luxe", client: "Marie Dupont", code: "IM-2603-0042", status: "discovery_active", phase: 5, progress: 72, priority: "urgent", budget: "15-25k€", score: 4, tags: ["e-commerce", "luxe"] },
  { id: "2", name: "App mobile RH", client: "Thomas Martin", code: "IM-2603-0018", status: "cdc_draft", phase: 7, progress: 100, priority: "high", budget: "8-12k€", score: 3, tags: ["mobile", "RH"] },
  { id: "3", name: "Dashboard Analytics", client: "Sophie Bernard", code: "IM-2602-0099", status: "discovery_active", phase: 2, progress: 20, priority: "medium", budget: "5-8k€", score: 2, tags: ["dashboard", "data"] },
  { id: "4", name: "CRM Industrie", client: "Pierre Leroy", code: "IM-2601-0077", status: "signed", phase: 7, progress: 100, priority: "low", budget: "30-50k€", score: 5, tags: ["CRM", "industrie"] },
];

export default function ConsultantProjects() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = projects.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.client.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold">Tous les projets</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="discovery_active">En découverte</SelectItem>
            <SelectItem value="cdc_draft">CDC en cours</SelectItem>
            <SelectItem value="proposal_sent">Proposition envoyée</SelectItem>
            <SelectItem value="signed">Signé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects */}
      <div className="grid gap-4">
        {filtered.map((project) => (
          <Card key={project.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/consultant/projects/${project.id}`} className="font-display font-semibold hover:text-primary transition-colors">
                      {project.name}
                    </Link>
                    <Badge variant={project.priority === "urgent" ? "destructive" : project.priority === "high" ? "default" : "secondary"} className="text-[10px]">
                      {project.priority}
                    </Badge>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < project.score ? "fill-secondary text-secondary" : "text-muted"}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{project.client}</span>
                    <span>{project.code}</span>
                    <span>Phase {project.phase}/7</span>
                    <span>{project.budget}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                  <Progress value={project.progress} className="h-1.5 max-w-sm" />
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/consultant/projects/${project.id}`}><Eye className="h-3.5 w-3.5 mr-1" /> Voir</Link>
                  </Button>
                  <Button size="sm" className="gradient-primary border-0" asChild>
                    <Link to={`/consultant/projects/${project.id}`}><MessageSquare className="h-3.5 w-3.5 mr-1" /> Intervenir</Link>
                  </Button>
                  {project.phase >= 5 && (
                    <Button variant="secondary" size="sm"><FileText className="h-3.5 w-3.5 mr-1" /> Générer CDC</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
