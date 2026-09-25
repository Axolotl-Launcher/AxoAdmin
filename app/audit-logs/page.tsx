"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminEmpty, AdminError, TableSkeleton } from "@/components/dashboard/admin-state";

type Log = {
  id: string;
  actor_name: string;
  actor_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

const actionNames: Record<string, string> = {
  generate: "生成",
  create: "创建",
  update: "修改",
  publish: "发布",
  archive: "归档",
  draft: "撤回",
  delete: "删除",
};

const resourceNames: Record<string, string> = {
  cdk: "CDK",
  announcement: "公告",
};

export default function Audit() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/audit-logs");
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "加载失败");
      setLogs(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="grid gap-4">
      <PageHeader title="审计日志" description="追踪管理中心中的关键管理员操作与资源变更记录。">
        <Button variant="outline" size="sm" disabled={loading} onClick={() => void load()}>
          <RefreshCw className={loading ? "animate-spin" : undefined} />
          刷新
        </Button>
      </PageHeader>

      {error && <AdminError message={error} onRetry={() => void load()} />}

      <Card className="overflow-hidden">
        <CardHeader className="border-b pb-4">
          <CardTitle>操作记录</CardTitle>
          <CardDescription>按时间倒序展示平台内执行的关键敏感操作。</CardDescription>
        </CardHeader>

        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={6} />
          </div>
        ) : logs.length === 0 ? (
          <AdminEmpty label="暂无审计日志记录。" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>管理员</TableHead>
                <TableHead>操作</TableHead>
                <TableHead>资源类型</TableHead>
                <TableHead>操作详情</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("zh-CN")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{log.actor_name}</div>
                    <div className="text-xs text-muted-foreground">{log.actor_email || "—"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.action === "delete" ? "destructive" : log.action === "publish" ? "success" : "secondary"}>
                      {actionNames[log.action] || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{resourceNames[log.resource_type] || log.resource_type}</span>
                    {log.resource_id && (
                      <div className="font-mono text-xs text-muted-foreground">{log.resource_id}</div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-sm truncate text-xs text-muted-foreground">
                    {Object.entries(log.details || {}).map(([key, value]) => `${key}：${String(value)}`).join("，") || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
