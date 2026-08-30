"use client";

import { Database, RefreshCw, Server } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToneBadge } from "@/components/dashboard/status-badge";
import { useAdminData } from "@/lib/api/use-admin-data";
import { telemetrySystemSchema } from "@/lib/api/schemas";

const labels = { available: "正常", degraded: "降级", unavailable: "不可用" } as const;
const checkIcon = { available: "text-emerald-600 dark:text-emerald-400", degraded: "text-amber-600 dark:text-amber-400", unavailable: "text-red-600 dark:text-red-400" } as const;
const checkTone = { available: "green", degraded: "amber", unavailable: "red" } as const;

export default function System() {
  const state = useAdminData("/api/admin/telemetry/system", telemetrySystemSchema);
  const checks = state.data ? [["公共 Worker", state.data.publicWorker], ["D1 数据库", state.data.d1], ["R2 存储", state.data.r2], ["定时任务", state.data.cron], ["Cloudflare 用量", state.data.accountUsage]] as const : [];
  return (
    <div className="grid gap-4">
      <PageHeader title="系统状态" description="查看遥测数据源及相关服务的运行状态。">
        <Button aria-label="刷新系统状态" variant="outline" size="icon-sm" onClick={state.reload}>
          <RefreshCw className="size-4" />
        </Button>
      </PageHeader>
      {state.loading && <AdminLoading label="正在加载系统状态…" />}
      {state.error && <AdminError message={state.error} onRetry={state.reload} />}
      {state.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {checks.map(([name, check]) => (
              <Card key={name}>
                <CardContent className="grid gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <Server className={`mt-0.5 size-5 ${checkIcon[check.status]}`} />
                    <ToneBadge tone={checkTone[check.status]}>{labels[check.status]}</ToneBadge>
                  </div>
                  <p className="font-medium">{name}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{check.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>数据与存储</CardTitle>
                <CardDescription>错误上下文与样本存储状态</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">错误上下文存储</span>
                  <span className="flex items-center gap-2">
                    <Database className="size-4 text-muted-foreground" />
                    {state.data.storeErrorContext ? "已启用" : "未启用"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">R2 样本预算</span>
                  <span className="tabular-nums">{state.data.r2Budget.used} / {state.data.r2Budget.limit}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">最新数据日期</span>
                  <span>{state.data.latestDataDay ?? "暂无"}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>保留限制</CardTitle>
                <CardDescription>遥测数据在各存储层的保留策略</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">每日活跃保留</span>
                  <span className="tabular-nums">{state.data.limits.dailyActiveRetentionDays} 天</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">错误报告保留</span>
                  <span className="tabular-nums">{state.data.limits.errorReportsRetentionDays} 天</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">R2 保留</span>
                  <span className="tabular-nums">{state.data.limits.r2RetentionDays} 天</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">每错误组样本</span>
                  <span className="tabular-nums">{state.data.limits.samplesPerGroup}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}