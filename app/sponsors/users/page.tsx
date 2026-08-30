"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { AdminEmpty, AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { useAdminData } from "@/lib/api/use-admin-data";
import { userPageSchema } from "@/lib/api/schemas";

const date = (value: string) => new Date(value).toLocaleDateString("zh-CN");
const money = (fen: number) => `¥ ${(fen / 100).toFixed(2)}`;

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
  const applySearch = (value: string) => { setSearch(value); setPage(1); };
  return <div>
    <PageHeader title="用户" description="查看 Sponsor Gateway 中的用户、赞助金额、权益和 API 用量。" />
    <Card className="mb-4"><div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
      <input value={search} onChange={(event) => applySearch(event.target.value)} placeholder="搜索邮箱" className="h-10 rounded-xl border bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring" />
      <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-10 rounded-xl border bg-background px-3 text-sm"><option value="">全部用户状态</option><option value="active">活跃</option><option value="suspended">已暂停</option><option value="blocked">已封禁</option></select>
      <select value={entitlement} onChange={(event) => { setEntitlement(event.target.value); setPage(1); }} className="h-10 rounded-xl border bg-background px-3 text-sm"><option value="">全部权益状态</option><option value="granted">已授权</option><option value="pending">待定</option><option value="suspended">已暂停</option><option value="manual_review">人工审核</option></select>
      <button onClick={() => { setSearch(""); setStatus(""); setEntitlement(""); setPage(1); }} className="h-10 rounded-xl border px-4 text-sm font-medium">重置</button>
    </div></Card>
    {loading && <AdminLoading label="正在加载用户…" />}
    {error && <AdminError message={error} onRetry={reload} />}
    {data && data.items.length === 0 && <AdminEmpty label="没有符合条件的用户。" />}
    {data && data.items.length > 0 && <Card className="overflow-x-auto p-0"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b text-xs text-muted-foreground"><tr><th className="p-4 font-medium">用户</th><th className="p-4 font-medium">状态</th><th className="p-4 font-medium">权益</th><th className="p-4 font-medium">API Key</th><th className="p-4 font-medium">创建时间</th></tr></thead><tbody>{data.items.map((user) => <tr key={user.id} className="border-b last:border-0"><td className="p-4"><Link href={`/sponsors/users/${user.id}`} className="font-medium hover:underline">{user.email ?? "未设置邮箱"}</Link><p className="mt-1 font-mono text-xs text-muted-foreground">{user.id}</p></td><td className="p-4">{user.status}</td><td className="p-4"><span>{user.entitlement_status}</span><p className="mt-1 text-xs text-muted-foreground">{money(user.lifetime_paid_fen)}</p></td><td className="p-4">{user.active_api_key?.status ?? "无"}</td><td className="p-4 text-muted-foreground">{date(user.created_at)}</td></tr>)}</tbody></table></Card>}
    {data && data.total > data.page_size && <div className="mt-4 flex items-center justify-between text-sm"><span className="text-muted-foreground">共 {data.total} 个用户</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-xl border px-3 py-2 disabled:opacity-40">上一页</button><button disabled={page * data.page_size >= data.total} onClick={() => setPage((value) => value + 1)} className="rounded-xl border px-3 py-2 disabled:opacity-40">下一页</button></div></div>}
  </div>;
}
