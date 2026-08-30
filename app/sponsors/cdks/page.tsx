"use client";

import { useMemo, useState } from "react";
import { Coins, Ticket } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminEmpty, AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { ToneBadge } from "@/components/dashboard/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CdkCreateForm } from "@/components/sponsors/cdk-create-form";
import { useAdminData } from "@/lib/api/use-admin-data";
import { cdkListSchema, overviewSchema } from "@/lib/api/schemas";

const money = (fen: number) => `¥ ${(fen / 100).toFixed(2)}`;
const date = (value?: string | null) => (value ? new Date(value).toLocaleString("zh-CN") : "—");
const short = (value: string) => value.slice(0, 8);

function CdkStatusBadge({ status }: { status: string }) {
  if (status === "active") return <ToneBadge tone="green">可用</ToneBadge>;
  if (status === "redeemed") return <ToneBadge tone="sky">已兑换</ToneBadge>;
  if (status === "revoked") return <ToneBadge tone="neutral">已撤销</ToneBadge>;
  return <ToneBadge tone="outline">已过期</ToneBadge>;
}

export default function Cdks() {
  const [status, setStatus] = useState("");
  const overview = useAdminData("/api/admin/sponsors/overview", overviewSchema);
  const list = useAdminData("/api/admin/sponsors/cdks", cdkListSchema);
  const reloadAll = () => { overview.reload(); list.reload(); };
  const reloading = overview.loading || list.loading;
  const error = overview.error ?? list.error;
  const items = useMemo(
    () => (status ? (list.data ?? []).filter((cdk) => cdk.status === status) : list.data ?? []),
    [list.data, status]
  );
  const batchCount = useMemo(() => new Set((list.data ?? []).map((cdk) => cdk.batch_id)).size, [list.data]);
  return (
    <div className="grid gap-4">
      <PageHeader title="CDK 管理" description="生成固定金额或订单等值 CDK，并追踪兑换状态。">
        <CdkCreateForm onCreated={reloadAll} />
      </PageHeader>
      {reloading && <AdminLoading label="正在加载 CDK 数据…" />}
      {error && !reloading && <AdminError message={error} onRetry={reloadAll} />}
      {!error && !reloading && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">可用 CDK</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{overview.data?.cdks.active_count ?? 0}</p>
                  <p className="mt-1 text-xs text-muted-foreground">当前可兑换的 CDK 数量</p>
                </div>
                <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-muted text-foreground">
                  <Ticket className="size-4" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">已兑换</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{overview.data?.cdks.redeemed_count ?? 0}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{money(overview.data?.cdks.redeemed_amount_fen ?? 0)} 已计入用户累计支持</p>
                </div>
                <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Coins className="size-4" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">发行批次</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{batchCount}</p>
                  <p className="mt-1 text-xs text-muted-foreground">共 {list.data?.length ?? 0} 个 CDK</p>
                </div>
                <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-muted text-foreground">
                  <Ticket className="size-4" />
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle>CDK 列表</CardTitle>
              <Select value={status} onValueChange={(value) => setStatus(value === "all" ? "" : value)}>
                <SelectTrigger className="w-36" aria-label="按状态筛选">
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">可用</SelectItem>
                  <SelectItem value="redeemed">已兑换</SelectItem>
                  <SelectItem value="revoked">已撤销</SelectItem>
                  <SelectItem value="expired">已过期</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            {items.length === 0 ? (
              <CardContent>
                <AdminEmpty label="没有符合条件的 CDK。" hint={status ? "切换状态筛选后重试。" : "点击右上角「生成 CDK」发行第一批。"} />
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CDK</TableHead>
                    <TableHead>批次</TableHead>
                    <TableHead className="text-right">金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">兑换时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((cdk) => (
                    <TableRow key={cdk.id}>
                      <TableCell className="font-mono text-xs">{short(cdk.id)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{short(cdk.batch_id)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{money(cdk.amount_fen)}</TableCell>
                      <TableCell><CdkStatusBadge status={cdk.status} /></TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">{date(cdk.redeemed_at)}</TableCell>
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