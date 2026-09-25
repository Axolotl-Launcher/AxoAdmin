"use client";

import { useMemo, useState } from "react";
import { KeyRound, RotateCcw, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { AdminEmpty, AdminError, TableSkeleton } from "@/components/dashboard/admin-state";
import { ToneBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useAdminData } from "@/lib/api/use-admin-data";
import { adminApiKeyPageSchema } from "@/lib/api/schemas";

const datetime = (value?: string | null) => (value ? new Date(value).toLocaleString("zh-CN") : "—");
const date = (value: string) => new Date(value).toLocaleDateString("zh-CN");

function KeyStatusBadge({ status }: { status: string }) {
  if (status === "active") return <ToneBadge tone="green">生效中</ToneBadge>;
  if (status === "suspended") return <ToneBadge tone="amber">已暂停</ToneBadge>;
  return <ToneBadge tone="neutral">已吊销</ToneBadge>;
}

export default function ApiKeys() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), page_size: "25" });
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    return `/api/admin/sponsors/api-keys?${params}`;
  }, [page, search, status]);
  const { data, error, loading, reload } = useAdminData(query, adminApiKeyPageSchema);
  const applySearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  const hasFilter = Boolean(search || status);

  return (
    <div className="grid gap-4">
      <PageHeader title="API Key" description="查看用户 API Key 的状态和最近使用情况。" />

      {error && <AdminError message={error} onRetry={reload} />}

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-4 border-b pb-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>API Key 列表</CardTitle>
              <CardDescription>密钥只展示脱敏信息（Key 内部 ID 与状态），不暴露明文凭据。</CardDescription>
            </div>
            {data && <span className="text-xs text-muted-foreground">共 {data.total} 个 Key 记录</span>}
          </div>
          {/* Table Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="relative w-full min-w-48 sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => applySearch(event.target.value)}
                placeholder="搜索用户邮箱"
                className="pl-8"
                aria-label="搜索用户邮箱"
              />
            </div>
            <Select value={status || "all"} onValueChange={(value) => { setStatus(value === "all" ? "" : value); setPage(1); }}>
              <SelectTrigger className="w-36" aria-label="Key 状态">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">生效中</SelectItem>
                <SelectItem value="suspended">已暂停</SelectItem>
                <SelectItem value="revoked">已吊销</SelectItem>
              </SelectContent>
            </Select>
            {hasFilter && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatus(""); setPage(1); }}>
                <RotateCcw data-icon="inline-start" />
                重置
              </Button>
            )}
          </div>
        </CardHeader>

        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={5} />
          </div>
        ) : !data || data.items.length === 0 ? (
          <AdminEmpty
            label="没有符合条件的 API Key。"
            hint={hasFilter ? "调整筛选条件后重试。" : "用户生成 Key 后会显示在这里。"}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>Key ID</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">最近使用</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <span className="font-medium">{key.user_email ?? "未设置邮箱"}</span>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{key.user_id}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{key.id}</TableCell>
                  <TableCell><KeyStatusBadge status={key.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{date(key.created_at)}</TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">{datetime(key.last_used_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {data && data.total > 0 && (
          <CardFooter className="flex flex-col items-center justify-between gap-3 border-t py-3 sm:flex-row">
            <p className="text-xs text-muted-foreground">共 {data.total} 个 Key · 第 {data.page} / {totalPages} 页</p>
            {data.total > data.page_size && (
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
            )}
          </CardFooter>
        )}
      </Card>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <KeyRound className="size-3.5" />
        密钥只展示脱敏信息（Key 内部 ID 与状态），不会显示完整凭据。
      </p>
    </div>
  );
}