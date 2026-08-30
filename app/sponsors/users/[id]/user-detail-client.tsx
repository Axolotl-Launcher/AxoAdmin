"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Activity, KeyRound, ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminEmpty, AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { ToneBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminData } from "@/lib/api/use-admin-data";
import { userDetailSchema } from "@/lib/api/schemas";

const money = (fen: number) => `¥ ${(fen / 100).toFixed(2)}`;
const date = (value: string) => new Date(value).toLocaleString("zh-CN");

export default function UserDetailClient({ id }: { id: string }) {
  const path = useMemo(() => `/api/admin/sponsors/users/${encodeURIComponent(id)}`, [id]);
  const { data, error, loading, reload } = useAdminData(path, userDetailSchema);
  return (
    <div className="grid gap-4">
      <PageHeader title="用户详情" description="查看用户权益、API Key 状态和近期用量。">
        <Button asChild variant="outline" size="sm">
          <Link href="/sponsors/users">
            <ArrowLeft data-icon="inline-start" />
            返回用户列表
          </Link>
        </Button>
      </PageHeader>
      {loading && <AdminLoading label="正在加载用户详情…" />}
      {error && <AdminError message={error} onRetry={reload} />}
      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>用户</CardTitle>
                <CardDescription>创建于 {date(data.created_at)}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-1.5">
                <p className="font-medium">{data.email ?? "未设置邮箱"}</p>
                <p className="break-all font-mono text-xs text-muted-foreground">{data.id}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>权益</CardTitle>
                <CardDescription>累计赞助金额</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <p className="text-2xl font-semibold tracking-tight tabular-nums">{money(data.lifetime_paid_fen)}</p>
                {data.entitlement_status === "granted" ? (
                  <ToneBadge tone="green">已授权</ToneBadge>
                ) : data.entitlement_status === "pending" ? (
                  <ToneBadge tone="amber">待定</ToneBadge>
                ) : data.entitlement_status === "suspended" ? (
                  <ToneBadge tone="neutral">已暂停</ToneBadge>
                ) : (
                  <ToneBadge tone="sky">人工审核</ToneBadge>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>API Key</CardTitle>
                <CardDescription>
                  {data.active_api_key?.last_used_at ? `最近使用 ${date(data.active_api_key.last_used_at)}` : "尚未使用"}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <KeyRound className="size-4 text-muted-foreground" />
                  {data.active_api_key ? data.active_api_key.status : "无活跃 Key"}
                </span>
                {data.active_api_key && (
                  <ToneBadge tone={data.active_api_key.status === "active" ? "green" : "neutral"}>{data.active_api_key.status}</ToneBadge>
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>近 30 天用量</CardTitle>
              <CardDescription>
                {data.usage_summary.total_request_count} 次请求 · {data.usage_summary.total_input_chars} 个字符 · {data.usage_summary.total_error_count} 个错误
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.usage_summary.days.every((day) => day.request_count === 0) ? (
                <AdminEmpty label="暂无用量记录。" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead className="text-right">请求</TableHead>
                      <TableHead className="text-right">字符</TableHead>
                      <TableHead className="text-right">错误</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.usage_summary.days.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell className="tabular-nums">{day.date}</TableCell>
                        <TableCell className="text-right tabular-nums">{day.request_count}</TableCell>
                        <TableCell className="text-right tabular-nums">{day.input_chars}</TableCell>
                        <TableCell className="text-right tabular-nums">{day.error_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/sponsors/orders?user_id=${encodeURIComponent(data.id)}`}>
                <ReceiptText data-icon="inline-start" />
                查看订单
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/operations/usage?user_id=${encodeURIComponent(data.id)}`}>
                <Activity data-icon="inline-start" />
                查看完整用量
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}