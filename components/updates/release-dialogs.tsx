"use client";

import { useEffect, useState } from "react";
import { RotateCcw, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

async function post(path: string, body: Record<string, unknown>) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error?.message ?? "操作失败，请稍后重试。");
  return result;
}

export function RevokeDialog({ version, open, onOpenChange, onDone }: { version: string; open: boolean; onOpenChange: (open: boolean) => void; onDone: () => void | Promise<void> }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setReason(""); setError(""); } }, [open, version]);

  async function submit() {
    if (busy) return;
    if (!reason.trim()) { setError("请填写撤销原因，原因会写入发布审计日志。"); return; }
    setBusy(true);
    setError("");
    try {
      await post(`/api/admin/updates/versions/${encodeURIComponent(version)}/revoke`, { reason: reason.trim() });
      toast.success(`已成功撤销版本 ${version}`);
      onOpenChange(false);
      await onDone();
    } catch (error) {
      const message = error instanceof Error ? error.message : "撤销失败";
      setError(message);
      toast.error(message);
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>撤销版本 {version}？</DialogTitle>
          <DialogDescription className="break-words">
            撤销后该版本会立即从更新选择中移除，已安装的启动器不会再被更新到它。产物文件仍然保留，可以再恢复。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="revoke-reason">撤销原因（必填）</Label>
            <Textarea
              id="revoke-reason"
              rows={3}
              maxLength={500}
              value={reason}
              disabled={busy}
              placeholder="例如：启动后无法进入主界面，已回滚"
              onChange={(event) => setReason(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">操作人会记录为当前 Cloudflare Access 身份，无法在此修改。</p>
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" variant="destructive" disabled={busy}>
              <ShieldOff />
              {busy ? "正在撤销…" : "确认撤销"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RestoreDialog({ version, open, onOpenChange, onDone }: { version: string; open: boolean; onOpenChange: (open: boolean) => void; onDone: () => void | Promise<void> }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setError(""); }, [open, version]);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await post(`/api/admin/updates/versions/${encodeURIComponent(version)}/restore`, {});
      toast.success(`已成功恢复版本 ${version}`);
      onOpenChange(false);
      await onDone();
    } catch (error) {
      const message = error instanceof Error ? error.message : "恢复失败";
      setError(message);
      toast.error(message);
    } finally { setBusy(false); }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>恢复版本 {version}？</AlertDialogTitle>
          <AlertDialogDescription className="break-words">
            恢复前更新服务会校验本地产物完整性，更新器产物必须仍有有效的 Tauri 签名，否则恢复会失败。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>取消</AlertDialogCancel>
          <Button disabled={busy} onClick={() => void submit()}>
            <RotateCcw />
            {busy ? "正在恢复…" : "确认恢复"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
