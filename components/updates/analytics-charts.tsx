"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes } from "@/lib/updates/format";
import { formatCount, formatDuration, formatPercent, type StatsDashboard } from "@/lib/updates/analytics";

export const chartMetrics = {
  requests: { label: "请求数", format: formatCount },
  response_bytes: { label: "响应体流量", format: formatBytes },
  unique_ips: { label: "独立 IP", format: formatCount },
  error_rate: { label: "错误率", format: (value: number) => formatPercent(value) },
  avg_duration_ms: { label: "平均处理耗时", format: (value: number) => formatDuration(value) },
} as const;
export type ChartMetric = keyof typeof chartMetrics;

export function AnalyticsChart({ points, metric, loading }: { points: StatsDashboard["data"]["timeseries"]; metric: ChartMetric; loading: boolean }) {
  if (loading && points.length === 0) return <div className="flex h-64 items-end gap-3 px-6 pb-8 pt-12 sm:h-72" aria-label="正在加载请求趋势">{[40, 60, 44, 70, 56, 80, 62, 74, 48, 67, 80, 70].map((height, i) => <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${height}%` }} />)}</div>;
  const selected = chartMetrics[metric];
  const chartPoints = metric === "response_bytes" ? points.map((point) => ({ ...point, response_bytes: point.requests > 0 && point.response_byte_samples === 0 ? null : point.response_bytes })) : points;
  const dates = points.length > 1 && new Date(points.at(-1)!.time).getTime() - new Date(points[0].time).getTime() > 48 * 3600000;
  const tick = (value: string) => new Date(value).toLocaleString("zh-CN", dates ? { month: "2-digit", day: "2-digit" } : { hour: "2-digit", minute: "2-digit", hour12: false });
  return <ChartContainer className="h-64 w-full aspect-auto sm:h-72" config={{ [metric]: { label: selected.label, color: "var(--chart-1)" } }}>
    <AreaChart data={chartPoints} margin={{ left: 4, right: 12, top: 16, bottom: 0 }} accessibilityLayer>
      <defs><linearGradient id={`update-analysis-${metric}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.14} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.01} /></linearGradient></defs>
      <CartesianGrid vertical={false} strokeDasharray="3 3" />
      <XAxis dataKey="time" tickFormatter={tick} axisLine={false} tickLine={false} minTickGap={36} tickMargin={12} />
      <YAxis axisLine={false} tickLine={false} width={64} tickFormatter={selected.format} allowDecimals={metric === "error_rate" || metric === "avg_duration_ms"} tickMargin={8} />
      <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => new Date(String(value)).toLocaleString("zh-CN", { hour12: false })} formatter={(value) => <span className="font-mono font-medium tabular-nums">{value === null || value === undefined ? "未知" : selected.format(Number(value))}</span>} />} />
      <Area type="monotone" dataKey={metric} stroke="var(--chart-1)" strokeWidth={2} fill={`url(#update-analysis-${metric})`} dot={false} connectNulls={false} isAnimationActive={false} />
    </AreaChart>
  </ChartContainer>;
}
