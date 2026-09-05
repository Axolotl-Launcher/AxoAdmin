"use client";

import { Activity, CalendarDays, Database, PackagePlus, RefreshCw, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { AdminEmpty, AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminData } from "@/lib/api/use-admin-data";
import { telemetryActivitySchema, telemetryDistributionsSchema, telemetryOverviewSchema } from "@/lib/api/schemas";

const ranges = ["7d", "30d", "90d", "365d"] as const;
const number = new Intl.NumberFormat("zh-CN");
const format = (value: number) => number.format(value);

function Distribution({ title, items }: { title: string; items: { label: string; value: number }[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        {items.slice(0, 8).map((item) => (
          <div key={item.label} className="grid gap-1.5" title={`${item.label}: ${format(item.value)}`}>
            <div className="flex justify-between gap-4 text-xs">
              <span className="truncate">{item.label}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">{format(item.value)}</span>
            </div>
            <div className="h-2 rounded-2xl bg-muted">
              <div className="h-2 rounded-2xl bg-primary" style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

type TrendPoint = { day: string; activeInstallations: number; newInstallations: number };

const chart = { width: 720, height: 280, top: 16, right: 18, bottom: 42, left: 54 } as const;

function chartStep(maximum: number) {
  const roughStep = Math.max(1, maximum / 4);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceStep = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceStep * magnitude;
}

function shortDay(day: string) {
  const [, month, date] = day.split("-");
  return month && date ? `${Number(month)}/${Number(date)}` : day;
}

function Trend({ points }: { points: TrendPoint[] }) {
  const data = useMemo(() => {
    const maximum = Math.max(...points.flatMap((point) => [point.activeInstallations, point.newInstallations]), 0);
    const step = chartStep(maximum);
    const maximumY = Math.max(step, Math.ceil(maximum / step) * step);
    const tickCount = Math.round(maximumY / step);
    const plotWidth = chart.width - chart.left - chart.right;
    const plotHeight = chart.height - chart.top - chart.bottom;
    const x = (index: number) => chart.left + (points.length < 2 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
    const y = (value: number) => chart.top + plotHeight - (value / maximumY) * plotHeight;
    const coordinates = points.map((point, index) => ({ point, x: x(index), activeY: y(point.activeInstallations), newY: y(point.newInstallations) }));
    const line = (key: "activeY" | "newY") => coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point[key].toFixed(1)}`).join(" ");
    const desiredXTickCount = Math.min(5, points.length);
    const xTickIndices = desiredXTickCount < 2
      ? points.length === 1 ? [0] : []
      : [...new Set(Array.from({ length: desiredXTickCount }, (_, index) => Math.round((index * (points.length - 1)) / (desiredXTickCount - 1))))];
    return {
      activeLine: line("activeY"),
      coordinates,
      newLine: line("newY"),
      plotHeight,
      plotWidth,
      xTickIndices,
      yTicks: Array.from({ length: tickCount + 1 }, (_, index) => index * step),
      y,
    };
  }, [points]);

  return (
    <Card>
      <CardHeader><CardTitle>每日使用者趋势</CardTitle></CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <AdminEmpty label="当前范围没有趋势数据。" />
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">按 UTC 自然日统计；将鼠标悬停在数据点上可查看当天数值。</p>
            <div className="overflow-x-auto pb-2">
              <svg className="h-auto min-w-[620px] w-full" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="每日活跃安装与新增安装趋势图">
                <title>每日活跃安装与新增安装趋势</title>
                <desc>蓝线表示活跃安装，绿线表示新增安装。</desc>
                {data.yTicks.map((value) => {
                  const tickY = data.y(value);
                  return (
                    <g key={value}>
                      <line x1={chart.left} x2={chart.left + data.plotWidth} y1={tickY} y2={tickY} className="stroke-border" strokeWidth="1" />
                      <text x={chart.left - 8} y={tickY} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground text-[10px]">{format(value)}</text>
                    </g>
                  );
                })}
                <line x1={chart.left} x2={chart.left} y1={chart.top} y2={chart.top + data.plotHeight} className="stroke-muted-foreground/50" strokeWidth="1" />
                <line x1={chart.left} x2={chart.left + data.plotWidth} y1={chart.top + data.plotHeight} y2={chart.top + data.plotHeight} className="stroke-muted-foreground/50" strokeWidth="1" />
                {data.xTickIndices.map((index) => {
                  const point = data.coordinates[index];
                  return (
                    <g key={point.point.day}>
                      <line x1={point.x} x2={point.x} y1={chart.top + data.plotHeight} y2={chart.top + data.plotHeight + 5} className="stroke-muted-foreground/50" strokeWidth="1" />
                      <text x={point.x} y={chart.height - 16} textAnchor="middle" className="fill-muted-foreground text-[10px]">{shortDay(point.point.day)}</text>
                    </g>
                  );
                })}
                <path d={data.activeLine} fill="none" className="stroke-sky-500" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                <path d={data.newLine} fill="none" className="stroke-emerald-500" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                {data.coordinates.map(({ point, x, activeY, newY }) => (
                  <g key={point.day}>
                    <title>{`${point.day}（UTC）：活跃安装 ${format(point.activeInstallations)}，新增安装 ${format(point.newInstallations)}`}</title>
                    <circle cx={x} cy={activeY} r="8" fill="transparent" />
                    <circle cx={x} cy={newY} r="8" fill="transparent" />
                    <circle cx={x} cy={activeY} r="3" className="fill-sky-500 stroke-background" strokeWidth="2" />
                    <circle cx={x} cy={newY} r="3" className="fill-emerald-500 stroke-background" strokeWidth="2" />
                  </g>
                ))}
              </svg>
            </div>
          </>
        )}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground" aria-label="图表图例">
          {[["活跃安装", "bg-sky-500"], ["新增安装", "bg-emerald-500"]].map(([label, color]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`h-0.5 w-4 rounded-full ${color}`} />
              {label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Telemetry() {
  const [range, setRange] = useState<(typeof ranges)[number]>("30d");
  const query = `?range=${range}`;
  const overview = useAdminData(`/api/admin/telemetry/overview${query}`, telemetryOverviewSchema);
  const activity = useAdminData(`/api/admin/telemetry/activity${query}`, telemetryActivitySchema);
  const distributions = useAdminData(`/api/admin/telemetry/distributions${query}`, telemetryDistributionsSchema);
  const reload = () => { overview.reload(); activity.reload(); distributions.reload(); };
  const metric = overview.data?.metrics;
  const cards = useMemo(() => metric ? [
    ["累计安装", metric.totalInstallations.value, metric.totalInstallations.label, Database, "green"],
    ["日活跃安装", metric.dau.value, metric.dau.label, Activity, "blue"],
    ["周活跃安装", metric.wau.value, metric.wau.label, CalendarDays, "blue"],
    ["月活跃安装", metric.mau.value, metric.mau.label, Users, "blue"],
    ["今日新增安装", metric.newInstallationsToday.value, metric.newInstallationsToday.label, PackagePlus, "green"],
  ] as const : [], [metric]);
  return (
    <div className="grid gap-4">
      <PageHeader title="遥测中心" description="查看主动同意遥测的匿名安装、活跃度与运行环境分布。">
        <Select value={range} onValueChange={(value) => setRange(value as (typeof ranges)[number])}>
          <SelectTrigger className="w-28" aria-label="时间范围">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ranges.map((value) => <SelectItem key={value} value={value}>{value.replace("d", " 天")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button aria-label="刷新遥测" variant="outline" size="icon-sm" onClick={reload}>
          <RefreshCw className="size-4" />
        </Button>
      </PageHeader>
      {(overview.loading || activity.loading || distributions.loading) && <AdminLoading label="正在加载遥测数据…" />}
      {(overview.error || activity.error || distributions.error) && (
        <AdminError message={overview.error || activity.error || distributions.error || "遥测数据加载失败。"} onRetry={reload} />
      )}
      {overview.data && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{cards.map(([label, value, detail, Icon, tone]) => <StatCard key={label} label={label} value={format(value)} detail={detail} icon={Icon} tone={tone} />)}</div>}
      {activity.data && <Trend points={activity.data.points} />}
      {distributions.data && <div className="grid gap-4 lg:grid-cols-3"><Distribution title="版本使用情况" items={distributions.data.versions} /><Distribution title="平台分布" items={distributions.data.platforms} /><Distribution title="架构分布" items={distributions.data.architectures} /></div>}
      {!overview.loading && !overview.error && !overview.data && <AdminEmpty label="暂无遥测数据。" />}
    </div>
  );
}
