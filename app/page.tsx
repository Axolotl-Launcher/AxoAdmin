"use client";

import { Activity, Coins, ReceiptText, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { useAdminData } from "@/lib/api/use-admin-data";
import { overviewSchema } from "@/lib/api/schemas";

const money = (fen: number) => `¥ ${(fen / 100).toFixed(2)}`;

export default function Home() {
  const { data, error, loading, reload } = useAdminData("/api/admin/sponsors/overview", overviewSchema);
  return <div>
    <PageHeader title="工作台" description="查看 Axolotl 各项服务的关键运营指标和最近活动。" />
    {loading && <AdminLoading label="正在加载 Sponsor Gateway 数据…" />}
    {error && <AdminError message={error} onRetry={reload} />}
    {data && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="用户总数" value={String(data.users.total)} detail={`${data.users.active} 个活跃用户`} icon={Users} tone="blue" />
        <StatCard label="累计赞助" value={money(data.orders.paid_amount_fen)} detail={`${data.orders.paid_count} 笔已完成订单`} icon={ReceiptText} tone="green" />
        <StatCard label="CDK 已兑换" value={String(data.cdks.redeemed_count)} detail={money(data.cdks.redeemed_amount_fen)} icon={Coins} tone="gold" />
        <StatCard label="今日 API 请求" value={String(data.usage.today_request_count)} detail={`${data.usage.today_error_count} 个错误`} icon={Activity} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><h2 className="font-semibold">统一管理中心</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">遥测、赞助与权益、API 运营和平台审计集中在同一个管理空间。</p></Card>
        <Card><h2 className="font-semibold">权益概览</h2><p className="mt-2 text-sm text-muted-foreground">{data.entitlements.granted} 个账户已获得永久权益。</p></Card>
      </div>
    </>}
  </div>;
}
