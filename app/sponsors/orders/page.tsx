"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { AdminEmpty, AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { useAdminData } from "@/lib/api/use-admin-data";
import { orderPageSchema } from "@/lib/api/schemas";

const money = (fen: number) => `¥ ${(fen / 100).toFixed(2)}`;
const date = (value: string) => new Date(value).toLocaleString("zh-CN");

export default function Orders() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const query = useMemo(() => { const params = new URLSearchParams({ page: String(page), page_size: "25" }); if (status) params.set("status", status); return `/api/admin/sponsors/orders?${params}`; }, [page, status]);
  const { data, error, loading, reload } = useAdminData(query, orderPageSchema);
  return <div><PageHeader title="赞助订单" description="查看已验证的爱发电订单和用户权益来源。" /><Card className="mb-4"><div className="flex items-center gap-3"><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-10 rounded-xl border bg-background px-3 text-sm"><option value="">全部订单状态</option><option value="paid">已支付</option><option value="success">成功</option><option value="pending">处理中</option><option value="refunded">已退款</option><option value="revoked">已撤销</option><option value="cancelled">已取消</option></select><span className="text-sm text-muted-foreground">金额均以人民币展示，数据来自 fen。</span></div></Card>{loading && <AdminLoading label="正在加载订单…" />}{error && <AdminError message={error} onRetry={reload} />}{data && data.items.length === 0 && <AdminEmpty label="没有符合条件的订单。" />}{data && data.items.length > 0 && <Card className="overflow-x-auto p-0"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b text-xs text-muted-foreground"><tr><th className="p-4 font-medium">用户</th><th className="p-4 font-medium">金额</th><th className="p-4 font-medium">状态</th><th className="p-4 font-medium">同步时间</th></tr></thead><tbody>{data.items.map((order, index) => <tr key={`${order.user_id}-${order.synced_at}-${index}`} className="border-b last:border-0"><td className="p-4"><span>{order.user_email ?? "未设置邮箱"}</span><p className="mt-1 font-mono text-xs text-muted-foreground">{order.user_id}</p></td><td className="p-4 font-medium">{money(order.actual_paid_fen)}</td><td className="p-4">{order.status}</td><td className="p-4 text-muted-foreground">{date(order.synced_at)}</td></tr>)}</tbody></table></Card>}{data && data.total > data.page_size && <div className="mt-4 flex items-center justify-between text-sm"><span className="text-muted-foreground">共 {data.total} 笔订单</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-xl border px-3 py-2 disabled:opacity-40">上一页</button><button disabled={page * data.page_size >= data.total} onClick={() => setPage((value) => value + 1)} className="rounded-xl border px-3 py-2 disabled:opacity-40">下一页</button></div></div>}</div>;
}
