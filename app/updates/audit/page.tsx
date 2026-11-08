"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToneBadge, type Tone } from "@/components/dashboard/status-badge";
import { AdminEmpty, AdminError, TableSkeleton } from "@/components/dashboard/admin-state";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUpdateApi } from "@/lib/api/use-admin-data";
import { updateAuditLogsSchema } from "@/lib/api/schemas";
import { formatDateTime, shortDigest } from "@/lib/updates/format";

const actionNames: Record<string, string> = { revoke: "撤销版本", restore: "恢复版本", force_update_enabled: "启用强制更新", force_update_disabled: "关闭强制更新", delete_version: "删除版本" };
const actionTones: Record<string, Tone> = { revoke: "red", restore: "green", force_update_enabled: "amber", force_update_disabled: "neutral", delete_version: "red" };

export default function Audit() {
  const audit = useUpdateApi("/api/admin/updates/audit-logs", updateAuditLogsSchema);
  const logs = audit.data?.logs ?? [];

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader title="发布审计" description="追溯撤销、恢复、强制更新与版本删除的操作记录。">
        <Button variant="outline" size="sm" disabled={audit.loading} onClick={audit.reload}>
          <RefreshCw className={audit.loading ? "animate-spin" : undefined} />
          刷新
        </Button>
      </PageHeader>

      {audit.error && <AdminError message={audit.error} onRetry={audit.reload} />}

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="border-b pb-4">
          <CardTitle>版本管理记录</CardTitle>
          <CardDescription>由更新服务记录；通过本面板执行的操作也会写入平台审计。</CardDescription>
        </CardHeader>

        {audit.loading ? (
          <div className="p-4">
            <TableSkeleton rows={5} />
          </div>
        ) : logs.length === 0 ? (
          <AdminEmpty label="还没有版本管理记录。" hint="执行版本管理操作后会显示在这里。" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>操作人</TableHead>
                <TableHead>动作</TableHead>
                <TableHead>版本</TableHead>
                <TableHead>原因</TableHead>
                <TableHead>来源 IP</TableHead>
                <TableHead>请求 ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.request_id + log.created_at}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(log.created_at)}</TableCell>
                  <TableCell className="max-w-48 truncate text-xs" title={log.operator}>{log.operator || "—"}</TableCell>
                  <TableCell><ToneBadge tone={actionTones[log.action] ?? "neutral"}>{actionNames[log.action] ?? log.action}</ToneBadge></TableCell>
                  <TableCell className="whitespace-nowrap">
                    {log.version && log.action !== "delete_version" ? <Link href={`/updates/${encodeURIComponent(log.version)}`} className="font-medium hover:underline">{log.version}</Link> : <span>{log.version ?? "—"}</span>}
                    <p className="mt-1 text-xs text-muted-foreground">{log.channel}</p>
                  </TableCell>
                  <TableCell className="max-w-72 whitespace-normal text-xs text-muted-foreground">{log.reason || "未填写"}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{log.ip_address || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground" title={log.request_id ?? undefined}>{shortDigest(log.request_id)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
