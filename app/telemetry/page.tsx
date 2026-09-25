"use client";

import { Activity, CalendarDays, Database, PackagePlus, RefreshCw, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Distribution } from "@/components/dashboard/distribution";
import { AdminEmpty, AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminData } from "@/lib/api/use-admin-data";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  type ChartConfig,
} from "@/components/ui/chart";
import { telemetryActivitySchema, telemetryDistributionsSchema, telemetryOverviewSchema } from "@/lib/api/schemas";

const ranges = ["7d", "30d", "90d", "365d"] as const;
const number = new Intl.NumberFormat("zh-CN");
const format = (value: number) => number.format(value);

type TrendPoint = { day: string; activeInstallations: number; newInstallations: number };

const trendChartConfig = {
  activeInstallations: {
    label: "活跃安装",
    color: "var(--chart-1)",
  },
  newInstallations: {
    label: "新增安装",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function shortDay(day: string) {
  const [, month, date] = day.split("-");
  return month && date ? `${Number(month)}/${Number(date)}` : day;
}

function Trend({ points }: { points: TrendPoint[] }) {
  const settled = points.filter((point) => point.day < new Date().toISOString().slice(0, 10));

  return (
    <Card>
      <CardHeader>
        <CardTitle>每日使用者趋势</CardTitle>
        <CardDescription>按 UTC 自然日统计；本日数据将在次日结算后显示，悬浮可查看当日对比。</CardDescription>
      </CardHeader>
      <CardContent>
        {settled.length === 0 ? (
          <AdminEmpty label="当前范围没有已结算趋势数据。" />
        ) : (
          <ChartContainer config={trendChartConfig} className="h-[280px] w-full">
            <LineChart data={settled.map((point) => ({ ...point, day: shortDay(point.day) }))}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="activeInstallations"
                stroke="var(--color-activeInstallations)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="newInstallations"
                stroke="var(--color-newInstallations)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
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

      {overview.data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cards.map(([label, value, detail, Icon, tone]) => (
            <StatCard key={label} label={label} value={format(value)} detail={detail} icon={Icon} tone={tone} />
          ))}
        </div>
      )}

      {activity.data && <Trend points={activity.data.points} />}

      {distributions.data && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Distribution title="版本使用情况" items={distributions.data.versions} />
          <Distribution title="平台分布" items={distributions.data.platforms} />
          <Distribution title="架构分布" items={distributions.data.architectures} />
        </div>
      )}

      {!overview.loading && !overview.error && !overview.data && <AdminEmpty label="暂无遥测数据。" />}
    </div>
  );
}
