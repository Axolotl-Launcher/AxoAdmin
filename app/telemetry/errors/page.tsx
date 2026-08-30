"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { AdminEmpty, AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { ToneBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdminData } from "@/lib/api/use-admin-data";
import { telemetryDetailSchema, telemetryErrorsSchema, telemetrySampleSchema } from "@/lib/api/schemas";

const ranges = ["7d", "30d", "90d", "365d"] as const;
const sorts = [["lastSeen", "最近发生"], ["firstSeen", "首次发生"], ["occurrences", "发生次数"], ["installations", "影响安装"]] as const;
const date = (value: string) => new Date(value).toLocaleString("zh-CN", { timeZone: "UTC" });

function SampleBadge({ hasSample }: { hasSample: boolean }) {
  return hasSample ? <ToneBadge tone="green">有样本</ToneBadge> : <ToneBadge tone="outline">无样本</ToneBadge>;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default function Errors() {
  const [range, setRange] = useState<(typeof ranges)[number]>("30d");
  const [search, setSearch] = useState("");
  const [querySearch, setQuerySearch] = useState("");
  const [version, setVersion] = useState("");
  const [platform, setPlatform] = useState("");
  const [errorType, setErrorType] = useState("");
  const [hasSample, setHasSample] = useState("");
  const [sort, setSort] = useState("lastSeen");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => { setQuerySearch(search); setPage(1); }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useMemo(() => {
    const params = new URLSearchParams({ range, page: String(page), pageSize: "25", sort, direction: "desc" });
    if (querySearch) params.set("search", querySearch);
    if (version) params.set("version", version);
    if (platform) params.set("platform", platform);
    if (errorType) params.set("errorType", errorType);
    if (hasSample) params.set("hasSample", hasSample);
    return `?${params}`;
  }, [errorType, hasSample, page, platform, querySearch, range, sort, version]);
  const errors = useAdminData(`/api/admin/telemetry/errors${query}`, telemetryErrorsSchema);
  const detail = useAdminData(selected ? `/api/admin/telemetry/errors/${encodeURIComponent(selected)}` : "/api/admin/telemetry/errors", telemetryDetailSchema, Boolean(selected));
  const sample = useAdminData(selected ? `/api/admin/telemetry/errors/${encodeURIComponent(selected)}/sample` : "/api/admin/telemetry/errors", telemetrySampleSchema, Boolean(selected));
  const selectAll = (value: string) => (value === "all" ? "" : value);
  const totalPages = errors.data ? Math.max(1, errors.data.totalPages) : 1;
  return (
    <div className="grid gap-4">
      <PageHeader title="错误分析" description="聚合查看遥测错误组、发生趋势和错误样本。">
        <Select value={range} onValueChange={(value) => { setRange(value as (typeof ranges)[number]); setPage(1); }}>
          <SelectTrigger className="w-28" aria-label="时间范围">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ranges.map((value) => <SelectItem key={value} value={value}>{value.replace("d", " 天")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-32" aria-label="排序方式">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sorts.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-52 flex-1 basis-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索错误信息" className="pl-8" aria-label="搜索错误信息" />
          </div>
          <Select value={version} onValueChange={(value) => { setVersion(selectAll(value)); setPage(1); }}>
            <SelectTrigger className="w-40" aria-label="版本">
              <SelectValue placeholder="全部版本" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部版本</SelectItem>
              {errors.data?.filters.versions.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={platform} onValueChange={(value) => { setPlatform(selectAll(value)); setPage(1); }}>
            <SelectTrigger className="w-40" aria-label="平台">
              <SelectValue placeholder="全部平台" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部平台</SelectItem>
              {errors.data?.filters.platforms.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={errorType} onValueChange={(value) => { setErrorType(selectAll(value)); setPage(1); }}>
            <SelectTrigger className="w-40" aria-label="错误类型">
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {errors.data?.filters.errorTypes.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={hasSample} onValueChange={(value) => { setHasSample(selectAll(value)); setPage(1); }}>
            <SelectTrigger className="w-32" aria-label="样本">
              <SelectValue placeholder="样本不限" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">样本不限</SelectItem>
              <SelectItem value="true">有样本</SelectItem>
              <SelectItem value="false">无样本</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {errors.loading && <AdminLoading label="正在加载错误数据…" />}
      {errors.error && <AdminError message={errors.error} onRetry={errors.reload} />}
      {errors.data?.items.length === 0 && <AdminEmpty label="当前条件没有错误数据。" />}
      {errors.data && errors.data.items.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>错误</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>版本</TableHead>
                <TableHead className="text-right">发生次数</TableHead>
                <TableHead className="text-right">影响安装</TableHead>
                <TableHead>最近发生</TableHead>
                <TableHead className="text-right">样本</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.data.items.map((item) => (
                <TableRow key={item.fingerprint}>
                  <TableCell className="max-w-[340px] whitespace-normal">
                    <Button variant="link" className="h-auto justify-start p-0 text-left font-medium whitespace-normal" onClick={() => setSelected(item.fingerprint)}>
                      <span className="line-clamp-2 min-w-0 wrap-anywhere">{item.latestMessage || "未提供错误信息"}</span>
                    </Button>
                    <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{item.fingerprint}</p>
                  </TableCell>
                  <TableCell><ToneBadge tone="neutral">{item.errorType}</ToneBadge></TableCell>
                  <TableCell className="tabular-nums">{item.appVersion}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.occurrenceCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.affectedInstallations}</TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">{date(item.lastSeen)}</TableCell>
                  <TableCell className="text-right"><SampleBadge hasSample={item.hasSample} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {errors.data && errors.data.totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">第 {errors.data.page} / {totalPages} 页 · 共 {errors.data.total} 组</p>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  text="上一页"
                  className={page <= 1 ? "pointer-events-none opacity-40" : undefined}
                  aria-disabled={page <= 1}
                  onClick={(event) => { event.preventDefault(); setPage((value) => Math.max(1, value - 1)); }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  text="下一页"
                  className={page >= totalPages ? "pointer-events-none opacity-40" : undefined}
                  aria-disabled={page >= totalPages}
                  onClick={(event) => { event.preventDefault(); setPage((value) => Math.min(totalPages, value + 1)); }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>错误详情</DialogTitle>
            <DialogDescription className="truncate font-mono text-xs">{selected}</DialogDescription>
          </DialogHeader>
          {detail.loading && <AdminLoading label="正在加载详情…" />}
          {detail.error && <AdminError message={detail.error} onRetry={detail.reload} />}
          {detail.data && (
            <div className="grid gap-3">
              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="类型">{detail.data.errorType}</DetailRow>
                <DetailRow label="版本">{detail.data.appVersion}</DetailRow>
                <DetailRow label="首次发生">{date(detail.data.firstSeen)}</DetailRow>
                <DetailRow label="最近发生">{date(detail.data.lastSeen)}</DetailRow>
                <DetailRow label="发生次数">{detail.data.occurrenceCount}</DetailRow>
                <DetailRow label="影响安装">{detail.data.affectedInstallations}</DetailRow>
                {detail.data.route && <DetailRow label="路由">{detail.data.route}</DetailRow>}
                {detail.data.command && <DetailRow label="命令"><code className="break-all rounded-lg bg-muted px-1.5 py-0.5 font-mono text-xs">{detail.data.command}</code></DetailRow>}
              </dl>
              <div className="grid gap-1.5">
                <p className="text-xs text-muted-foreground">消息</p>
                <p className="text-sm">{detail.data.latestMessage}</p>
              </div>
              <div className="grid gap-1.5">
                <p className="text-xs text-muted-foreground">堆栈</p>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-muted p-3 font-mono text-xs leading-5">{detail.data.stack || "没有堆栈信息"}</pre>
              </div>
            </div>
          )}
          {selected && (
            <div className="grid gap-3 border-t pt-4">
              <p className="text-sm font-medium">最近样本</p>
              {sample.loading && <AdminLoading label="正在加载样本…" />}
              {sample.data && (
                <>
                  <p className="text-xs text-muted-foreground">{date(sample.data.occurredAt)} · {sample.data.platform} · {sample.data.architecture}</p>
                  <p className="text-sm">{sample.data.message}</p>
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-muted p-3 font-mono text-xs leading-5">{sample.data.context || sample.data.stack || "没有上下文"}</pre>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}