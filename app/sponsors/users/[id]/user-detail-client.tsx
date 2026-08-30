"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Activity, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { AdminEmpty, AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { useAdminData } from "@/lib/api/use-admin-data";
import { userDetailSchema } from "@/lib/api/schemas";

const money = (fen: number) => `¥ ${(fen / 100).toFixed(2)}`;
const date = (value: string) => new Date(value).toLocaleString("zh-CN");

export default function UserDetailClient({ id }: { id: string }) {
  const path = useMemo(() => `/api/admin/sponsors/users/${encodeURIComponent(id)}`, [id]);
  const { data, error, loading, reload } = useAdminData(path, userDetailSchema);
  return <div>
    <PageHeader title="用户详情" description="查看用户权益、API Key 状态和近期用量。"><Link href="/sponsors/users" className="inline-flex items-center gap-2 text-sm font-medium"><ArrowLeft className="size-4" />返回用户列表</Link></PageHeader>
    {loading && <AdminLoading label="正在加载用户详情…" />}
    {error && <AdminError message={error} onRetry={reload} />}
    {data && <>
      <div className="grid gap-4 md:grid-cols-3"><Card><p className="text-sm text-muted-foreground">用户</p><p className="mt-2 font-medium">{data.email ?? "未设置邮箱"}</p><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{data.id}</p><p className="mt-3 text-xs text-muted-foreground">创建于 {date(data.created_at)}</p></Card><Card><p className="text-sm text-muted-foreground">权益</p><p className="mt-2 text-2xl font-semibold">{money(data.lifetime_paid_fen)}</p><p className="mt-1 text-sm">{data.entitlement_status}</p></Card><Card><p className="flex items-center gap-2 text-sm text-muted-foreground"><KeyRound className="size-4" />API Key</p><p className="mt-2 font-medium">{data.active_api_key?.status ?? "无活跃 Key"}</p><p className="mt-1 text-xs text-muted-foreground">{data.active_api_key?.last_used_at ? `最近使用 ${date(data.active_api_key.last_used_at)}` : "尚未使用"}</p></Card></div>
      <Card className="mt-4"><div className="flex items-center justify-between"><div><h2 className="font-semibold">近 30 天用量</h2><p className="mt-1 text-sm text-muted-foreground">{data.usage_summary.total_request_count} 次请求 · {data.usage_summary.total_input_chars} 个字符 · {data.usage_summary.total_error_count} 个错误</p></div><Activity className="size-5 text-muted-foreground" /></div>{data.usage_summary.days.every((day) => day.request_count === 0) ? <AdminEmpty label="暂无用量记录。" /> : <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-xs text-muted-foreground"><tr><th className="py-3">日期</th><th className="py-3">请求</th><th className="py-3">字符</th><th className="py-3">错误</th></tr></thead><tbody>{data.usage_summary.days.map((day) => <tr key={day.date} className="border-b last:border-0"><td className="py-3">{day.date}</td><td className="py-3">{day.request_count}</td><td className="py-3">{day.input_chars}</td><td className="py-3">{day.error_count}</td></tr>)}</tbody></table></div>}</Card>
      <div className="mt-4 flex gap-3"><Link href={`/sponsors/orders?user_id=${encodeURIComponent(data.id)}`} className="rounded-xl border px-4 py-2 text-sm font-medium">查看订单</Link><Link href={`/operations/usage?user_id=${encodeURIComponent(data.id)}`} className="rounded-xl border px-4 py-2 text-sm font-medium">查看完整用量</Link></div>
    </>}
  </div>;
}
