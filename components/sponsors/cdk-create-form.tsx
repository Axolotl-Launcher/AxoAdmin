"use client";

import { useState } from "react";
import { Copy, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CdkCreateForm() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("990");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setResult([]);
    try {
      const response = await fetch("/api/admin/sponsors/cdks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount_fen: Number(amount), quantity: Number(quantity), note }),
      });
      const body = (await response.json()) as { cdks?: string[]; message?: string };
      if (!response.ok) throw new Error(body.message ?? "生成失败");
      setResult(body.cdks ?? []);
    } catch (error) {
      setResult([error instanceof Error ? error.message : "生成失败"]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) { setResult([]); setBusy(false); } }}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        生成 CDK
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>生成 CDK</DialogTitle>
          <DialogDescription>金额使用人民币分保存。完整 CDK 仅在生成成功后展示一次。</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="cdk-amount">每个 CDK 金额（分）</Label>
              <Input id="cdk-amount" type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cdk-quantity">数量</Label>
              <Input id="cdk-quantity" type="number" min="1" max="1000" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cdk-note">备注</Label>
            <Input id="cdk-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="可选" />
          </div>
          {result.length > 0 && (
            <div className="grid gap-2 rounded-2xl border border-border bg-muted/40 p-3">
              <p className="text-sm font-medium">生成结果</p>
              {result.map((code, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input readOnly value={code} className="font-mono text-xs" aria-label={`CDK ${index + 1}`} />
                  <Button type="button" variant="outline" size="icon-sm" onClick={() => navigator.clipboard.writeText(code)} aria-label="复制 CDK">
                    <Copy />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              确认生成
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}