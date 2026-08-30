"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AdminEmpty, AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { ToneBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useAdminData } from "@/lib/api/use-admin-data";
import { userPageSchema } from "@/lib/api/schemas";

const date = (value: string) => new Date(value).toLocaleDateString("zh-CN");
const money = (fen: number) => `¥ ${(fen / 100).toFixed(2)}`;

function UserStatusBadge({ status }: { status: string }) {
  if (status === "active") return <ToneBadge tone="green">活跃</ToneBadge>;
  if (status === "suspended") return <ToneBadge tone="amber">已暂停</ToneBadge>;
  return <ToneBadge tone="red">已封禁</ToneBadge>;
}

function EntitlementBadge({ status }: { status: string }) {
  if (status === "granted") return <ToneBadge tone="green">已授权</ToneBadge>;
  if (status === "pending") return <ToneBadge tone="amber">待定</ToneBadge>;
  if (status === "suspended") return <ToneBadge tone="neutral">已暂停</ToneBadge>;
  return <ToneBadge tone="sky">人工审核</ToneBadge>;
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [entitlement, setEntitlement] = useState("");
  const [page, setPage] = useState(1);
  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), page_size: "25" });
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    if (entitlement) params.set("entitlement_status", entitlement);
    return `/api/admin/sponsors/users?${params}`;
  }, [entitlement, page, search, status]);
  const { data, error, loading, reload } = useAdminData(query, userPageSchema);
  const applySearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  return (
    <div className="grid gap-4">
      <PageHeader title="用户" description="查看 Sponsor Gateway 中的用户、赞助金额、权益和 API 用量。" />
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2">
          <div className="relative w-full min-w-52 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => applySearch(event.target.value)} placeholder="搜索邮箱" className="pl-8" aria-label="搜索邮箱" />
          </div>
          <Select value={status} onValueChange={(value) => { setStatus(value === "all" ? "" : value); setPage(1); }}>
            <SelectTrigger className="w-40" aria-label="用户状态">
              <SelectValue placeholder="全部用户状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部用户状态</SelectItem>
              <SelectItem value="active">活跃</SelectItem>
              <SelectItem value="suspended">已暂停</SelectItem>
              <SelectItem value="blocked">已封禁</SelectItem>
            </SelectContent>
          </Select>
          <Select value={entitlement} onValueChange={(value) => { setEntitlement(value === "all" ? "" : value); setPage(1); }}>
            <SelectTrigger className="w-40" aria-label="权益状态">
              <SelectValue placeholder="全部权益状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部权益状态</SelectItem>
              <SelectItem value="granted">已授权</SelectItem>
              <SelectItem value="pending">待定</SelectItem>
              <SelectItem value="suspended">已暂停</SelectItem>
              <SelectItem value="manual_review">人工审核</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => { setSearch(""); setStatus(""); setEntitlement(""); setPage(1); }}>
            <RotateCcw data-icon="inline-start" />
            重置
          </Button>
        </CardContent>
      </Card>
      {loading && <AdminLoading label="正在加载用户…" />}
      {error && <AdminError message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <AdminEmpty label="没有符合条件的用户。" hint="调整筛选条件后重试。" />}
      {data && data.items.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>权益</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead className="text-right">创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link href={`/sponsors/users/${user.id}`} className="font-medium hover:underline">
                      {user.email ?? "未设置邮箱"}
                    </Link>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{user.id}</p>
                  </TableCell>
                  <TableCell><UserStatusBadge status={user.status} /></TableCell>
                  <TableCell>
                    <EntitlementBadge status={user.entitlement_status} />
                    <p className="mt-1 text-xs text-muted-foreground">{money(user.lifetime_paid_fen)}</p>
                  </TableCell>
                  <TableCell>
                    {user.active_api_key ? (
                      <ToneBadge tone={user.active_api_key.status === "active" ? "green" : "neutral"}>{user.active_api_key.status}</ToneBadge>
                    ) : (
                      <span className="text-xs text-muted-foreground">无</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{date(user.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {data && data.total > data.page_size && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">共 {data.total} 位用户 · 第 {data.page} / {totalPages} 页</p>
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
    </div>
  );
}