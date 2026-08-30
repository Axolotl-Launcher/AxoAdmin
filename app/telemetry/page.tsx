"use client";

import { Activity, AlertTriangle, Database, Layers, RefreshCw, Server, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { AdminEmpty, AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminData } from "@/lib/api/use-admin-data";
import { telemetryActivitySchema, telemetryDistributionsSchema, telemetryOverviewSchema } from "@/lib/api/schemas";

const ranges = ["7d", "30d", "90d", "365d"] as const;
const number = new Intl.NumberFormat("zh-CN");
const format = (value: number) => number.format(value);

function Distribution({ title, items }: { title: string; items: { label: string; value: number }[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><div className="space-y-3">{items.slice(0, 8).map((item) => <div key={item.label}><div className="mb-1 flex justify-between text-xs"><span className="truncate">{item.label}</span><span className="text-muted-foreground">{format(item.value)}</span></div><div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }} /></div></div>)}</div></Card>;
}

function Trend({ points }: { points: { day: string; activeInstallations: number; newInstallations: number; errorOccurrences: number }[] }) {
  const max = Math.max(...points.flatMap((point) => [point.activeInstallations, point.newInstallations, point.errorOccurrences]), 1);
  return <Card><CardHeader><CardTitle>每日趋势</CardTitle></CardHeader>{points.length === 0 ? <AdminEmpty label="当前范围没有趋势数据。" /> : <div className="flex h-52 items-end gap-1 overflow-hidden">{points.map((point) => <div key={point.day} className="group flex min-w-2 flex-1 items-end gap-px" title={`${point.day}: 活跃 ${point.activeInstallations}，新增 ${point.newInstallations}，错误 ${point.errorOccurrences}`}><div className="w-1/3 rounded-t bg-sky-500" style={{ height: `${Math.max(point.activeInstallations / max * 100, 2)}%` }} /><div className="w-1/3 rounded-t bg-emerald-500" style={{ height: `${Math.max(point.newInstallations / max * 100, 2)}%` }} /><div className="w-1/3 rounded-t bg-amber-500" style={{ height: `${Math.max(point.errorOccurrences / max * 100, 2)}%` }} /></div>)}</div>}<div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground"><span><i className="mr-1 inline-block size-2 rounded-full bg-sky-500" />活跃安装</span><span><i className="mr-1 inline-block size-2 rounded-full bg-emerald-500" />新增安装</span><span><i className="mr-1 inline-block size-2 rounded-full bg-amber-500" />错误次数</span></div></Card>;
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
    ["累计安装", metric.totalInstallations.value, "全部时间", Database, "green"], ["日活跃安装", metric.dau.value, "UTC 自然日", Activity, "blue"], ["错误发生次数", metric.errorOccurrences.value, `最近 ${range}`, AlertTriangle, "gold"], ["不同错误组", metric.distinctErrorGroups.value, `最近 ${range}`, Layers, "default"],
  ] as const : [], [metric, range]);
  return <div><PageHeader title="遥测中心" description="查看主动同意遥测的匿名安装、活跃度与运行质量。" children={<div className="flex gap-2"><Select value={range} onValueChange={(value) => setRange(value as (typeof ranges)[number])}><SelectTrigger className="w-28" aria-label="时间范围"><SelectValue /></SelectTrigger><SelectContent>{ranges.map((value) => <SelectItem key={value} value={value}>{value.replace("d", " 天")}</SelectItem>)}</SelectContent></Select><Button aria-label="刷新遥测" variant="outline" size="icon" onClick={reload}><RefreshCw className="size-4" /></Button></div>} />
    {(overview.loading || activity.loading || distributions.loading) && <AdminLoading label="正在加载遥测数据…" />}
    {(overview.error || activity.error || distributions.error) && <AdminError message={overview.error || activity.error || distributions.error || "遥测数据加载失败。"} onRetry={reload} />}
    {overview.data && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, detail, Icon, tone]) => <StatCard key={label} label={label} value={format(value)} detail={detail} icon={Icon} tone={tone} />)}</div>}
    {activity.data && <div className="mt-6"><Trend points={activity.data.points} /></div>}
    {distributions.data && <div className="mt-6 grid gap-4 lg:grid-cols-3"><Distribution title="版本分布" items={distributions.data.versions} /><Distribution title="平台分布" items={distributions.data.platforms} /><Distribution title="架构分布" items={distributions.data.architectures} /></div>}
    {!overview.loading && !overview.error && !overview.data && <AdminEmpty label="暂无遥测数据。" />}
  </div>;
}
