import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Mic, Pause, Phone, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const phaseLabels = ["Accueil", "Exploration du besoin", "Vision", "Écosystème", "Contraintes", "Profil décisionnel", "Synthèse & Validation"];

interface Message {
  id: string;
  role: "user" | "assistant" | "consultant";
  content: string;
  createdAt: Date;
  suggestions?: string[];
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Bonjour ! 👋 Je suis l'assistant IMOTION Discovery. Je vais vous aider à définir votre projet digital étape par étape.\n\nPour commencer, pouvez-vous me parler de votre projet ? Qu'est-ce qui vous amène aujourd'hui ?",
    createdAt: new Date(),
    suggestions: ["Je veux refondre mon site web", "Je cherche à créer une application mobile", "J'ai besoin d'un outil interne"],
  },
];

export default function ProjectConversation() {
  const { id } = useParams();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentPhase = 1;
  const overallProgress = 10;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text?: string) => {
    const content = text || input.trim();
    if (!content) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Merci pour ces informations ! C'est très intéressant. Pouvez-vous me décrire plus en détail les problèmes que vous rencontrez avec votre solution actuelle ?",
        createdAt: new Date(),
        suggestions: ["Performance insuffisante", "Design daté", "Pas adapté mobile"],
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6">
      {/* Header */}
      <div className="border-b bg-background px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link to="/client/projects"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h2 className="font-display font-semibold text-sm">Refonte site e-commerce</h2>
            <p className="text-xs text-muted-foreground">IM-2603-0042</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Phase indicator */}
      <div className="border-b bg-muted/30 px-4 py-2">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium">Phase {currentPhase}/7 : {phaseLabels[currentPhase - 1]}</span>
          <span className="text-muted-foreground">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-1.5" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
            >
              <div className={cn("flex gap-2.5 max-w-[80%]", message.role === "user" && "flex-row-reverse")}>
                {message.role !== "user" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className={cn(
                      "text-xs font-bold text-white",
                      message.role === "consultant" ? "bg-secondary" : "gradient-primary"
                    )}>
                      {message.role === "consultant" ? "C" : "IA"}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  {message.role !== "user" && (
                    <p className="text-[11px] text-muted-foreground mb-1">
                      {message.role === "consultant" ? "Consultant IMOTION" : "Assistant IMOTION"}
                    </p>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      message.role === "user"
                        ? "gradient-primary text-white rounded-br-md"
                        : message.role === "consultant"
                        ? "bg-secondary/10 border border-secondary/20 rounded-bl-md"
                        : "bg-card border shadow-sm rounded-bl-md"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="gradient-primary text-xs font-bold text-white">IA</AvatarFallback>
            </Avatar>
            <div className="bg-card border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Suggestions */}
        {!isTyping && messages.at(-1)?.suggestions && (
          <div className="flex flex-wrap gap-2 pl-10">
            {messages.at(-1)!.suggestions!.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="rounded-full text-xs h-8"
                onClick={() => handleSend(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-background p-4">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrivez votre réponse..."
            className="min-h-[48px] max-h-[200px] resize-none rounded-xl"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
            <Mic className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            className="gradient-primary border-0 shrink-0"
            onClick={() => handleSend()}
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-2">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            <Pause className="h-3 w-3 mr-1" /> Mettre en pause
          </Button>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            <Phone className="h-3 w-3 mr-1" /> Demander un appel
          </Button>
        </div>
      </div>
    </div>
  );
}
