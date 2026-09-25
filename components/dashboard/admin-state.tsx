import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import { Alert, AlertDescription, AlertAction } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertDescription className="break-words">{message}</AlertDescription>
      {onRetry && (
        <AlertAction>
          <Button variant="ghost" size="xs" onClick={onRetry}>
            重试
          </Button>
        </AlertAction>
      )}
    </Alert>
  );
}

export function AdminLoading({ label = "正在加载…" }: { label?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 shrink-0 animate-spin" />
        <span>{label}</span>
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between pb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 py-2">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AdminEmpty({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="grid size-10 place-items-center rounded-2xl bg-muted text-muted-foreground/60">
        <Inbox className="size-5" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {hint && <p className="max-w-sm text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
}