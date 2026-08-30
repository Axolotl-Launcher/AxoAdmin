import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AdminError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <Card className="border-red-500/20 bg-red-500/5"><div className="flex items-center gap-3 text-sm text-red-700 dark:text-red-300"><AlertCircle className="size-4"/><span>{message}</span>{onRetry && <button className="ml-auto font-medium underline" onClick={onRetry}>重试</button>}</div></Card>;
}
export function AdminLoading({ label = "正在加载…" }: { label?: string }) {
  return <Card className="text-sm text-muted-foreground">{label}</Card>;
}
export function AdminEmpty({ label }: { label: string }) {
  return <Card className="border-dashed text-center text-sm text-muted-foreground">{label}</Card>;
}
