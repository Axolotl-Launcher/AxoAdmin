"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AdminEmpty, AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminData } from "@/lib/api/use-admin-data";
import { orderPageSchema } from "@/lib/api/schemas";

const money = (fen: number) => `¥ ${(fen / 100).toFixed(2)}`;
const date = (value: string) => new Date(value).toLocaleString("zh-CN");

export default function Orders() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const query = useMemo(() => { const params = new URLSearchParams({ page: String(page), page_size: "25" }); if (status) params.set("status", status); return `/api/admin/sponsors/orders?${params}`; }, [page, status]);
  const { data, error, loading, reload } = useAdminData(query, orderPageSchema);
  return <div>
    <PageHeader title="赞助订单" description="查看已验证的爱发电订单和用户权益来源。" />
    <Card className="mb-4"><CardContent className="flex flex-wrap items-center gap-3 pt-5"><Select value={status} onValueChange={(value) => { setStatus(value === "all" ? "" : value); setPage(1); }}><SelectTrigger className="w-44" aria-label="订单状态"><SelectValue placeholder="全部订单状态" /></SelectTrigger><SelectContent><SelectItem value="all">全部订单状态</SelectItem><SelectItem value="paid">已支付</SelectItem><SelectItem value="success">成功</SelectItem><SelectItem value="pending">处理中</SelectItem><SelectItem value="refunded">已退款</SelectItem><SelectItem value="revoked">已撤销</SelectItem><SelectItem value="cancelled">已取消</SelectItem></SelectContent></Select><span className="text-sm text-muted-foreground">金额均以人民币展示，数据来自 fen。</span></CardContent></Card>
    {loading && <AdminLoading label="正在加载订单…" />}{error && <AdminError message={error} onRetry={reload} />}{data && data.items.length === 0 && <AdminEmpty label="没有符合条件的订单。" />}
    {data && data.items.length > 0 && <Card className="overflow-hidden p-0"><Table><TableHeader><TableRow><TableHead className="px-4">用户</TableHead><TableHead>金额</TableHead><TableHead>状态</TableHead><TableHead>同步时间</TableHead></TableRow></TableHeader><TableBody>{data.items.map((order, index) => <TableRow key={`${order.user_id}-${order.synced_at}-${index}`}><TableCell className="px-4"><span>{order.user_email ?? "未设置邮箱"}</span><p className="mt-1 font-mono text-xs text-muted-foreground">{order.user_id}</p></TableCell><TableCell className="font-medium">{money(order.actual_paid_fen)}</TableCell><TableCell>{order.status}</TableCell><TableCell className="text-muted-foreground">{date(order.synced_at)}</TableCell></TableRow>)}</TableBody></Table></Card>}
    {data && data.total > data.page_size && <div className="mt-4 flex items-center justify-between text-sm"><span className="text-muted-foreground">共 {data.total} 笔订单</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>上一页</Button><Button variant="outline" size="sm" disabled={page * data.page_size >= data.total} onClick={() => setPage((value) => value + 1)}>下一页</Button></div></div>}
  </div>;
}
