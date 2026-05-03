/**
 * Marketing — Conversation pré-audit avec Alex (rapatrié de lovelib).
 *
 * MOCK : edge fn `mkt-conversational-agent-alex` non migrée.
 * On simule des réponses prédéfinies pour démontrer l'UX.
 * TODO: supabase.functions.invoke('mkt-conversational-agent-alex', { body })
 */
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Send, CheckCircle2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const MOCK_REPLIES = [
  "Parfait. Quel est votre principal canal d'acquisition aujourd'hui ?",
  "Compris. Sur les 12 derniers mois, votre CAC a-t-il évolué ?",
  "Très bien. Dernière question : quel est votre objectif principal sur les 6 prochains mois ?",
  "Merci ! J'ai toutes les informations nécessaires. Je lance l'analyse complète maintenant.",
];

export default function MarketingConversationAlex() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const auditId = params.get("audit_id");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [step, setStep] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auditId) {
      navigate("/marketing/account");
      return;
    }
    setMessages([{
      role: "assistant",
      content: "Bonjour ! Je suis Alex, votre analyste stratégique chez IMOTION. J'ai quelques questions rapides pour personnaliser votre audit. Êtes-vous prêt(e) à commencer ?",
      timestamp: new Date().toISOString(),
    }]);
  }, [auditId, navigate]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input, timestamp: new Date().toISOString() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);

    // TODO: appel mkt-conversational-agent-alex
    setTimeout(() => {
      const reply = MOCK_REPLIES[step] ?? MOCK_REPLIES[MOCK_REPLIES.length - 1];
      setMessages((p) => [...p, { role: "assistant", content: reply, timestamp: new Date().toISOString() }]);
      const isLast = step >= MOCK_REPLIES.length - 1;
      setStep(step + 1);
      setLoading(false);
      if (isLast) {
        setCompleted(true);
        setTimeout(() => navigate(`/marketing/account/audits`), 4000);
      }
    }, 900);
  };

  return (
    <>
      <SEOHead title="Conversation avec Alex – IMOTION" />
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl h-[700px] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 bg-gradient-to-br from-primary to-secondary">
                <AvatarFallback className="text-primary-foreground font-bold bg-transparent">A</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">Alex — Analyste stratégique</CardTitle>
                <CardDescription>
                  {completed ? "Conversation terminée — audit en cours…" : "MANUS IA — Audit conversationnel"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    m.role === "user" ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  <p className="text-xs mt-2 opacity-70">
                    {new Date(m.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
            {completed && (
              <div className="flex justify-center">
                <div className="bg-primary/10 border border-primary/30 rounded-lg px-6 py-4 flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold">Conversation terminée !</p>
                    <p className="text-sm text-muted-foreground">Redirection automatique vers vos audits…</p>
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </CardContent>

          {!completed && (
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Tapez votre message…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  disabled={loading}
                />
                <Button onClick={send} disabled={loading || !input.trim()} size="icon" variant="flame">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">Entrée pour envoyer</p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
