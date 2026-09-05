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
  const checks = state.data ? [["公共 Worker", state.data.publicWorker], ["D1 数据库", state.data.d1], ["定时任务", state.data.cron], ["Cloudflare 用量", state.data.accountUsage]] as const : [];
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <Card>
            <CardHeader>
              <CardTitle>数据状态</CardTitle>
              <CardDescription>每日聚合的最近可用数据。</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">最新数据日期</span>
              <span className="flex items-center gap-2 tabular-nums">
                <Database className="size-4 text-muted-foreground" />
                {state.data.latestDataDay ?? "暂无"}
              </span>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
