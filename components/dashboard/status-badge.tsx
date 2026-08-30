import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type Tone = "neutral" | "green" | "amber" | "red" | "sky" | "violet" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  red: "bg-red-500/10 text-red-700 dark:text-red-400",
  sky: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  outline: "border-border text-foreground",
};

export function ToneBadge({ tone, className, children }: { tone: Tone; className?: string; children: ReactNode }) {
  return (
    <Badge variant={tone === "outline" ? "outline" : "default"} className={cn(tones[tone], className)}>
      {children}
    </Badge>
  );
}