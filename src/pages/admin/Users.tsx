import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, MoreHorizontal, Shield, UserCheck, UserX } from "lucide-react";
import { useState } from "react";

const users = [
  { id: "1", name: "Marie Dupont", email: "marie@techvision.fr", role: "client", status: "active", lastSeen: "Il y a 5 min", projects: 3 },
  { id: "2", name: "Thomas Martin", email: "thomas@startup.com", role: "client", status: "active", lastSeen: "Il y a 1h", projects: 1 },
  { id: "3", name: "Jean Consultant", email: "jean@imotion.fr", role: "consultant", status: "active", lastSeen: "En ligne", projects: 8 },
  { id: "4", name: "Admin IMOTION", email: "admin@imotion.fr", role: "admin", status: "active", lastSeen: "En ligne", projects: 0 },
  { id: "5", name: "Sophie Bernard", email: "sophie@datacorp.fr", role: "client", status: "inactive", lastSeen: "Il y a 2 semaines", projects: 2 },
];

const roleColors: Record<string, string> = {
  admin: "destructive",
  consultant: "default",
  client: "secondary",
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} utilisateurs au total</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un utilisateur..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-3">
        {filtered.map((user) => (
          <Card key={user.id} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={`text-sm font-bold ${user.role === "admin" ? "gradient-primary text-white" : user.role === "consultant" ? "bg-secondary text-secondary-foreground" : "bg-muted"}`}>
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{user.name}</p>
                    <Badge variant={roleColors[user.role] as any} className="text-[10px]">
                      {user.role === "admin" && <Shield className="h-2.5 w-2.5 mr-0.5" />}
                      {user.role}
                    </Badge>
                    {user.status === "inactive" && <Badge variant="outline" className="text-[10px]">Inactif</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{user.email}</span>
                    <span>{user.lastSeen}</span>
                    <span>{user.projects} projets</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
