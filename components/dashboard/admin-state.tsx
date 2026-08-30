import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AdminError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="border-destructive/25 bg-destructive/5">
      <CardContent className="flex items-center gap-3 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        <span className="min-w-0 break-words">{message}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" className="ml-auto shrink-0" onClick={onRetry}>
            重试
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminLoading({ label = "正在加载…" }: { label?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 shrink-0 animate-spin" />
        {label}
      </CardContent>
    </Card>
  );
}

export function AdminEmpty({ label, hint }: { label: string; hint?: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-1.5 py-10 text-center">
        <Inbox className="size-5 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground/60">{hint}</p>}
      </CardContent>
    </Card>
  );
}