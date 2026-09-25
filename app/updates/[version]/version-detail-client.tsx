"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ExternalLink, RefreshCw, RotateCcw, ShieldOff } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToneBadge, type Tone } from "@/components/dashboard/status-badge";
import { AdminEmpty, AdminError, TableSkeleton } from "@/components/dashboard/admin-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RevokeDialog, RestoreDialog } from "@/components/updates/release-dialogs";
import { useUpdateApi } from "@/lib/api/use-admin-data";
import { updateDownloadsSchema, updateVersionSchema } from "@/lib/api/schemas";
import { formatBytes, formatDateTime, shortDigest } from "@/lib/updates/format";

const MarkdownPreview = dynamic(() => import("@/components/announcements/markdown-preview"), {
  loading: () => <p role="status" className="text-sm text-muted-foreground">正在加载预览…</p>,
});

const kindNames: Record<string, string> = { updater: "更新器", installer: "安装包", portable: "便携版", signature: "签名", manifest: "清单", other: "其他" };
const kindTones: Record<string, Tone> = { updater: "sky", installer: "green", portable: "violet", signature: "outline", manifest: "amber", other: "neutral" };
const statusNames: Record<string, string> = { published: "已发布", revoked: "已撤销", uploading: "上传中", draft: "草稿", invalid: "无效" };
const statusTones: Record<string, Tone> = { published: "green", revoked: "red", uploading: "amber", draft: "neutral", invalid: "red" };

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid min-w-0 gap-1"><p className="text-xs text-muted-foreground">{label}</p><div className="min-w-0 text-sm">{children}</div></div>;
}

export default function VersionDetailClient({ version }: { version: string }) {
  const [kind, setKind] = useState("all");
  const [revoking, setRevoking] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const detail = useUpdateApi(`/api/admin/updates/versions/${encodeURIComponent(version)}`, updateVersionSchema);
  const downloads = useUpdateApi(`/api/admin/updates/downloads/${encodeURIComponent(version)}?include_updater=true`, updateDownloadsSchema);
  const reload = () => { detail.reload(); downloads.reload(); };

  const data = detail.data;
  const artifacts = useMemo(() => data?.artifacts.filter((item) => kind === "all" || item.kind === kind) ?? [], [data, kind]);
  const kinds = useMemo(() => [...new Set(data?.artifacts.map((item) => item.kind) ?? [])], [data]);
  const packages = useMemo(() => downloads.data?.downloads ?? [], [downloads.data]);
  const grouped = useMemo(() => {
    const map = new Map<string, typeof packages>();
    for (const item of packages) map.set(item.kind, [...(map.get(item.kind) ?? []), item]);
    return [...map.entries()];
  }, [packages]);

  const busy = detail.loading || downloads.loading;
  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader title={data?.version ?? version} description="查看该版本的元数据、Release notes 与全部产物，并可以撤销或恢复它。">
        <Button asChild variant="outline" size="sm">
          <Link href="/updates">
            <ArrowLeft data-icon="inline-start" />
            返回列表
          </Link>
        </Button>
        <Button variant="outline" size="sm" disabled={busy} onClick={reload}>
          <RefreshCw className={busy ? "animate-spin" : undefined} />
          刷新
        </Button>
        {data && (data.status === "revoked"
          ? <Button size="sm" onClick={() => setRestoring(true)}><RotateCcw data-icon="inline-start" />恢复版本</Button>
          : <Button variant="destructive" size="sm" onClick={() => setRevoking(true)}><ShieldOff data-icon="inline-start" />撤销版本</Button>)}
      </PageHeader>

      {detail.loading && !data && (
        <div className="space-y-4">
          <Card className="h-44 animate-pulse bg-muted/30" />
          <TableSkeleton rows={5} />
        </div>
      )}
      {detail.error && <AdminError message={detail.error} onRetry={reload} />}

      {data && (
        <>
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>版本信息</CardTitle>
              <CardDescription>{data.release_tag ? "发布标签 " + data.release_tag : "该版本没有关联的发布标签。"}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="渠道">
                <ToneBadge tone={data.channel === "beta" ? "amber" : data.channel === "release" ? "sky" : "outline"}>{data.channel === "beta" ? "Beta" : data.channel === "release" ? "Release" : data.channel}</ToneBadge>
              </Field>
              <Field label="状态"><ToneBadge tone={statusTones[data.status] ?? "neutral"}>{statusNames[data.status] ?? data.status}</ToneBadge></Field>
              <Field label="发布时间">{formatDateTime(data.published_at)}</Field>
              <Field label="强制更新">{data.force_update ? "是" : "否"}</Field>
              <Field label="最低版本要求">{data.minimum_version ?? "无"}</Field>
              <Field label="发布 ID">{data.release_id ?? "无"}</Field>
              <Field label="产物总数">{data.artifacts.length} 个（{data.artifacts.filter((item) => item.is_public).length} 个公开）</Field>
              <Field label="更新器产物">{data.artifacts.filter((item) => item.kind === "updater").length} 个</Field>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader><CardTitle>Release notes</CardTitle><CardDescription>来自发布记录，与更新清单中返回给启动器的 notes 一致。</CardDescription></CardHeader>
            <CardContent>
              {data.notes?.trim() ? <MarkdownPreview content={data.notes} /> : <p className="text-sm text-muted-foreground">该版本没有填写 Release notes。</p>}
            </CardContent>
          </Card>

          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="border-b pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>产物清单</CardTitle>
                  <CardDescription>包含签名等非公开文件；只有带有效 Tauri 签名的更新器产物会出现在更新清单里。</CardDescription>
                </div>
                {kinds.length > 1 && (
                  <Select value={kind} onValueChange={setKind}>
                    <SelectTrigger className="w-40" aria-label="筛选产物类型"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部类型</SelectItem>
                      {kinds.map((value) => <SelectItem key={value} value={value}>{kindNames[value] ?? value}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>

            {artifacts.length === 0 ? (
              <AdminEmpty label="该版本没有产物记录。" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>类型</TableHead>
                    <TableHead>平台 / 架构</TableHead>
                    <TableHead>文件</TableHead>
                    <TableHead>大小</TableHead>
                    <TableHead>SHA-256</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {artifacts.map((item) => (
                    <TableRow key={item.filename}>
                      <TableCell>
                        <ToneBadge tone={kindTones[item.kind] ?? "neutral"}>{kindNames[item.kind] ?? item.kind}</ToneBadge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {item.platform || "—"}{item.architecture ? " / " + item.architecture : ""}{item.variant ? " · " + item.variant : ""}
                      </TableCell>
                      <TableCell className="max-w-72 break-all">
                        <p className="font-medium">{item.display_name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.is_public ? "公开" : "非公开"}{item.signature ? " · 含 Tauri 签名" : ""}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs tabular-nums">{formatBytes(item.size)}</TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground" title={item.sha256 ?? ""}>{shortDigest(item.sha256)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>下载目录</CardTitle>
              <CardDescription>默认只包含安装包与便携版；这里额外包含更新器产物。“更新器”产物即启动器自动更新时实际下载的文件。</CardDescription>
            </CardHeader>
            <CardContent className="grid min-w-0 gap-4">
              {downloads.loading && !downloads.data ? (
                <p role="status" className="py-6 text-center text-sm text-muted-foreground">正在加载下载目录…</p>
              ) : downloads.status === 404 ? (
                <AdminEmpty label="该版本没有可下载的包。" hint="版本可能尚未发布，或产物已随保留策略移除；更早版本请到 GitHub Release 下载。" />
              ) : downloads.error ? (
                <AdminError message={downloads.error} onRetry={reload} />
              ) : grouped.length === 0 ? (
                <AdminEmpty label="该版本没有可下载的包。" />
              ) : grouped.map(([groupKind, items]) => (
                <div key={groupKind} className="grid gap-2">
                  <p className="text-sm font-medium">{kindNames[groupKind] ?? groupKind}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((item) => (
                      <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-muted">
                        <span className="min-w-0">
                          <span className="block truncate">{item.display_name}</span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.platform || "—"}{item.architecture ? " / " + item.architecture : ""} · {formatBytes(item.size)}</span>
                        </span>
                        <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">上游只保留最新 3 个 Release 与 3 个 Beta 的产物，更早版本的下载链接会自动跳转到 GitHub Release。</p>
            </CardContent>
          </Card>
        </>
      )}

      <RevokeDialog version={version} open={revoking} onOpenChange={setRevoking} onDone={reload} />
      <RestoreDialog version={version} open={restoring} onOpenChange={setRestoring} onDone={reload} />
    </div>
  );
}
