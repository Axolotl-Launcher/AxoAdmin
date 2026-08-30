"use client";

import { Database, HardDrive, RefreshCw, Server } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminData } from "@/lib/api/use-admin-data";
import { telemetrySystemSchema } from "@/lib/api/schemas";

const tone = { available: "text-emerald-600", degraded: "text-amber-600", unavailable: "text-red-600" } as const;
const label = { available: "正常", degraded: "降级", unavailable: "不可用" } as const;

export default function System() {
  const state = useAdminData("/api/admin/telemetry/system", telemetrySystemSchema);
  const checks = state.data ? [["公共 Worker", state.data.publicWorker], ["D1 数据库", state.data.d1], ["R2 存储", state.data.r2], ["定时任务", state.data.cron], ["Cloudflare 用量", state.data.accountUsage]] as const : [];
  return <div><PageHeader title="系统状态" description="查看遥测数据源及相关服务的运行状态。" children={<button aria-label="刷新系统状态" onClick={state.reload} className="grid size-10 place-items-center rounded-xl border"><RefreshCw className="size-4" /></button>} />
    {state.loading && <AdminLoading label="正在加载系统状态…" />}{state.error && <AdminError message={state.error} onRetry={state.reload} />}
    {state.data && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{checks.map(([name, check]) => <Card key={name}><div className="flex items-start gap-3"><Server className={`mt-1 size-5 ${tone[check.status]}`} /><div><p className="font-medium">{name}</p><p className={`mt-1 text-sm ${tone[check.status]}`}>{label[check.status]}</p><p className="mt-2 text-xs text-muted-foreground">{check.detail}</p></div></div></Card>)}</div><div className="mt-6 grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>数据与存储</CardTitle></CardHeader><dl className="grid gap-3 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">错误上下文存储</dt><dd>{state.data.storeErrorContext ? "已启用" : "未启用"}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">R2 样本预算</dt><dd>{state.data.r2Budget.used} / {state.data.r2Budget.limit}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">最新数据日期</dt><dd>{state.data.latestDataDay ?? "暂无"}</dd></div></dl></Card><Card><CardHeader><CardTitle>保留限制</CardTitle></CardHeader><dl className="grid gap-3 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">每日活跃保留</dt><dd>{state.data.limits.dailyActiveRetentionDays} 天</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">错误报告保留</dt><dd>{state.data.limits.errorReportsRetentionDays} 天</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">R2 保留</dt><dd>{state.data.limits.r2RetentionDays} 天</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">每错误组样本</dt><dd>{state.data.limits.samplesPerGroup}</dd></div></dl></Card></div></>}
  </div>;
}
