"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MoreHorizontal, Package, RefreshCw, RotateCcw, ShieldCheck, ShieldOff, Wifi, WifiOff } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ToneBadge, type Tone } from "@/components/dashboard/status-badge";
import { AdminEmpty, AdminError, TableSkeleton } from "@/components/dashboard/admin-state";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RevokeDialog, RestoreDialog } from "@/components/updates/release-dialogs";
import { useUpdateApi } from "@/lib/api/use-admin-data";
import { updateHealthSchema, updateVersionListSchema } from "@/lib/api/schemas";
import { formatDate } from "@/lib/updates/format";

const statusNames: Record<string, string> = { published: "已发布", revoked: "已撤销", uploading: "上传中", draft: "草稿", invalid: "无效" };
const statusTones: Record<string, Tone> = { published: "green", revoked: "red", uploading: "amber", draft: "neutral", invalid: "red" };

function ChannelBadge({ channel }: { channel: string }) {
  if (channel === "beta") return <ToneBadge tone="amber">Beta</ToneBadge>;
  if (channel === "release") return <ToneBadge tone="sky">Release</ToneBadge>;
  return <ToneBadge tone="outline">{channel}</ToneBadge>;
}

function StatusBadge({ status }: { status: string }) {
  return <ToneBadge tone={statusTones[status] ?? "neutral"}>{statusNames[status] ?? status}</ToneBadge>;
}

export default function Updates() {
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [revoking, setRevoking] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  const health = useUpdateApi("/api/admin/updates/health", updateHealthSchema);
  const versions = useUpdateApi("/api/admin/updates/versions", updateVersionListSchema);
  const list = useMemo(() => versions.data?.versions ?? [], [versions.data]);
  const reload = () => { health.reload(); versions.reload(); };

  const newest = (target: string) => list.find((item) => item.channel === target && item.status === "published");
  const release = newest("release");
  const beta = newest("beta");
  const revoked = list.filter((item) => item.status === "revoked").length;

  const rows = useMemo(() => list.filter((item) => {
    if (search && !item.version.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (channel !== "all" && item.channel !== channel) return false;
    if (status !== "all" && item.status !== status) return false;
    return true;
  }), [list, search, channel, status]);

  const busy = versions.loading;
  const hasFilter = Boolean(search || channel !== "all" || status !== "all");

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader title="版本与产物" description="查看已发布的启动器版本、产物清单与投送渠道，并处理需要撤销的版本。">
        <Button variant="outline" size="sm" disabled={busy} onClick={reload}>
          <RefreshCw className={busy ? "animate-spin" : undefined} />
          刷新
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="更新服务"
          value={health.loading ? "—" : health.data?.status === "ok" ? "正常" : "异常"}
          detail={health.data?.service ?? health.error ?? "尚未配置 UPDATE_SERVER_ORIGIN"}
          icon={health.data?.status === "ok" ? Wifi : WifiOff}
          tone={health.data?.status === "ok" ? "green" : "default"}
        />
        <StatCard label="最新 Release" value={release?.version ?? "—"} detail={release ? "发布于 " + formatDate(release.published_at) : "没有已发布的正式版本"} icon={ShieldCheck} tone="blue" />
        <StatCard label="最新 Beta" value={beta?.version ?? "—"} detail={beta ? "发布于 " + formatDate(beta.published_at) : "没有已发布的测试版本"} icon={Package} tone="gold" />
        <StatCard label="已撤销版本" value={String(revoked)} detail={`共 ${list.length} 个版本记录`} icon={ShieldOff} tone={revoked > 0 ? "blue" : "default"} />
      </div>

      {versions.error && <AdminError message={versions.error} onRetry={reload} />}

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>版本列表</CardTitle>
              <CardDescription>按 SemVer 倒序排列。上游仅保留最新 3 个 Release 与 3 个 Beta 的产物。</CardDescription>
            </div>
            <span className="text-xs text-muted-foreground">{rows.length} / {list.length} 个版本</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Input className="w-full sm:w-56" placeholder="搜索版本号" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-32" aria-label="渠道"><SelectValue placeholder="全部渠道" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部渠道</SelectItem>
                <SelectItem value="release">Release</SelectItem>
                <SelectItem value="beta">Beta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-32" aria-label="状态"><SelectValue placeholder="全部状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {Object.entries(statusNames).map(([value, name]) => <SelectItem key={value} value={value}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasFilter && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setChannel("all"); setStatus("all"); }}>
                <RotateCcw data-icon="inline-start" />
                重置
              </Button>
            )}
          </div>
        </CardHeader>

        {versions.loading && !versions.data ? (
          <div className="p-4">
            <TableSkeleton rows={6} />
          </div>
        ) : rows.length === 0 ? (
          <AdminEmpty
            label={list.length === 0 ? "更新服务还没有任何版本记录。" : "没有符合当前筛选条件的版本。"}
            hint={list.length === 0 ? "发布流程上报后会自动出现在这里。" : "调整关键词或筛选条件后重试。"}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>版本</TableHead>
                <TableHead>渠道 / 状态</TableHead>
                <TableHead>产物</TableHead>
                <TableHead>发布时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.version}>
                  <TableCell>
                    <Link href={`/updates/${item.version}`} className="font-medium hover:underline">{item.version}</Link>
                    <p className="mt-1 text-xs text-muted-foreground">{item.release_tag ?? "无发布标签"}{item.force_update ? " · 强制更新" : ""}</p>
                  </TableCell>
                  <TableCell><div className="flex flex-wrap gap-1.5"><ChannelBadge channel={item.channel} /><StatusBadge status={item.status} /></div></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.artifacts.filter((artifact) => artifact.kind === "updater").length} 个更新器 · 共 {item.artifacts.length} 个
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(item.published_at)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={"管理版本：" + item.version}><MoreHorizontal /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link href={`/updates/${item.version}`}>查看详情</Link></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {item.status === "revoked"
                          ? <DropdownMenuItem onSelect={() => setRestoring(item.version)}><RotateCcw />恢复版本</DropdownMenuItem>
                          : <DropdownMenuItem variant="destructive" onSelect={() => setRevoking(item.version)}><ShieldOff />撤销版本</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {revoking && <RevokeDialog version={revoking} open={Boolean(revoking)} onOpenChange={(open) => !open && setRevoking(null)} onDone={reload} />}
      {restoring && <RestoreDialog version={restoring} open={Boolean(restoring)} onOpenChange={(open) => !open && setRestoring(null)} onDone={reload} />}
    </div>
  );
}
