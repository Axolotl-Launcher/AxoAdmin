import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const count = new Intl.NumberFormat("zh-CN");

export function Distribution({ title, items, empty = "当前范围暂无数据。", limit = 8 }: {
  title: string;
  items: { label: string; value: number }[];
  empty?: string;
  limit?: number;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        {items.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p> : items.slice(0, limit).map((item) => (
          <div key={item.label} className="grid gap-1.5" title={`${item.label}: ${count.format(item.value)}`}>
            <div className="flex justify-between gap-4 text-xs">
              <span className="truncate">{item.label}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">{count.format(item.value)}</span>
            </div>
            <Progress value={Math.max((item.value / max) * 100, 2)} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
