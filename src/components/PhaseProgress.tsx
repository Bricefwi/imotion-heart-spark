import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const defaultPhases = [
  "Accueil",
  "Enjeux",
  "Vision",
  "Fonctions",
  "Technique",
  "Budget",
  "Synthèse",
];

interface PhaseProgressProps {
  currentPhase: number;
  totalPhases?: number;
  phases?: string[];
  phaseProgress?: number;
  compact?: boolean;
}

export function PhaseProgress({
  currentPhase,
  totalPhases = 7,
  phases,
  phaseProgress = 0,
  compact = false,
}: PhaseProgressProps) {
  const phaseNames = phases || defaultPhases;
  const progressPercent = ((currentPhase - 1 + phaseProgress / 100) / totalPhases) * 100;

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">
            Phase {currentPhase}/{totalPhases} : {phaseNames[currentPhase - 1]}
          </span>
          <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
        </div>
        <div className="flex gap-1">
          {phaseNames.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i + 1 < currentPhase
                  ? "gradient-primary"
                  : i + 1 === currentPhase
                  ? "bg-primary/40"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative mb-6">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2" />
        <motion.div
          className="absolute top-1/2 left-0 h-0.5 gradient-primary -translate-y-1/2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentPhase - 1) / (totalPhases - 1)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
        <div className="relative flex justify-between">
          {Array.from({ length: totalPhases }).map((_, i) => {
            const isCompleted = i < currentPhase - 1;
            const isCurrent = i === currentPhase - 1;
            return (
              <div key={i} className="flex flex-col items-center">
                <motion.div
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                    isCompleted
                      ? "gradient-primary text-primary-foreground border-transparent"
                      : isCurrent
                      ? "bg-background border-primary text-primary shadow-md"
                      : "bg-muted border-muted text-muted-foreground"
                  )}
                  initial={false}
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Labels */}
      <div className="flex justify-between">
        {phaseNames.map((name, i) => (
          <span
            key={name}
            className={cn(
              "text-[10px] text-center max-w-[60px] leading-tight",
              i < currentPhase - 1
                ? "text-primary font-medium"
                : i === currentPhase - 1
                ? "text-foreground font-semibold"
                : "text-muted-foreground"
            )}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
