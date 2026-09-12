"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { CloudDownload, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToneBadge } from "@/components/dashboard/status-badge";
import { AdminEmpty, AdminError, AdminLoading } from "@/components/dashboard/admin-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUpdateApi } from "@/lib/api/use-admin-data";
import { updateDownloadsSchema, updateManifestSchema } from "@/lib/api/schemas";
import { formatBytes, formatDateTime } from "@/lib/updates/format";

const MarkdownPreview = dynamic(() => import("@/components/announcements/markdown-preview"), {
  loading: () => <p role="status" className="text-sm text-muted-foreground">正在加载预览…</p>,
});

const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z][0-9A-Za-z.-]*)?(?:\+[0-9A-Za-z.-]+)?$/;
const platformNames: Record<string, string> = {
  "windows-x86_64": "Windows x86_64",
  "linux-x86_64": "Linux x86_64",
  "linux-aarch64": "Linux aarch64",
  "darwin-x86_64": "macOS x86_64",
  "darwin-aarch64": "macOS aarch64",
};
function ChannelCard({ channel, title }: { channel: "release" | "beta"; title: string }) {
  const downloads = useUpdateApi(`/api/admin/updates/downloads/latest?channel=${channel}`, updateDownloadsSchema);
  const data = downloads.data;
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{title}<ToneBadge tone={channel === "beta" ? "amber" : "sky"}>{channel}</ToneBadge></CardTitle>
        <CardDescription>{data ? `最新完整包来自版本 ${data.version}，发布于 ${formatDateTime(data.published_at)}。` : "默认只包含安装包与便携版。"}</CardDescription>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-3">
        {downloads.status === 404 || downloads.status === 204 ? (
          <AdminEmpty label="该渠道目前没有可下载的完整包。" />
        ) : downloads.error ? (
          <AdminError message={downloads.error} onRetry={downloads.reload} />
        ) : downloads.loading && !data ? (
          <p role="status" className="py-6 text-center text-sm text-muted-foreground">正在加载…</p>
        ) : !data || data.downloads.length === 0 ? (
          <AdminEmpty label="该渠道目前没有可下载的完整包。" />
        ) : (
          <div className="grid gap-2">
            {data.downloads.map((item) => (
              <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-muted">
                <span className="min-w-0">
                  <span className="block truncate">{item.display_name}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.platform || "—"}{item.architecture ? " / " + item.architecture : ""} · {formatBytes(item.size)}</span>
                </span>
                <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Channels() {
  const [channel, setChannel] = useState("release");
  const [platform, setPlatform] = useState("windows-x86_64");
  const [currentVersion, setCurrentVersion] = useState("1.9.5");
  const valid = semver.test(currentVersion.trim());
  const query = `?channel=${channel}&platform=${platform}&current_version=${encodeURIComponent(currentVersion.trim())}`;
  const manifest = useUpdateApi(`/api/admin/updates/latest${query}`, updateManifestSchema, valid);

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader title="渠道分发" description="查看 release 与 beta 两个渠道当前对外提供的下载包，并预览启动器实际会收到的更新清单。" />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChannelCard channel="release" title="Release 渠道" />
        <ChannelCard channel="beta" title="Beta 渠道" />
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>更新清单预览</CardTitle>
          <CardDescription>以指定渠道、平台与客户端当前版本请求 /latest，看到的就是启动器自动更新时会收到的内容。没有可用更新时更新服务返回 204，这里会显示为「已是最新」。</CardDescription>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="manifest-channel">渠道</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger id="manifest-channel" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="release">release</SelectItem>
                  <SelectItem value="beta">beta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manifest-platform">平台</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="manifest-platform" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(platformNames).map(([value, name]) => <SelectItem key={value} value={value}>{name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manifest-version">客户端当前版本</Label>
              <Input id="manifest-version" value={currentVersion} onChange={(event) => setCurrentVersion(event.target.value)} placeholder="1.9.5" aria-invalid={!valid} />
            </div>
          </div>

          {!valid && <Alert variant="destructive"><AlertDescription>客户端版本必须是规范化的 SemVer，例如 1.9.5 或 1.9.6-beta.4。</AlertDescription></Alert>}

          {valid && manifest.loading && <AdminLoading label="正在请求更新清单…" />}
          {valid && !manifest.loading && manifest.error && <AdminError message={manifest.error} onRetry={manifest.reload} />}
          {valid && !manifest.loading && !manifest.error && manifest.status === 204 && (
            <AdminEmpty label={`${platformNames[platform] ?? platform} 的 ${channel} 渠道已是最新版本。`} hint="更新服务返回 204，表示当前版本没有可用的更新。" />
          )}
          {valid && !manifest.loading && manifest.data && (
            <div className="grid min-w-0 gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <ToneBadge tone="green">可更新至 {manifest.data.version}</ToneBadge>
                {manifest.data.force_update ? <ToneBadge tone="red">强制更新</ToneBadge> : <ToneBadge tone="outline">可选更新</ToneBadge>}
                <span className="text-xs text-muted-foreground">发布时间 {formatDateTime(manifest.data.pub_date)}</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>更新平台</TableHead><TableHead>下载地址</TableHead><TableHead>Tauri 签名</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(manifest.data.platforms).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="whitespace-nowrap">{platformNames[key] ?? key}<p className="mt-1 text-xs text-muted-foreground">{key}</p></TableCell>
                      <TableCell className="max-w-80 break-all"><a className="underline underline-offset-2" href={value.url} target="_blank" rel="noreferrer">{value.url}</a></TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{value.signature ? "已签名（" + value.signature.length + " 字节）" : "缺少签名"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {manifest.data.notes?.trim() && (
                <div className="grid gap-3 rounded-xl border p-4">
                  <p className="flex items-center gap-2 text-sm font-medium"><CloudDownload className="size-4" />{manifest.data.version} 的更新说明</p>
                  <MarkdownPreview content={manifest.data.notes} />
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">提示：更新清单只会返回带有效 Tauri 签名的更新器产物；“更新器”产物即自动更新时实际下载的文件，与安装包不一定同名。签名内容展示为长度而非原文。</p>
        </CardContent>
      </Card>
    </div>
  );
}
