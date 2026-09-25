"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Activity, KeyRound, ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminEmpty, AdminError, TableSkeleton } from "@/components/dashboard/admin-state";
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
      <PageHeader
        title={data?.email ?? "用户详情"}
        description={data ? `ID: ${data.id} · 创建于 ${date(data.created_at)}` : "查看用户权益、API Key 状态和近期用量。"}
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/sponsors/users">
            <ArrowLeft data-icon="inline-start" />
            返回列表
          </Link>
        </Button>
        {data && (
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/sponsors/orders?user_id=${encodeURIComponent(data.id)}`}>
                <ReceiptText data-icon="inline-start" />
                查看订单
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/operations/usage?user_id=${encodeURIComponent(data.id)}`}>
                <Activity data-icon="inline-start" />
                用量详情
              </Link>
            </Button>
          </>
        )}
      </PageHeader>

      {error && <AdminError message={error} onRetry={reload} />}

      {loading && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="h-28 animate-pulse bg-muted/30" />
            ))}
          </div>
          <TableSkeleton rows={6} />
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>用户邮箱</CardTitle>
                <CardDescription>关联的认证主身份</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-1.5">
                <p className="font-medium text-base">{data.email ?? "未设置邮箱"}</p>
                <p className="break-all font-mono text-xs text-muted-foreground">{data.id}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>赞助与权益</CardTitle>
                <CardDescription>累计支持金额与授权状态</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <div className="flex items-center justify-between">
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Key 凭据</CardTitle>
                <CardDescription>
                  {data.active_api_key?.last_used_at ? `最近活跃于 ${date(data.active_api_key.last_used_at)}` : "尚未产生调用"}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <KeyRound className="size-4 text-muted-foreground" />
                    {data.active_api_key ? "已开通 Key" : "无活跃 Key"}
                  </span>
                  {data.active_api_key && (
                    <ToneBadge tone={data.active_api_key.status === "active" ? "green" : "neutral"}>
                      {data.active_api_key.status}
                    </ToneBadge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="border-b pb-4">
              <CardTitle>近 30 天用量明细</CardTitle>
              <CardDescription>
                累计 {data.usage_summary.total_request_count} 次请求 · {data.usage_summary.total_input_chars} 个字符 · {data.usage_summary.total_error_count} 次异常
              </CardDescription>
            </CardHeader>

            {data.usage_summary.days.every((day) => day.request_count === 0) ? (
              <AdminEmpty label="近 30 天暂无用量记录。" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead className="text-right">请求数</TableHead>
                    <TableHead className="text-right">输入字符数</TableHead>
                    <TableHead className="text-right">错误数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.usage_summary.days.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="tabular-nums font-mono text-xs">{day.date}</TableCell>
                      <TableCell className="text-right tabular-nums">{day.request_count}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{day.input_chars}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-destructive">{day.error_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}