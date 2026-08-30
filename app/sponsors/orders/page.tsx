"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AdminEmpty, AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { ToneBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useAdminData } from "@/lib/api/use-admin-data";
import { orderPageSchema } from "@/lib/api/schemas";

const money = (fen: number) => `¥ ${(fen / 100).toFixed(2)}`;
const date = (value: string) => new Date(value).toLocaleString("zh-CN");

function OrderStatusBadge({ status }: { status: string }) {
  if (status === "success") return <ToneBadge tone="green">成功</ToneBadge>;
  if (status === "paid") return <ToneBadge tone="sky">已支付</ToneBadge>;
  if (status === "pending") return <ToneBadge tone="amber">处理中</ToneBadge>;
  if (status === "refunded") return <ToneBadge tone="violet">已退款</ToneBadge>;
  if (status === "revoked") return <ToneBadge tone="neutral">已撤销</ToneBadge>;
  return <ToneBadge tone="outline">已取消</ToneBadge>;
}

export default function Orders() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), page_size: "25" });
    if (status) params.set("status", status);
    return `/api/admin/sponsors/orders?${params}`;
  }, [page, status]);
  const { data, error, loading, reload } = useAdminData(query, orderPageSchema);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  return (
    <div className="grid gap-4">
      <PageHeader title="赞助订单" description="查看已验证的爱发电订单和用户权益来源。" />
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Select value={status} onValueChange={(value) => { setStatus(value === "all" ? "" : value); setPage(1); }}>
            <SelectTrigger className="w-44" aria-label="订单状态">
              <SelectValue placeholder="全部订单状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部订单状态</SelectItem>
              <SelectItem value="paid">已支付</SelectItem>
              <SelectItem value="success">成功</SelectItem>
              <SelectItem value="pending">处理中</SelectItem>
              <SelectItem value="refunded">已退款</SelectItem>
              <SelectItem value="revoked">已撤销</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-xs text-muted-foreground">金额均以人民币展示，数据来自 fen。</span>
        </CardContent>
      </Card>
      {loading && <AdminLoading label="正在加载订单…" />}
      {error && <AdminError message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <AdminEmpty label="没有符合条件的订单。" />}
      {data && data.items.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead className="text-right">金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">同步时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((order, index) => (
                <TableRow key={`${order.user_id}-${order.synced_at}-${index}`}>
                  <TableCell>
                    <span className="font-medium">{order.user_email ?? "未设置邮箱"}</span>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{order.user_id}</p>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{money(order.actual_paid_fen)}</TableCell>
                  <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">{date(order.synced_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      {data && data.total > data.page_size && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">共 {data.total} 笔订单 · 第 {data.page} / {totalPages} 页</p>
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