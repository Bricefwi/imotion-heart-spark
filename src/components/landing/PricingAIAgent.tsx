import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Sparkles, MessageCircle } from "lucide-react";
import { SafeMarkdown } from "@/components/SafeMarkdown";
import { env } from "@/lib/env";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${env.SUPABASE_URL}/functions/v1/commercial-agent`;

const WELCOME_MESSAGE: Msg = {
  role: "assistant",
  content:
    "👋 Bonjour ! Vous avez des questions sur nos offres, le processus ou les tarifs ? Je suis là pour y répondre instantanément. N'hésitez pas !",
};

const QUICK_QUESTIONS = [
  "Pourquoi le CDC est-il gratuit ?",
  "Que contient le cahier des charges ?",
  "Combien de temps pour mon CDC ?",
  "Quels types de projets réalisez-vous ?",
  "Comment se passe le devis personnalisé ?",
  "Quel accompagnement après livraison ?",
];

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || "Une erreur est survenue");
    return;
  }
  if (!resp.body) { onError("Pas de réponse"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function PricingAIAgent() {
  const [messages, setMessages] = useState<Msg[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const userMsg: Msg = { role: "user", content: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      let assistantSoFar = "";
      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2].role === "user") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      try {
        await streamChat({
          messages: [...messages, userMsg],
          onDelta: upsert,
          onDone: () => setLoading(false),
          onError: (msg) => {
            setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${msg}` }]);
            setLoading(false);
          },
        });
      } catch {
        setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Impossible de contacter l'assistant." }]);
        setLoading(false);
      }
    },
    [messages, loading]
  );

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" /> Assistant IA
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Une question ? Notre IA vous répond <span className="gradient-text">instantanément</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Plus besoin de chercher dans une FAQ. Posez votre question et obtenez une réponse personnalisée sur nos offres, notre processus et nos tarifs.
          </p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            {/* Chat Panel */}
            <div className="bg-background border rounded-2xl shadow-sm overflow-hidden flex flex-col" style={{ minHeight: 420 }}>
              {/* Chat Header */}
              <div className="gradient-primary px-5 py-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">Assistant Commercial</p>
                  <p className="text-xs text-primary-foreground/70">En ligne • Répond instantanément</p>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: 360 }}>
                {messages.map((msg, i) => (
                  <div key={`${msg.role}-${i}`} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs ${
                      msg.role === "assistant" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {msg.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "assistant" ? "bg-muted text-foreground rounded-tl-sm" : "gradient-primary text-primary-foreground rounded-tr-sm"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none [&_p]:m-0 [&_ul]:mt-1 [&_a]:text-primary [&_a]:underline">
                          <SafeMarkdown>{msg.content}</SafeMarkdown>
                        </div>
                      ) : msg.content}
                    </div>
                  </div>
                ))}
                {loading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-2.5">
                    <div className="shrink-0 h-7 w-7 rounded-full gradient-primary flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t p-4 flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send(input)}
                  placeholder="Posez votre question ici..."
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
                  disabled={loading}
                />
                <Button size="icon" className="h-9 w-9 rounded-full gradient-primary border-0" onClick={() => send(input)} disabled={!input.trim() || loading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Questions Sidebar */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Questions fréquentes</p>
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="w-full text-left text-sm px-4 py-3 rounded-xl border bg-background hover:bg-muted/50 hover:border-primary/30 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
