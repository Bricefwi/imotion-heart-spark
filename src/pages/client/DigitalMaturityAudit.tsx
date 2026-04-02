import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  ArrowRight, ArrowLeft, Sparkles, CheckCircle2, BarChart3, Zap,
} from "lucide-react";
import {
  AUDIT_PROFILES, detectAuditType, getMaturityLevel, MATURITY_LABELS,
  TRANSITION_MESSAGES, ANSWER_FEEDBACK,
  type AuditType, type AnswerKey, type AuditCategory,
} from "@/lib/audit-questions";

type Responses = Record<string, AnswerKey>;

function CategoryScoreBadge({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const level = getMaturityLevel(pct);
  const style = MATURITY_LABELS[level];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.color}`}>
      {style.emoji} {pct}%
    </div>
  );
}

export default function DigitalMaturityAudit() {
  const { id: projectId } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Detect audit type from profile
  const auditType: AuditType = useMemo(
    () => detectAuditType(profile?.company_size || undefined, profile?.industry || undefined),
    [profile?.company_size, profile?.industry]
  );
  const auditProfile = AUDIT_PROFILES[auditType];

  // State
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Responses>({});
  const [showTransition, setShowTransition] = useState(false);
  const [microFeedback, setMicroFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const currentCategory = auditProfile.categories[categoryIndex];
  const currentQuestion = currentCategory?.questions[questionIndex];

  const totalQuestions = auditProfile.categories.reduce((s, c) => s + c.questions.length, 0);
  const answeredCount = Object.keys(responses).length;
  const progress = (answeredCount / totalQuestions) * 100;

  // Compute scores
  const categoryScores = useMemo(() => {
    const scores: Record<string, { score: number; max: number; pct: number; level: string }> = {};
    for (const cat of auditProfile.categories) {
      let score = 0;
      const max = cat.questions.length * 4; // max 4pts per question
      for (const q of cat.questions) {
        const answer = responses[q.id];
        if (answer) {
          const pts = q.answers.find((a) => a.key === answer)?.points || 0;
          score += pts * q.weight;
        }
      }
      const pct = max > 0 ? Math.round((score / max) * 100) : 0;
      scores[cat.key] = { score, max, pct, level: getMaturityLevel(pct) };
    }
    return scores;
  }, [responses, auditProfile.categories]);

  const globalScore = useMemo(() => {
    const vals = Object.values(categoryScores);
    if (vals.length === 0) return 0;
    const totalPct = vals.reduce((s, v) => s + v.pct, 0);
    return Math.round(totalPct / vals.length);
  }, [categoryScores]);

  // Handle answer selection
  const handleAnswer = (key: AnswerKey) => {
    if (!currentQuestion) return;
    setResponses((prev) => ({ ...prev, [currentQuestion.id]: key }));

    // Show micro feedback
    const feedbacks = ANSWER_FEEDBACK[key];
    setMicroFeedback(feedbacks[Math.floor(Math.random() * feedbacks.length)]);

    // Auto-advance after delay
    setTimeout(() => {
      setMicroFeedback(null);
      advanceQuestion();
    }, 800);
  };

  const advanceQuestion = () => {
    if (!currentCategory) return;

    if (questionIndex < currentCategory.questions.length - 1) {
      // Next question in same category
      setQuestionIndex(questionIndex + 1);
    } else if (categoryIndex < auditProfile.categories.length - 1) {
      // Show transition, then next category
      setShowTransition(true);
      setTimeout(() => {
        setShowTransition(false);
        setCategoryIndex(categoryIndex + 1);
        setQuestionIndex(0);
      }, 1800);
    } else {
      // All done — show results
      handleComplete();
    }
  };

  const goBack = () => {
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
    } else if (categoryIndex > 0) {
      const prevCat = auditProfile.categories[categoryIndex - 1];
      setCategoryIndex(categoryIndex - 1);
      setQuestionIndex(prevCat.questions.length - 1);
    }
  };

  const handleComplete = async () => {
    if (!user || !projectId) return;
    setSaving(true);

    const level = getMaturityLevel(globalScore);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("digital_maturity_audits").insert({
        project_id: projectId,
        client_id: user.id,
        audit_type: auditType,
        maturity_score: globalScore,
        maturity_level: level,
        category_scores: categoryScores,
        responses,
        completed_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Also store summary in project discovery_data
      const { data: project } = await supabase
        .from("projects")
        .select("discovery_data")
        .eq("id", projectId)
        .single();

      const existingData = (project?.discovery_data as Record<string, unknown>) || {};
      await supabase
        .from("projects")
        .update({
          discovery_data: {
            ...existingData,
            maturity_audit: {
              type: auditType,
              score: globalScore,
              level,
              category_scores: categoryScores,
              completed_at: new Date().toISOString(),
            },
          },
        })
        .eq("id", projectId);

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setShowResults(true);
    } catch (err) {
      console.error("Audit save error:", err);
      toast.error("Erreur lors de la sauvegarde. Vos réponses sont conservées.");
      setShowResults(true); // Show results anyway
    } finally {
      setSaving(false);
    }
  };

  const handleContinueToConversation = () => {
    navigate(`/client/projects/${projectId}/conversation`);
  };

  const handleSkipAudit = () => {
    navigate(`/client/projects/${projectId}/conversation`);
  };

  // ─── RESULTS SCREEN ──────────────────────────────────────────────
  if (showResults) {
    const level = getMaturityLevel(globalScore);
    const levelInfo = MATURITY_LABELS[level];

    return (
      <div className="min-h-screen bg-muted/30 flex flex-col">
        <div className="border-b bg-background px-4 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <Badge variant="outline" className="text-xs gap-1">
            <BarChart3 className="h-3 w-3" /> Résultats
          </Badge>
        </div>

        <div className="flex-1 flex items-start justify-center px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl space-y-6"
          >
            {/* Global score card */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${level === "satisfaisant" ? "from-emerald-500 to-green-400" : level === "ameliorer" ? "from-blue-500 to-cyan-400" : "from-orange-500 to-amber-400"}`} />
              <CardContent className="p-6 md:p-8 text-center">
                <div className="text-5xl mb-3">{levelInfo.emoji}</div>
                <h2 className="font-display text-2xl font-bold mb-1">
                  Votre score de maturité digitale
                </h2>
                <div className="text-5xl font-bold gradient-text my-4">{globalScore}%</div>
                <Badge className={`${levelInfo.bg} ${levelInfo.color} border text-sm px-4 py-1`}>
                  {levelInfo.label}
                </Badge>
                <p className="text-muted-foreground mt-4 max-w-md mx-auto">
                  {levelInfo.description}
                </p>
              </CardContent>
            </Card>

            {/* Category breakdown */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Détail par thématique
                </h3>
                <div className="space-y-4">
                  {auditProfile.categories.map((cat) => {
                    const cs = categoryScores[cat.key];
                    if (!cs) return null;
                    const catLevel = getMaturityLevel(cs.pct);
                    const catStyle = MATURITY_LABELS[catLevel];
                    return (
                      <div key={cat.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <span>{cat.emoji}</span> {cat.label}
                          </span>
                          <span className={`text-sm font-bold ${catStyle.color}`}>{cs.pct}%</span>
                        </div>
                        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cs.pct}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${cat.color}`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{cs.score}/{cs.max} points</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="border-0 shadow-lg border-primary/20">
              <CardContent className="p-6 text-center">
                <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-display font-semibold text-lg mb-2">
                  Prêt à transformer ces insights en action ?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Marc, notre consultant IA, a pris connaissance de votre diagnostic.
                  Il va adapter ses questions pour vous proposer les solutions les plus pertinentes.
                </p>
                <Button
                  onClick={handleContinueToConversation}
                  className="gradient-primary border-0 gap-2 text-base px-8 py-5"
                >
                  <Zap className="h-5 w-5" />
                  Démarrer l'échange avec Marc
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── TRANSITION SCREEN ────────────────────────────────────────────
  if (showTransition) {
    const nextCat = auditProfile.categories[categoryIndex + 1];
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col">
        <div className="border-b bg-background px-4 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <Badge variant="outline" className="text-xs">{answeredCount}/{totalQuestions}</Badge>
        </div>
        <div className="px-4 pt-4"><Progress value={progress} className="h-1.5" /></div>
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center max-w-md"
          >
            <div className="text-4xl mb-4">{nextCat?.emoji}</div>
            <p className="text-lg text-muted-foreground mb-2">
              {TRANSITION_MESSAGES[Math.min(categoryIndex, TRANSITION_MESSAGES.length - 1)]}
            </p>
            <h2 className="font-display text-2xl font-bold">
              {nextCat?.label}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">{nextCat?.encouragement}</p>

            {/* Show current category score */}
            <div className="mt-6">
              <CategoryScoreBadge
                score={categoryScores[currentCategory.key]?.score || 0}
                max={categoryScores[currentCategory.key]?.max || 12}
              />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── QUESTION SCREEN (main) ───────────────────────────────────────
  const selectedAnswer = currentQuestion ? responses[currentQuestion.id] : undefined;
  const globalQuestionIndex = auditProfile.categories
    .slice(0, categoryIndex)
    .reduce((s, c) => s + c.questions.length, 0) + questionIndex;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-4 py-3 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleSkipAudit} className="text-xs text-muted-foreground">
            Passer le diagnostic
          </Button>
          <Badge variant="outline" className="text-xs">
            {answeredCount}/{totalQuestions}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pt-4">
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Category tabs */}
      <div className="flex justify-center gap-1 py-3 px-4 overflow-x-auto">
        {auditProfile.categories.map((cat, i) => {
          const done = i < categoryIndex;
          const active = i === categoryIndex;
          const catScore = categoryScores[cat.key];
          return (
            <div
              key={cat.key}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span>{cat.emoji}</span>}
              <span className="hidden sm:inline">{cat.label}</span>
              {done && catScore && (
                <span className="text-[10px] opacity-70">{catScore.pct}%</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Question content */}
      <div className="flex-1 flex items-start justify-center px-4 py-6 md:py-10">
        <Card className="w-full max-w-xl border-0 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion?.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {/* Category + question number */}
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">
                    {currentCategory.emoji} {currentCategory.label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    Question {globalQuestionIndex + 1}/{totalQuestions}
                  </span>
                </div>

                {/* Question */}
                <h2 className="font-display text-xl font-bold mt-3 mb-1">
                  {currentQuestion?.question}
                </h2>
                {currentQuestion?.subtitle && (
                  <p className="text-sm text-muted-foreground mb-5">{currentQuestion.subtitle}</p>
                )}
                {!currentQuestion?.subtitle && <div className="mb-5" />}

                {/* Answer options */}
                <div className="space-y-3">
                  {currentQuestion?.answers.map((answer) => {
                    const isSelected = selectedAnswer === answer.key;
                    return (
                      <button
                        key={answer.key}
                        onClick={() => handleAnswer(answer.key)}
                        disabled={!!microFeedback}
                        className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md scale-[1.01]"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`shrink-0 flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold transition-colors ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {answer.key}
                          </span>
                          <span className="text-sm leading-relaxed">{answer.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Micro feedback */}
                <AnimatePresence>
                  {microFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 text-center"
                    >
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4" /> {microFeedback}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={categoryIndex === 0 && questionIndex === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Précédent
              </Button>
              {selectedAnswer && !microFeedback && (
                <Button onClick={advanceQuestion} className="gradient-primary border-0 gap-2">
                  Suivant <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
