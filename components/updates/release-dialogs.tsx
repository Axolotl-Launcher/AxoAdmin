"use client";

import { useEffect, useState } from "react";
import { RotateCcw, ShieldOff, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { mutateRelease, pendingCleanup, rememberCleanup, ReleaseActionError, type ReleaseAction, type ReleaseActionResult } from "@/lib/updates/actions";

type DialogProps = { version: string; open: boolean; onOpenChange: (open: boolean) => void; onDone: (result?: ReleaseActionResult) => void | Promise<unknown> };

export function RevokeDialog(props: DialogProps) { return <ReleaseActionDialog {...props} action="revoke" />; }

export function RestoreDialog(props: DialogProps) { return <ReleaseActionDialog {...props} action="restore" />; }
export function ForceUpdateDialog(props: DialogProps & { enabled: boolean }) { return <ReleaseActionDialog {...props} action="force-update" />; }
export function DeleteVersionDialog(props: DialogProps) { return <ReleaseActionDialog {...props} action="delete" />; }

function ReleaseActionDialog({ version, open, onOpenChange, onDone, action, enabled = false }: DialogProps & { action: Exclude<ReleaseAction, "cleanup">; enabled?: boolean }) {
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<ReleaseActionResult | null>(null);
  useEffect(() => { if (open) { setReason(""); setConfirmation(""); setError(""); setSaved(action === "delete" && pendingCleanup().includes(version) ? { files_cleanup_pending: true } : null); } }, [open, version, action, enabled]);
  const labels = { revoke: "撤销版本", restore: "恢复版本", "force-update": enabled ? "启用强制更新" : "关闭强制更新", delete: "删除版本" };
  const descriptions = { revoke: "撤销后，该版本不再参与自动更新选择。元数据和签名保留，可以恢复。", restore: "恢复前会验证制品元数据与更新器签名，不会重新下载安装包。", "force-update": enabled ? "让支持此策略的启动器跳过 Release 等待期。仍按渠道与版本规则选择更新，不会自动恢复已撤销版本。" : "恢复正常更新策略，保留发布时间、版本状态和制品元数据。", delete: "永久删除该版本、制品元数据、关联 Webhook 与本地清单。不会删除远端发布文件或清除客户端缓存。" };
  async function submit() {
    if (busy) return;
    if (!saved && action === "revoke" && !reason.trim()) { setError("请填写撤销原因。"); return; }
    if (!saved && action === "delete" && confirmation !== version) { setError("请完整输入版本号以确认删除。"); return; }
    setBusy(true); setError("");
    try {
      let result = saved;
      if (!result || result.files_cleanup_pending) {
        result = await mutateRelease(version, result?.files_cleanup_pending ? "cleanup" : action, reason, enabled);
        setSaved(result);
        if (action === "delete") rememberCleanup(version, Boolean(result.files_cleanup_pending));
      }
      await onDone(result);
      if (result.files_cleanup_pending) { setError("版本已删除，但隔离文件尚未清理完。可以重试清理，或稍后从版本列表继续处理。"); return; }
      toast.success(`${labels[action]}成功：${version}`);
      onOpenChange(false);
    } catch (failure) { if (failure instanceof ReleaseActionError && failure.code === "version_exists") { rememberCleanup(version, false); setSaved(null); setConfirmation(""); } setError(failure instanceof Error ? failure.message : "操作失败，请稍后重试。"); }
    finally { setBusy(false); }
  }
  const Icon = action === "delete" ? Trash2 : action === "force-update" ? Zap : action === "revoke" ? ShieldOff : RotateCcw;
  return <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}><DialogContent className="sm:max-w-lg" showCloseButton={!busy} onEscapeKeyDown={(event) => busy && event.preventDefault()} onPointerDownOutside={(event) => busy && event.preventDefault()}>
    <DialogHeader><DialogTitle>{labels[action]} {version}？</DialogTitle><DialogDescription className="break-words">{descriptions[action]}{action === "force-update" ? "此设置统一作用于该版本的全部更新器产物。" : ""}</DialogDescription></DialogHeader>
    <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      {!saved && <><div className="grid gap-2"><Label htmlFor={`release-reason-${action}`}>操作原因{action === "revoke" ? "（必填）" : "（选填）"}</Label><Textarea id={`release-reason-${action}`} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={3} disabled={busy} placeholder="记录本次操作的原因" /><p className="text-xs text-muted-foreground">操作人取自当前登录身份。</p></div>{action === "delete" && <div className="grid gap-2"><Label htmlFor="delete-version-confirmation">输入 {version} 确认删除</Label><Input id="delete-version-confirmation" autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} /></div>}</>}
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <DialogFooter><Button variant="outline" type="button" disabled={busy} onClick={() => onOpenChange(false)}>{saved?.files_cleanup_pending ? "稍后处理" : "取消"}</Button><Button type="submit" variant={action === "delete" || action === "revoke" ? "destructive" : "default"} disabled={busy || (!saved && action === "delete" && confirmation !== version)}><Icon />{busy ? "正在处理…" : saved?.files_cleanup_pending ? "重试清理" : saved ? "重试刷新" : `确认${labels[action]}`}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
