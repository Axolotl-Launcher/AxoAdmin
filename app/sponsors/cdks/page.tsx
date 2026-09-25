"use client";

import { useMemo, useState } from "react";
import { Coins, Ticket } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AdminEmpty, AdminError, TableSkeleton } from "@/components/dashboard/admin-state";
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

      {error && !reloading && <AdminError message={error} onRetry={reloadAll} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="可用 CDK"
          value={String(overview.data?.cdks.active_count ?? 0)}
          detail="当前可兑换的 CDK 数量"
          icon={Ticket}
          tone="default"
        />
        <StatCard
          label="已兑换"
          value={String(overview.data?.cdks.redeemed_count ?? 0)}
          detail={`${money(overview.data?.cdks.redeemed_amount_fen ?? 0)} 已计入用户累计支持`}
          icon={Coins}
          tone="gold"
        />
        <StatCard
          label="发行批次"
          value={String(batchCount)}
          detail={`共 ${list.data?.length ?? 0} 个 CDK 凭据`}
          icon={Ticket}
          tone="blue"
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div>
            <CardTitle>CDK 列表</CardTitle>
            <CardDescription>按批次与金额管理的实体 CDK 兑换明细。</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={status || "all"} onValueChange={(value) => setStatus(value === "all" ? "" : value)}>
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
          </div>
        </CardHeader>

        {reloading ? (
          <div className="p-4">
            <TableSkeleton rows={5} />
          </div>
        ) : items.length === 0 ? (
          <AdminEmpty
            label="没有符合条件的 CDK。"
            hint={status ? "切换状态筛选后重试。" : "点击右上角「生成 CDK」发行第一批凭据。"}
          />
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
    </div>
  );
}