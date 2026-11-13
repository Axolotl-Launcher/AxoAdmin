"use client";

import { useState } from "react";
import { Activity, ArrowDownToLine, Clock3, Filter, Globe2, RefreshCw, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { AdminError } from "@/components/dashboard/admin-state";
import { ToneBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsChart, chartMetrics, type ChartMetric } from "@/components/updates/analytics-charts";
import { AnalyticsBreakdown } from "@/components/updates/analytics-breakdown";
import { AnalyticsRequests } from "@/components/updates/analytics-requests";
import { useUpdateApi } from "@/lib/api/use-admin-data";
import { analyticsQuery, dimensionLabels, dimensionValue, formatCount, formatDuration, formatPercent, statsBreakdownResponseSchema, statsDashboardSchema, statsMetaSchema, statsStatusSchema, timeRange, type AnalyticsQuery } from "@/lib/updates/analytics";
import { formatBytes, formatDateTime } from "@/lib/updates/format";
import styles from "./analytics.module.css";

type Tab = "traffic" | "performance" | "clients" | "requests";
const dimensions: Record<Tab, string[]> = { traffic: ["route", "status_code", "country", "channel", "client_version", "app_cache", "referer_host", "device_type"], performance: ["status_code", "status_class", "error_code", "app_cache", "method", "http_version", "host", "tls_version"], clients: ["browser", "os", "device_type", "client_version", "platform", "country", "asn_org", "referer_host"], requests: ["route", "status_code", "country", "channel"] };
const ranges = [{ value: "1", label: "最近 1 小时" }, { value: "6", label: "最近 6 小时" }, { value: "24", label: "最近 24 小时" }, { value: "72", label: "最近 3 天" }, { value: "168", label: "最近 7 天" }, { value: "336", label: "最近 14 天" }];

export default function UpdateAnalytics() {
  const [range, setRange] = useState("24");
  const [query, setQuery] = useState<AnalyticsQuery>(() => timeRange(24));
  const [tab, setTab] = useState<Tab>("traffic");
  const [metric, setMetric] = useState<ChartMetric>("requests");
  const [filterKey, setFilterKey] = useState("route");
  const [filterValue, setFilterValue] = useState("");
  const [explore, setExplore] = useState("asn");
  const meta = useUpdateApi("/api/admin/updates/stats/meta", statsMetaSchema);
  const ready = Boolean(meta.data || meta.error);
  const params = analyticsQuery(query); if (!query.filters.length) params.set("scheduled", "true"); params.set("dimensions", dimensions[tab].join(",")); params.set("limit", "8");
  const path = `/api/admin/updates/stats?${params}`;
  const dashboard = useUpdateApi(path, statsDashboardSchema, ready && tab !== "requests");
  const status = useUpdateApi("/api/admin/updates/stats/status", statsStatusSchema, ready);
  const data = dashboard.data?.data;
  const overview = data?.overview;
  const committed = dashboard.data?.window;
  const loading = meta.loading || dashboard.loading;
  const extraParams = analyticsQuery(query); if (!query.filters.length) extraParams.set("scheduled", "true"); extraParams.set("dimension", explore); extraParams.set("limit", "8");
  const extraPath = `/api/admin/updates/stats/breakdown?${extraParams}`;
  const extra = useUpdateApi(extraPath, statsBreakdownResponseSchema, ready && Boolean(data) && !dashboard.loading && !data?.breakdowns[explore] && tab !== "requests");

  function addFilter(key: string, value: string) { if (!value.trim()) return; setQuery((current) => ({ ...current, ...(dashboard.data?.cache?.scheduled && committed ? { start: committed.start, end: committed.end } : {}), filters: [...current.filters.filter((item) => item.key !== key), { key, value: value.trim() }] })); setFilterValue(""); }
  function refresh() { setQuery((current) => ({ ...timeRange(Number(range)), filters: current.filters })); void status.reload(); }
  function exportSummary() { if (!dashboard.data) return; const blob = new Blob([JSON.stringify(dashboard.data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `update-analytics-${query.end.slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); }
  const metrics = [{ key: "requests" as const, title: "请求总数", value: overview ? formatCount(overview.requests) : "—", hint: overview ? `${overview.requests_per_second.toFixed(2)} 次 / 秒` : "源站收到的请求" }, { key: "unique_ips" as const, title: "独立 IP", value: overview ? formatCount(overview.unique_ips) : "—", hint: "IP 去重，非访客数" }, { key: "response_bytes" as const, title: "响应体流量", value: overview && overview.response_byte_samples ? formatBytes(overview.response_bytes) : "—", hint: "应用写出，不含代理压缩" }, { key: "error_rate" as const, title: "错误率", value: overview ? formatPercent(overview.error_rate) : "—", hint: overview ? `${formatCount(overview.status_4xx + overview.status_5xx)} 次 4xx / 5xx 响应` : "有状态码的请求样本" }];
  return <div className={`grid min-w-0 gap-5 ${styles.page}`}>
    <PageHeader title="数据分析" description="更新服务的请求、流量与客户端活动。">
      <Select value={range} onValueChange={(value) => { setRange(value); setQuery((current) => ({ ...timeRange(Number(value)), filters: current.filters })); }}><SelectTrigger className="w-40" aria-label="统计时间范围"><Clock3 className="size-3.5" /><SelectValue /></SelectTrigger><SelectContent>{ranges.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
      <Button variant="ghost" size="sm" disabled={!dashboard.data || loading || dashboard.committedPath !== path || tab === "requests"} onClick={exportSummary}><ArrowDownToLine />导出</Button>
      <Button variant="outline" size="sm" disabled={loading} onClick={refresh}><RefreshCw />{loading && data ? "更新中…" : "刷新"}</Button>
    </PageHeader>

    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><span className={`size-1.5 rounded-full ${status.data?.data.enabled ? "bg-emerald-500" : "bg-muted-foreground"}`} />{status.data ? status.data.data.enabled ? "正在采集" : "采集已暂停" : "连接更新服务"}</span><span>保留 {meta.data?.retention_days ?? 14} 天</span>{dashboard.data && <span>{dashboard.data.cache?.scheduled ? "定时统计更新于" : "更新于"} {formatDateTime(dashboard.data.generated_at)}{dashboard.data.cache?.scheduled ? dashboard.data.cache.stale ? " · 更新延迟" : " · 每小时维护" : ""}</span>}<span className="inline-flex items-center gap-1"><Globe2 className="size-3.5" />源站请求</span></div>

    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
      <form className="flex flex-wrap items-center gap-2" onSubmit={(event) => { event.preventDefault(); addFilter(filterKey, filterValue); }}><Filter className="mr-1 size-4 text-muted-foreground" /><Label htmlFor="analytics-filter-value" className="sr-only">筛选值</Label><Select value={filterKey} onValueChange={setFilterKey}><SelectTrigger className="w-40" aria-label="筛选维度"><SelectValue /></SelectTrigger><SelectContent>{(meta.data?.dimensions ?? Object.keys(dimensionLabels)).map((key) => <SelectItem key={key} value={key}>{dimensionLabels[key] ?? key}</SelectItem>)}</SelectContent></Select><Input id="analytics-filter-value" className="min-w-36 flex-1 sm:max-w-72" placeholder={filterKey === "route" ? "例如 /latest" : "输入精确匹配的值"} value={filterValue} onChange={(event) => setFilterValue(event.target.value)} /><Button variant="outline" size="sm" disabled={!filterValue.trim()}>添加筛选</Button>{query.filters.length > 0 && <Button variant="ghost" size="sm" onClick={() => setQuery((current) => ({ ...current, filters: [] }))} type="button">清除全部</Button>}</form>
      {query.filters.length > 0 && <div className="flex flex-wrap gap-2">{query.filters.map((filter) => <button key={filter.key} className="inline-flex max-w-full items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1 text-xs transition-colors hover:bg-muted" onClick={() => setQuery((current) => ({ ...current, filters: current.filters.filter((item) => item.key !== filter.key) }))}><span className="truncate">{dimensionLabels[filter.key]} = {dimensionValue(filter.key, filter.value)}</span><X className="size-3 shrink-0" /><span className="sr-only">移除筛选</span></button>)}</div>}
    </div>

    <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}><TabsList className="grid h-auto w-full grid-cols-2 justify-start bg-transparent p-0 sm:inline-flex"><TabsTrigger className="shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-chart-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none" value="traffic">流量概览</TabsTrigger><TabsTrigger className="shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-chart-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none" value="performance">性能与状态</TabsTrigger><TabsTrigger className="shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-chart-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none" value="clients">客户端与来源</TabsTrigger><TabsTrigger className="shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-chart-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none" value="requests">请求明细</TabsTrigger></TabsList></Tabs>

    {(dashboard.error || meta.error) && <AdminError message={dashboard.error ?? meta.error!} onRetry={() => { void meta.reload(); void dashboard.reload(); }} />}
    {status.error && <p className="text-xs text-muted-foreground">采集状态暂时不可用：{status.error}</p>}
    {loading && data && <p role="status" className="text-xs text-muted-foreground">正在加载新条件，以下保留上次成功的结果。</p>}
    {!loading && dashboard.error && data && dashboard.committedPath !== path && <p className="text-xs text-muted-foreground">新条件未能加载，以下仍为上次成功的结果。</p>}
    {tab === "requests" && <p className="text-xs text-muted-foreground">{formatDateTime(query.start)} — {formatDateTime(query.end)}</p>}

    {tab !== "requests" ? <div key={tab} className={`grid min-w-0 gap-5 ${styles.content}`} aria-busy={loading}>
      <Card className="min-w-0 gap-0 overflow-hidden rounded-xl py-0 shadow-none ring-border/70">
        <div className={`grid grid-cols-2 xl:grid-cols-4 ${styles.metricGrid}`}>{metrics.map((item) => <button key={item.key} data-selected={metric === item.key} className={`flex min-w-0 flex-col items-start px-5 py-5 text-left focus-visible:outline focus-visible:outline-ring sm:px-6 ${styles.metric}`} onClick={() => setMetric(item.key)} aria-pressed={metric === item.key}><span className="text-xs font-medium text-muted-foreground">{item.title}</span>{!data && loading ? <Skeleton className="my-2 h-9 w-24" /> : <span className="mt-2 block text-3xl font-semibold tracking-tight tabular-nums">{item.value}</span>}<span className="mt-2 block text-xs leading-relaxed text-muted-foreground">{item.hint}</span></button>)}</div>
        <div className="flex flex-wrap items-start justify-between gap-3 border-t border-border/70 px-5 pt-5 sm:px-6"><div><h2 className="text-sm font-semibold">{chartMetrics[metric].label}趋势</h2>{committed && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{formatDateTime(committed.start)} — {formatDateTime(committed.end)}</p>}</div>{committed && <span className="text-xs leading-relaxed text-muted-foreground">每 {committed.interval} · 本地时间</span>}</div>
        <div className={`px-2 pb-4 pt-2 sm:px-5 ${loading && data ? styles.refreshing : ""}`}><AnalyticsChart points={data?.timeseries ?? []} metric={metric} loading={loading} /></div>
        {!loading && overview?.requests === 0 && <p className="border-t px-5 py-3 text-sm text-muted-foreground">{query.filters.length ? "没有匹配的请求，试试调整筛选条件。" : "当前时间范围暂无请求，采集到流量后会显示在这里。"}</p>}
      </Card>

      {tab === "performance" && <Card className="gap-4 rounded-xl shadow-none ring-border/70"><CardHeader><CardTitle className="text-sm font-semibold">应用处理性能</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-5 lg:grid-cols-5">{[["平均", overview?.avg_duration_ms], ["P50", overview?.latency.p50_ms], ["P90", overview?.latency.p90_ms], ["P95", overview?.latency.p95_ms], ["P99", overview?.latency.p99_ms]].map(([label, value]) => <div key={String(label)}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold tabular-nums">{formatDuration(typeof value === "number" ? value : null)}</p></div>)}</div><div className="mt-5 flex flex-wrap items-center gap-4 border-t pt-4 text-xs text-muted-foreground"><Button size="sm" variant="outline" onClick={() => setMetric("avg_duration_ms")}><Activity />查看耗时趋势</Button><span>缓存命中率 {formatPercent(overview?.app_cache_hit_rate ?? null)}</span><span>限流 {formatCount(overview?.rate_limited_requests ?? 0)} 次</span><span>拒绝访问 {formatCount(overview?.access_denied_requests ?? 0)} 次</span></div></CardContent></Card>}

      {tab === "clients" && overview && <div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><ToneBadge tone="outline">{formatCount(overview.unique_user_agents)} 种 User-Agent</ToneBadge><ToneBadge tone="outline">{formatCount(overview.bot_requests)} 次机器人请求</ToneBadge>{!meta.data?.capabilities.geoip_city && <span>未配置地理库，国家与城市可能显示为未知。</span>}</div>}

      <section className="grid min-w-0 gap-3" aria-labelledby="analytics-distributions-title"><div className="flex items-baseline justify-between gap-3"><h2 id="analytics-distributions-title" className="text-sm font-semibold">请求分布</h2><p className="text-xs text-muted-foreground">点击条目进一步筛选</p></div><div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">{dimensions[tab].filter((key) => !["tls_version", "host"].includes(key)).map((dimension) => <AnalyticsBreakdown key={dimension} dimension={dimension} data={data?.breakdowns[dimension]} loading={loading} onFilter={addFilter} />)}</div></section>
      <div className="grid gap-3"><div className="flex flex-wrap items-center gap-3"><h2 className="text-sm font-medium">探索其他维度</h2><Select value={explore} onValueChange={setExplore}><SelectTrigger className="w-44" aria-label="探索统计维度"><SelectValue /></SelectTrigger><SelectContent>{(meta.data?.dimensions ?? Object.keys(dimensionLabels)).map((key) => <SelectItem key={key} value={key}>{dimensionLabels[key] ?? key}</SelectItem>)}</SelectContent></Select></div>{extra.error ? <AdminError message={extra.error} onRetry={() => void extra.reload()} /> : <div className="max-w-xl"><AnalyticsBreakdown dimension={explore} data={data?.breakdowns[explore] ?? (extra.committedPath === extraPath ? extra.data?.data : undefined)} loading={loading || extra.loading} onFilter={addFilter} /></div>}</div>
    </div> : ready && <AnalyticsRequests key={JSON.stringify(query)} query={query} onFilter={addFilter} />}

    <div className="flex flex-wrap justify-between gap-2 border-t pt-4 text-xs leading-relaxed text-muted-foreground"><p>仅统计 /latest 与 /api/*，不含下载服务器流量。旧记录的未采集指标显示为未知。</p><p>{status.data?.data.collector ? `队列 ${formatCount(status.data.data.collector.queue_length)} · 丢弃 ${formatCount(status.data.data.collector.dropped)}` : "数据异步写入，可能有短暂延迟。"}</p></div>
  </div>;
}
