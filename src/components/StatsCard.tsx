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
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardContent className="p-5 flex items-center gap-4">
        {Icon && (
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-primary shrink-0">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold font-display">{value}</p>
            {change && (
              <span
                className={cn(
                  "text-xs font-medium flex items-center gap-0.5",
                  changeType === "up" && "text-green-600",
                  changeType === "down" && "text-destructive",
                  changeType === "neutral" && "text-muted-foreground"
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
