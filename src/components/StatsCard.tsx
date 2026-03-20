import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  className?: string;
}

export function StatsCard({ label, value, icon: Icon, change, changeType = "neutral", className }: StatsCardProps) {
  return (
    <Card className={cn(
      "group relative overflow-hidden border border-border/40 bg-gradient-to-br from-card to-muted/20 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300",
      className
    )}>
      {/* Subtle gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-secondary/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardContent className="relative p-5 flex items-center gap-4">
        {Icon && (
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-primary shrink-0 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider truncate">{label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {change && (
              <span
                className={cn(
                  "text-xs font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full",
                  changeType === "up" && "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950",
                  changeType === "down" && "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950",
                  changeType === "neutral" && "text-muted-foreground bg-muted"
                )}
              >
                {changeType === "up" && <TrendingUp className="h-3 w-3" />}
                {changeType === "down" && <TrendingDown className="h-3 w-3" />}
                {change}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
