"use client";

import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { dimensionLabels, dimensionValue, formatCount, formatPercent, type StatsBreakdown } from "@/lib/updates/analytics";

export function AnalyticsBreakdown({ dimension, data, loading, onFilter }: { dimension: string; data?: StatsBreakdown; loading: boolean; onFilter: (key: string, value: string) => void }) {
  const visibleItems = data?.items.slice(0, 6) ?? [];
  const otherRequests = data ? Math.max(0, data.total_requests - visibleItems.reduce((sum, item) => sum + item.requests, 0)) : 0;

  return <Card className="min-w-0 gap-0 overflow-hidden rounded-xl py-0 shadow-none ring-border/70">
    <CardHeader className="flex flex-row items-baseline justify-between gap-3 px-6 pb-3 pt-5">
      <CardTitle className="text-sm font-semibold">{dimensionLabels[dimension] ?? dimension}</CardTitle>
      <span className="shrink-0 text-xs text-muted-foreground">请求数 · 占比</span>
    </CardHeader>
    <CardContent className="px-3 pb-3">
      {!data && loading ? <div className="grid gap-5 px-3 py-4">{[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-5 w-full" />)}</div>
        : !data || data.items.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">当前范围没有数据</p>
        : <div>{visibleItems.map((item) => <button
          key={item.value ?? "__unknown"}
          className="group relative grid w-full grid-cols-[minmax(0,1fr)_auto_2.75rem_0.75rem] items-center gap-2 overflow-hidden rounded-md py-3 pl-3 pr-2 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-default disabled:hover:bg-transparent"
          disabled={item.value === null}
          onClick={() => item.value !== null && onFilter(dimension, item.value)}
          title={item.value === null ? "该维度未采集或无法识别" : `筛选：${dimensionValue(dimension, item.value)}`}
        >
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-1 left-0 rounded-sm bg-chart-1/[0.07] transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${Math.min(100, data.total_requests > 0 ? item.requests / data.total_requests * 100 : 0)}%` }} />
          <span className="relative min-w-0 truncate">{dimensionValue(dimension, item.value)}</span>
          <span className="relative text-right font-medium tabular-nums">{formatCount(item.requests)}</span>
          <span className="relative text-right text-xs tabular-nums text-muted-foreground">{formatPercent(data.total_requests ? item.requests / data.total_requests : null)}</span>
          <ArrowUpRight aria-hidden="true" className="relative size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-disabled:invisible" />
        </button>)}
          {otherRequests > 0 && <p className="mx-3 mt-2 border-t border-border/60 pb-1 pt-3 text-xs text-muted-foreground">其余 {formatCount(otherRequests)} 次请求</p>}
        </div>}
    </CardContent>
  </Card>;
}
