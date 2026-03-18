import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PhaseProgress } from "@/components/PhaseProgress";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Phone, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendChatMessage, type ChatMessage } from "@/lib/ai-chat";
import { toast } from "sonner";
import { SafeMarkdown } from "@/components/SafeMarkdown";
import { useQuery } from "@tanstack/react-query";
import marcAvatar from "@/assets/avatar-marc-consultant.jpg";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant" | "consultant";
  content: string;
  createdAt: Date;
  suggestions?: string[];
}

export default function ProjectConversation() {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [overallProgress, setOverallProgress] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch project
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Load existing messages
  useEffect(() => {
    if (!projectId) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        const displayMsgs: DisplayMessage[] = data.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant" | "consultant",
          content: m.content,
          createdAt: new Date(m.created_at!),
        }));
        setMessages(displayMsgs);
        setChatHistory(
          data
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
        );
        setConversationId(data[0].conversation_id || null);
      } else {
        // Initial welcome message (not saved to DB yet - will be saved on first real interaction)
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "Salut ! 👋 Moi c'est Marc, consultant senior chez Clarivi. J'ai accompagné pas mal de projets digitaux et je suis là pour comprendre ton besoin en profondeur.\n\nAvant de parler technique, parle-moi un peu de toi. C'est quoi ton métier au quotidien, et qu'est-ce qui t'amène aujourd'hui ?",
            createdAt: new Date(),
            suggestions: [
              "Je veux digitaliser mon activité",
              "J'ai un projet en tête mais c'est encore flou",
              "Je cherche à remplacer un outil existant",
            ],
          },
        ]);
      }
    };
    loadMessages();
  }, [projectId]);

  // Update phase from project
  useEffect(() => {
    if (project) {
      setCurrentPhase(project.current_phase || 1);
      setOverallProgress(project.overall_progress || 0);
    }
  }, [project]);

  // Create conversation session if none exists
  useEffect(() => {
    if (!projectId || conversationId || !user) return;
    const createConversation = async () => {
      const { data } = await supabase
        .from("conversations")
        .insert({ project_id: projectId, phase_start: currentPhase })
        .select("id")
        .single();
      if (data) setConversationId(data.id);
    };
    createConversation();
  }, [projectId, user, conversationId, currentPhase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content || !projectId || isTyping) return;

    const userMsg: DisplayMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const newChatHistory: ChatMessage[] = [...chatHistory, { role: "user", content }];
    setChatHistory(newChatHistory);

    try {
      const response = await sendChatMessage(newChatHistory, projectId, conversationId || undefined);

      const aiMsg: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        createdAt: new Date(),
        suggestions: response.suggestions?.length > 0 ? response.suggestions : undefined,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setChatHistory((prev) => [...prev, { role: "assistant", content: response.message }]);
      setCurrentPhase(response.phase_current);
      setOverallProgress(response.overall_progress);
      setPhaseProgress(response.phase_progress);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi du message");
      // Remove the user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setChatHistory(chatHistory);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6">
      {/* Header */}
      <div className="border-b bg-background px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link to="/client/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="font-display font-semibold text-sm">
              {project?.name || "Projet"}
            </h2>
            <p className="text-xs text-muted-foreground">{project?.code || ""}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <Phone className="h-4 w-4" />
        </Button>
      </div>

      {/* Phase indicator */}
      <div className="border-b bg-muted/30 px-4 py-3">
        <PhaseProgress
          currentPhase={currentPhase}
          phaseProgress={phaseProgress}
          compact
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "flex gap-2.5 max-w-[80%]",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                {message.role !== "user" && (
                  <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/10">
                    {message.role === "assistant" ? (
                      <AvatarImage src={marcAvatar} alt="Marc Delaunay" className="object-cover" />
                    ) : null}
                    <AvatarFallback
                      className={cn(
                        "text-xs font-bold text-white",
                        message.role === "consultant"
                          ? "bg-secondary"
                          : "gradient-primary"
                      )}
                    >
                      {message.role === "consultant" ? "C" : "M"}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  {message.role !== "user" && (
                    <p className="text-[11px] text-muted-foreground mb-1 font-medium">
                      {message.role === "consultant"
                        ? "Consultant Clarivi"
                        : "Marc Delaunay · Consultant senior"}
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
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <SafeMarkdown>{message.content}</SafeMarkdown>
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2.5"
          >
            <Avatar className="h-9 w-9 ring-2 ring-primary/10">
              <AvatarImage src={marcAvatar} alt="Marc Delaunay" className="object-cover" />
              <AvatarFallback className="gradient-primary text-xs font-bold text-white">
                M
              </AvatarFallback>
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
          <Button
            size="icon"
            className="gradient-primary border-0 shrink-0"
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
