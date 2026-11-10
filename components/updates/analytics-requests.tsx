"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminError } from "@/components/dashboard/admin-state";
import { ToneBadge } from "@/components/dashboard/status-badge";
import { useUpdateApi } from "@/lib/api/use-admin-data";
import { analyticsQuery, dimensionValue, requestDimensionValue, formatDuration, statsRequestsSchema, type AnalyticsQuery, type StatsRequest } from "@/lib/updates/analytics";
import { formatBytes, formatDateTime } from "@/lib/updates/format";

export function AnalyticsRequests({ query, onFilter }: { query: AnalyticsQuery; onFilter: (key: string, value: string) => void }) {
  const [pagination, setPagination] = useState<{ cursors: (string | null)[]; index: number }>({ cursors: [null], index: 0 });
  const [selected, setSelected] = useState<StatsRequest | null>(null);
  const params = analyticsQuery(query);
  params.set("limit", "25");
  const cursor = pagination.cursors[pagination.index];
  if (cursor) { params.set("cursor", cursor); params.delete("start"); params.delete("end"); }
  const path = `/api/admin/updates/stats/requests?${params}`;
  const resource = useUpdateApi(path, statsRequestsSchema);
  const page = resource.data?.data;
  const committedCursor = resource.committedPath ? new URL(resource.committedPath, "http://localhost").searchParams.get("cursor") : null;
  const committedIndex = Math.max(0, pagination.cursors.indexOf(committedCursor));
  const current = resource.committedPath === path;
  return <Card className="min-w-0 gap-0 overflow-hidden rounded-xl py-0 shadow-none ring-border/70" aria-busy={resource.loading}>
    <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-4"><CardTitle>请求明细</CardTitle><span role="status" className="text-xs text-muted-foreground">{resource.loading ? "正在更新…" : `第 ${committedIndex + 1} 页`}</span></CardHeader>
    {resource.error && <div className="grid gap-2 p-4"><AdminError message={resource.error} onRetry={() => void resource.reload()} /><Button className="justify-self-start" variant="ghost" size="sm" onClick={() => { if (pagination.index === 0) void resource.reload(); else setPagination({ cursors: [null], index: 0 }); }}>从第一页重新加载</Button></div>}
    {!page && resource.loading ? <div className="grid gap-4 p-5">{[0, 1, 2, 3, 4].map((row) => <Skeleton key={row} className="h-8 w-full" />)}</div>
      : page?.items.length === 0 ? <p className="px-5 py-14 text-center text-sm text-muted-foreground">当前时间范围与筛选条件下没有请求记录。</p>
      : page && <Table className="[&_th:first-child]:pl-5 [&_td:first-child]:pl-5 [&_th:last-child]:pr-5 [&_td:last-child]:pr-5"><TableHeader><TableRow><TableHead>时间</TableHead><TableHead>状态</TableHead><TableHead>接口</TableHead><TableHead>客户端 IP</TableHead><TableHead>国家 / 地区</TableHead><TableHead className="text-right">耗时</TableHead><TableHead className="text-right">响应体</TableHead></TableRow></TableHeader><TableBody>
        {page.items.map((item) => <TableRow key={`${item.occurred_at}:${item.id}`}>
          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(item.occurred_at)}</TableCell>
          <TableCell><ToneBadge tone={item.status_code === null ? "neutral" : item.status_code >= 500 ? "red" : item.status_code >= 400 ? "amber" : "green"}>{item.status_code ?? "未知"}</ToneBadge></TableCell>
          <TableCell><button className="max-w-64 truncate text-left font-mono text-xs underline-offset-4 hover:underline" onClick={() => setSelected(item)}>{item.method ?? "—"} {item.route}</button></TableCell>
          <TableCell><button className="font-mono text-xs underline-offset-4 hover:underline disabled:text-muted-foreground" disabled={!item.client_ip} onClick={() => item.client_ip && onFilter("client_ip", item.client_ip)}>{item.client_ip ?? "未知"}</button></TableCell>
          <TableCell className="whitespace-nowrap text-xs">{dimensionValue("country", item.country)}</TableCell>
          <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">{formatDuration(item.duration_ms)}</TableCell>
          <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">{item.response_bytes === null ? "—" : formatBytes(item.response_bytes)}</TableCell>
        </TableRow>)}
      </TableBody></Table>}
    <CardContent className="flex flex-col items-start justify-between gap-3 border-t px-5 py-4 sm:flex-row sm:items-center"><p className="text-xs text-muted-foreground">点击接口查看详情，点击 IP 进一步筛选。</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={resource.loading || (current && pagination.index === 0) || !resource.data} onClick={() => setPagination((value) => ({ ...value, index: current ? Math.max(0, value.index - 1) : committedIndex }))}><ChevronLeft />{current ? "上一页" : "返回已显示页"}</Button><Button variant="outline" size="sm" disabled={resource.loading || !current || !page?.has_more || !page.next_cursor} onClick={() => page?.next_cursor && setPagination((value) => ({ cursors: [...value.cursors.slice(0, value.index + 1), page.next_cursor], index: value.index + 1 }))}>下一页<ChevronRight /></Button></div></CardContent>
    <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>请求详情</DialogTitle><DialogDescription>{selected ? formatDateTime(selected.occurred_at) : ""}</DialogDescription></DialogHeader>{selected && <dl className="grid gap-4 sm:grid-cols-2">{Object.entries({ "接口": selected.route, "客户端 IP": selected.client_ip, "状态码": selected.status_code, "处理耗时": formatDuration(selected.duration_ms), "更新渠道": selected.channel, "客户端版本": selected.client_version, "目标版本": selected.target_version, "更新平台": selected.platform, "国家 / 地区": dimensionValue("country", selected.country), "城市": selected.city, "网络运营商": selected.asn_org, "ASN": selected.asn, "客户端": requestDimensionValue(selected, "browser"), "操作系统": requestDimensionValue(selected, "os"), "设备": dimensionValue("device_type", selected.device_type), "应用缓存": dimensionValue("app_cache", selected.app_cache), "HTTP 版本": selected.http_version, "主机": selected.host, "来源 / 引荐域名": requestDimensionValue(selected, "referer_host"), "响应内容类型": requestDimensionValue(selected, "content_type"), "错误类型": requestDimensionValue(selected, "error_code"), "包含更新器": requestDimensionValue(selected, "include_updater"), "包含撤销版本": requestDimensionValue(selected, "include_revoked"), "User-Agent": selected.user_agent }).map(([label, value]) => <div key={label} className={label === "User-Agent" ? "sm:col-span-2" : ""}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-all text-sm">{value ?? "未知"}</dd></div>)}</dl>}</DialogContent></Dialog>
  </Card>;
}
