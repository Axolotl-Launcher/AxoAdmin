import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export type Tone = "neutral" | "green" | "amber" | "red" | "sky" | "violet" | "outline";

const variantMap: Record<Tone, "secondary" | "success" | "warning" | "destructive" | "info" | "violet" | "outline"> = {
  neutral: "secondary",
  green: "success",
  amber: "warning",
  red: "destructive",
  sky: "info",
  violet: "violet",
  outline: "outline",
};

export function ToneBadge({ tone, className, children }: { tone: Tone; className?: string; children: ReactNode }) {
  return (
    <Badge variant={variantMap[tone]} className={className}>
      {children}
    </Badge>
  );
}