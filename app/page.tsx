"use client";

import Link from "next/link";
import { Activity, Coins, ReceiptText, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { useAdminData } from "@/lib/api/use-admin-data";
import { overviewSchema, telemetryOverviewSchema, telemetryActivitySchema } from "@/lib/api/schemas";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  type ChartConfig,
} from "@/components/ui/chart";

const money = (fen: number) => `¥ ${(fen / 100).toFixed(2)}`;

const modules = [
  { icon: Activity, label: "匿名遥测聚合分析" },
  { icon: ReceiptText, label: "赞助订单与 CDK 权益" },
  { icon: Users, label: "用户与 API Key 运营" },
  { icon: ShieldCheck, label: "审计与访问控制" },
] as const;

const dashboardChartConfig = {
  activeInstallations: {
    label: "活跃安装",
    color: "var(--chart-1)",
  },
  newInstallations: {
    label: "新增安装",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function Home() {
  const { data, error, loading, reload } = useAdminData("/api/admin/sponsors/overview", overviewSchema);
  const telemetry = useAdminData("/api/admin/telemetry/overview?range=30d", telemetryOverviewSchema);
  const activity = useAdminData("/api/admin/telemetry/activity?range=30d", telemetryActivitySchema);

  return (
    <div className="grid gap-4">
      <PageHeader title="工作台" description="遥测数据优先，快速掌握产品使用情况、公告与赞助权益。" />

      {telemetry.data && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>遥测总览</CardTitle>
              <CardDescription>已结算至昨日的匿名安装与活跃趋势</CardDescription>
              <CardAction>
                <Button asChild variant="outline" size="sm">
                  <Link href="/telemetry">查看遥测中心</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["日活跃", telemetry.data.metrics.dau.value],
                  ["周活跃", telemetry.data.metrics.wau.value],
                  ["月活跃", telemetry.data.metrics.mau.value],
                  ["累计安装", telemetry.data.metrics.totalInstallations.value],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="mt-1 text-xl font-semibold tabular-nums">{value.toLocaleString()}</div>
                  </div>
                ))}
              </div>

              {activity.data && (
                <ChartContainer config={dashboardChartConfig} className="h-[240px] w-full">
                  <LineChart
                    data={activity.data.points
                      .filter((point) => point.day < new Date().toISOString().slice(0, 10))
                      .map((point) => ({ ...point, day: point.day.slice(5) }))}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey="activeInstallations"
                      stroke="var(--color-activeInstallations)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="newInstallations"
                      stroke="var(--color-newInstallations)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>工作台入口</CardTitle>
              <CardDescription>按优先级组织常用模块</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {[
                ["/telemetry", "遥测数据中心"],
                ["/announcements", "公告发布与管理"],
                ["/sponsors/orders", "赞助订单与流水"],
                ["/sponsors/cdks", "CDK 发行与核销"],
              ].map(([href, label]) => (
                <Button key={href} asChild variant="outline" className="justify-start">
                  <Link href={href}>{label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

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