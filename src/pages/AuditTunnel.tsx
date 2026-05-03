import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface Branding {
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
  consultant_persona: string;
  welcome_message: string | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const PHASE_LABELS = ["Votre projet", "Vos besoins", "Cadrage"];

async function callEdgeFunction(fn: string, body: Record<string, unknown>) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  return resp.json();
}

export default function AuditTunnel() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<"welcome" | "email" | "chat" | "generating" | "done">("welcome");
  const [branding, setBranding] = useState<Branding | null>(null);
  const [agencyName, setAgencyName] = useState("");
  const [auditId, setAuditId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Init session
  async function startSession() {
    if (!token) return;
    try {
      const data = await callEdgeFunction("audit-session-start", {
        token,
        prospect_email: email || undefined,
      });
      if (data.error) {
        setError(data.error);
        return;
      }
      setAuditId(data.audit_id);
      setBranding(data.branding);
      setAgencyName(data.agency_name ?? "");
      setStep("chat");

      // Premier message d'accueil
      const welcomeMsg = data.branding?.welcome_message
        ?? `Bonjour ! Je suis ${data.branding?.consultant_persona ?? "Marc"}, consultant chez ${data.agency_name ?? "notre agence"}. Cet audit va durer environ 6 minutes. Pour commencer, parlez-moi de vous et de votre activité.`;

      setMessages([{ role: "assistant", content: welcomeMsg }]);
    } catch (e) {
      setError("Impossible de démarrer l'audit. Veuillez réessayer.");
    }
  }

  async function sendMessage() {
    if (!input.trim() || !auditId || sending) return;
    const userMsg = input.trim();
    setInput("");
    setSending(true);

    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    try {
      const data = await callEdgeFunction("orchestrator", {
        audit_id: auditId,
        user_message: userMsg,
      });

      // Extraire le message de la réponse de l'agent routé
      const agentResult = data?.result;
      const message = agentResult?.message
        ?? agentResult?.result?.message
        ?? "Je traite votre réponse…";

      setMessages((prev) => [...prev, { role: "assistant", content: message }]);

      // Mettre à jour la phase si nécessaire
      if (agentResult?.ready_for_next_phase || data?.result?.ready_for_next_phase) {
        setCurrentPhase((p) => Math.min(p + 1, 3));
      }

      // Détecter la fin (CRITIC ok → génération docs)
      if (data?.result?.critic?.ready_for_documents) {
        setStep("generating");
        setTimeout(() => {
          setStep("done");
          navigate(`/audit/${token}/done`);
        }, 4000);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Une erreur est survenue. Pouvez-vous reformuler ?" },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold mb-2">Lien invalide</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const accentColor = branding?.accent_color ?? "#3B82F6";
  const primaryColor = branding?.primary_color ?? "#0A0A0A";
  const consultantName = branding?.consultant_persona ?? "Marc";

  // Welcome screen
  if (step === "welcome") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-6"
        >
          {branding?.logo_url && (
            <img src={branding.logo_url} alt={agencyName} className="h-10 mx-auto object-contain" />
          )}
          <div>
            <h1 className="text-2xl font-bold mb-2">Bienvenue sur votre audit projet</h1>
            <p className="text-muted-foreground text-sm">
              Je suis <strong>{consultantName}</strong>, votre consultant dédié.
              Cet audit dure <strong>environ 6 minutes</strong> et vous permettra d'obtenir un cahier des charges et un devis personnalisés.
            </p>
          </div>
          <div className="flex gap-4 justify-center text-sm text-muted-foreground">
            {PHASE_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5">
                <span
                  className="size-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {i + 1}
                </span>
                {label}
              </div>
            ))}
          </div>
          <Button
            size="lg"
            className="w-full"
            style={{ backgroundColor: accentColor }}
            onClick={() => setStep("email")}
          >
            Démarrer mon audit
          </Button>
          <p className="text-xs text-muted-foreground">Aucun engagement · Données confidentielles</p>
        </motion.div>
      </div>
    );
  }

  // Email step
  if (step === "email") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full space-y-6"
        >
          <div className="text-center">
            <h2 className="text-xl font-bold mb-1">Votre email</h2>
            <p className="text-sm text-muted-foreground">
              Pour recevoir votre CDC et devis à la fin de l'audit.
            </p>
          </div>
          <div className="space-y-3">
            <input
              type="email"
              placeholder="vous@exemple.fr"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            <Button
              size="lg"
              className="w-full"
              style={{ backgroundColor: accentColor }}
              onClick={() => {
                if (!email.includes("@")) {
                  setEmailError("Adresse email invalide");
                  return;
                }
                startSession();
              }}
            >
              Continuer
            </Button>
            <button
              className="w-full text-xs text-muted-foreground underline"
              onClick={() => startSession()}
            >
              Continuer sans email
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Generating screen
  if (step === "generating") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <Loader2 className="size-12 animate-spin mx-auto" style={{ color: accentColor }} />
          <h2 className="text-xl font-bold">Génération de vos documents…</h2>
          <p className="text-sm text-muted-foreground">
            {consultantName} prépare votre cahier des charges et votre devis estimatif.
          </p>
        </motion.div>
      </div>
    );
  }

  // Chat interface
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderBottomColor: `${accentColor}30` }}
      >
        <div className="flex items-center gap-3">
          {branding?.logo_url && (
            <img src={branding.logo_url} alt={agencyName} className="h-7 object-contain" />
          )}
          <span className="font-medium text-sm">{agencyName || "Audit"}</span>
        </div>
        {/* Phase progress */}
        <div className="flex items-center gap-2">
          {PHASE_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <span
                className={`size-6 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  i + 1 < currentPhase
                    ? "text-white"
                    : i + 1 === currentPhase
                    ? "text-white"
                    : "bg-muted text-muted-foreground"
                }`}
                style={
                  i + 1 <= currentPhase
                    ? { backgroundColor: accentColor }
                    : undefined
                }
              >
                {i + 1 < currentPhase ? <CheckCircle2 className="size-3.5" /> : i + 1}
              </span>
              <span className="hidden md:block text-xs text-muted-foreground">{label}</span>
              {i < 2 && <span className="text-muted-foreground/30 text-xs mx-1">—</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl mx-auto w-full">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="size-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mr-2 mt-0.5"
                  style={{ backgroundColor: accentColor }}
                >
                  {consultantName[0]}
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 text-sm max-w-[80%] ${
                  msg.role === "user"
                    ? "text-white"
                    : "bg-muted"
                }`}
                style={msg.role === "user" ? { backgroundColor: accentColor } : undefined}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {sending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-4 max-w-2xl mx-auto w-full">
        <div className="flex gap-3">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Votre réponse…"
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={sending}
          />
          <Button
            size="icon"
            className="shrink-0 rounded-xl size-10"
            style={{ backgroundColor: accentColor }}
            onClick={sendMessage}
            disabled={!input.trim() || sending}
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Entrée pour envoyer · Shift+Entrée pour un saut de ligne
        </p>
      </div>
    </div>
  );
}
