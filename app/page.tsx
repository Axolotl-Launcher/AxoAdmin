"use client";

import { Activity, Coins, ReceiptText, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { useAdminData } from "@/lib/api/use-admin-data";
import { overviewSchema } from "@/lib/api/schemas";

const money = (fen: number) => `¥ ${(fen / 100).toFixed(2)}`;

const modules = [
  { icon: Activity, label: "匿名遥测聚合分析" },
  { icon: ReceiptText, label: "赞助订单与 CDK 权益" },
  { icon: Users, label: "用户与 API Key 运营" },
  { icon: ShieldCheck, label: "审计与访问控制" },
] as const;

export default function Home() {
  const { data, error, loading, reload } = useAdminData("/api/admin/sponsors/overview", overviewSchema);
  return (
    <div className="grid gap-4">
      <PageHeader title="工作台" description="查看 Axolotl 各项服务的关键运营指标和最近活动。" />
      {loading && <AdminLoading label="正在加载 Sponsor Gateway 数据…" />}
      {error && <AdminError message={error} onRetry={reload} />}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="用户总数" value={String(data.users.total)} detail={`${data.users.active} 个活跃用户`} icon={Users} tone="blue" />
            <StatCard label="累计赞助" value={money(data.orders.paid_amount_fen)} detail={`${data.orders.paid_count} 笔已完成订单`} icon={ReceiptText} tone="green" />
            <StatCard label="CDK 已兑换" value={String(data.cdks.redeemed_count)} detail={money(data.cdks.redeemed_amount_fen)} icon={Coins} tone="gold" />
            <StatCard label="今日 API 请求" value={String(data.usage.today_request_count)} detail={`${data.usage.today_error_count} 个错误`} icon={Activity} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>统一管理中心</CardTitle>
                <CardDescription>遥测、赞助与权益、API 运营和平台审计集中在同一个管理空间。</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2.5 text-sm text-muted-foreground sm:grid-cols-2">
                {modules.map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-2.5">
                    <Icon className="size-4 shrink-0 text-foreground/70" />
                    {label}
                  </span>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>权益概览</CardTitle>
                <CardDescription>账户永久权益状态分布</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">已授权</span>
                  <span className="font-medium tabular-nums">{data.entitlements.granted}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">待定</span>
                  <span className="font-medium tabular-nums">{data.entitlements.pending}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">已暂停</span>
                  <span className="font-medium tabular-nums">{data.entitlements.suspended}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">人工审核</span>
                  <span className="font-medium tabular-nums">{data.entitlements.manual_review}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}