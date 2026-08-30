import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const tones = {
  default: "bg-muted text-foreground",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  gold: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  blue: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
} as const;

export function StatCard({ label, value, detail, icon: Icon, tone = "default" }: { label: string; value: string; detail: string; icon: LucideIcon; tone?: keyof typeof tones }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className={cn("grid size-9 shrink-0 place-items-center rounded-2xl", tones[tone])}>
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}