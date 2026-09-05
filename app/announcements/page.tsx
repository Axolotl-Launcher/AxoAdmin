"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Archive, MoreHorizontal, Pencil, Plus, RefreshCw, Save, Send, Trash2, Undo2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { announcementInput, type Announcement, type AnnouncementInput } from "@/lib/announcements/schema";

const empty: AnnouncementInput = { title: "", summary: "", content: "", type: "notification", priority: "normal", starts_at: null, ends_at: null, target_version: null, target_channel: null, action_label: null, action_url: null };
const statusNames = { draft: "草稿", published: "已发布", archived: "已归档" };
const priorityNames = { low: "低", normal: "普通", high: "重要", critical: "紧急" };
const MarkdownPreview = dynamic(() => import("@/components/announcements/markdown-preview"), {
  loading: () => <p role="status" className="text-sm text-muted-foreground">正在加载预览…</p>,
});

function Field({ id, label, children, wide = false }: { id: string; label: string; children: ReactNode; wide?: boolean }) {
  return <div className={wide ? "grid gap-2 sm:col-span-2" : "grid min-w-0 gap-2"}><Label htmlFor={id}>{label}</Label>{children}</div>;
}

function localDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

async function request(path: string, init?: RequestInit) {
  const response = await fetch(path, init);
  if (response.status === 204) return null;
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? "公告操作失败");
  return result;
}

export default function Announcements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [form, setForm] = useState<AnnouncementInput>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setItems(await request("/api/admin/announcements")); }
    catch (error) { setError(error instanceof Error ? error.message : "加载失败"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function edit(item?: Announcement) {
    const next = { ...empty };
    if (item) {
      for (const key of Object.keys(empty) as (keyof AnnouncementInput)[]) Object.assign(next, { [key]: item[key] });
    }
    setForm(next);
    setEditing(item?.id ?? null);
    setFormError("");
    setEditorOpen(true);
    setPreviewOpen(false);
  }

  async function mutate(id?: string, action?: "publish" | "draft" | "archive" | "delete") {
    if (busy) return;
    setBusy(true);
    setError("");
    setFormError("");
    setDeleteError("");
    try {
      const target = id ?? editing;
      const input = action ? { action } : announcementInput.parse(form);
      await request("/api/admin/announcements" + (target ? "/" + target : ""), {
        method: action === "delete" ? "DELETE" : target ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: action === "delete" ? undefined : JSON.stringify(input),
      });
      if (!action) { setEditorOpen(false); setEditing(null); setForm(empty); }
      if (action === "delete") setDeleting(null);
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "操作失败";
      if (!action) {
        const validation = announcementInput.safeParse(form);
        setFormError(validation.success ? message : validation.error.issues.map(issue => issue.message).join("；"));
      } else if (action === "delete") setDeleteError(message);
      else setError(message);
    } finally { setBusy(false); }
  }

  return <div className="grid min-w-0 gap-6">
    <PageHeader title="公告管理" description="管理客户端通知与启动弹窗，保存草稿后可单独发布。">
      <Button variant="outline" disabled={busy || loading} onClick={() => void load()}><RefreshCw className={loading ? "animate-spin" : undefined} />刷新</Button>
      <Button disabled={busy} onClick={() => edit()}><Plus />新建公告</Button>
    </PageHeader>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <Card className="min-w-0">
      <CardHeader><CardTitle>公告列表</CardTitle><CardDescription>按创建时间倒序排列，最多显示最近 500 条。发布状态不代表当前处于投放时段。</CardDescription></CardHeader>
      <CardContent>
        {loading ? <p role="status" className="py-12 text-center text-sm text-muted-foreground">正在加载公告…</p> : error && !items.length ? <p className="py-12 text-center text-sm text-muted-foreground">加载未成功，请检查配置后刷新。</p> : !items.length ? <div className="grid justify-items-center gap-3 py-12"><p className="text-sm text-muted-foreground">暂无公告，创建第一条草稿开始使用。</p><Button variant="outline" onClick={() => edit()}><Plus />新建公告</Button></div> :
          <Table>
            <TableHeader><TableRow><TableHead>公告内容</TableHead><TableHead>状态 / 优先级</TableHead><TableHead>投放范围</TableHead><TableHead>创建时间</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
            <TableBody>{items.map(item => <TableRow key={item.id}>
              <TableCell className="min-w-48 whitespace-normal"><p className="max-w-md break-words font-medium">{item.title}</p><p className="mt-1 line-clamp-2 max-w-md break-words text-xs text-muted-foreground">{item.summary || item.content}</p></TableCell>
              <TableCell><div className="flex flex-wrap gap-1.5"><Badge variant={item.status === "published" ? "default" : "secondary"}>{statusNames[item.status]}</Badge><Badge variant={item.priority === "critical" ? "destructive" : "outline"}>{priorityNames[item.priority]}</Badge></div></TableCell>
              <TableCell><p>{item.type === "modal" ? "启动弹窗" : "Popup 通知"}</p><p className="mt-1 text-xs text-muted-foreground">{item.target_channel ?? "全部渠道"} · {item.target_version ?? "全部版本"}</p></TableCell>
              <TableCell className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</TableCell>
              <TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={busy} aria-label={"管理公告：" + item.title}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => edit(item)}><Pencil />编辑</DropdownMenuItem>
                {item.status !== "published" && <DropdownMenuItem onSelect={() => void mutate(item.id, "publish")}><Send />发布</DropdownMenuItem>}
                {item.status !== "draft" && <DropdownMenuItem onSelect={() => void mutate(item.id, "draft")}><Undo2 />撤回为草稿</DropdownMenuItem>}
                {item.status !== "archived" && <DropdownMenuItem onSelect={() => void mutate(item.id, "archive")}><Archive />归档</DropdownMenuItem>}
                <DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={() => { setDeleteError(""); setDeleting(item); }}><Trash2 />删除</DropdownMenuItem>
              </DropdownMenuContent></DropdownMenu></TableCell>
            </TableRow>)}</TableBody>
          </Table>}
      </CardContent>
    </Card>
    <Dialog open={editorOpen} onOpenChange={open => { if (!busy) setEditorOpen(open); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>{editing ? "编辑公告" : "新建公告"}</DialogTitle><DialogDescription>{editing ? "保存后立即更新公告内容，原发布状态保持不变。" : "填写内容及投放规则，保存为草稿后再发布。"}</DialogDescription></DialogHeader>
        <form className="grid gap-6" onSubmit={event => { event.preventDefault(); void mutate(); }}>
          {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
          <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
            <legend className="mb-4 text-sm font-medium">公告内容</legend>
            <Field id="title" label="标题（必填）" wide><Input id="title" required maxLength={120} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></Field>
            <Field id="summary" label="摘要" wide><Input id="summary" maxLength={300} value={form.summary ?? ""} onChange={event => setForm({ ...form, summary: event.target.value })} /></Field>
            <Field id="content" label="正文（必填，支持 Markdown）" wide>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p id="content-help" className="text-xs text-muted-foreground">支持标题、列表、链接、图片、表格及代码块。Popup 先显示纯文本摘要，点击查看后展示完整正文。</p>
                <Button type="button" variant="outline" size="sm" aria-expanded={previewOpen} aria-controls="content-preview" onClick={() => setPreviewOpen(open => !open)}>{previewOpen ? "收起预览" : "预览正文"}</Button>
              </div>
              <Textarea id="content" aria-describedby="content-help" required maxLength={20000} rows={7} className="min-h-40" value={form.content} onChange={event => setForm({ ...form, content: event.target.value })} />
              {previewOpen && <section id="content-preview" aria-label="Markdown 正文预览" className="grid gap-3 rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">与启动器使用相同的 Markdown 配置和 HTML 安全过滤规则；此处仅预览正文，字体和弹窗外观以启动器为准。修改正文会同步更新。</p>
                <MarkdownPreview content={form.content} />
              </section>}
            </Field>
          </fieldset>
          <fieldset disabled={busy} className="grid min-w-0 gap-4 border-t pt-4 sm:grid-cols-2">
            <legend className="pr-2 text-sm font-medium">投放规则</legend>
            <Field id="type" label="展示类型"><Select disabled={busy} value={form.type} onValueChange={value => setForm({ ...form, type: value as AnnouncementInput["type"] })}><SelectTrigger id="type" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="notification">右上角 Popup 通知</SelectItem><SelectItem value="modal">启动弹窗</SelectItem></SelectContent></Select></Field>
            <Field id="priority" label="优先级"><Select disabled={busy} value={form.priority} onValueChange={value => setForm({ ...form, priority: value as AnnouncementInput["priority"] })}><SelectTrigger id="priority" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(priorityNames).map(([value, name]) => <SelectItem key={value} value={value}>{name}</SelectItem>)}</SelectContent></Select></Field>
            {(["starts_at", "ends_at"] as const).map(key => <Field key={key} id={key} label={key === "starts_at" ? "开始时间（本地时区，留空为立即）" : "结束时间（本地时区，可选）"}><Input id={key} type="datetime-local" value={localDate(form[key])} onChange={event => setForm({ ...form, [key]: event.target.value ? new Date(event.target.value).toISOString() : null })} /></Field>)}
            <Field id="target_version" label="目标版本（精确匹配，可选）"><Input id="target_version" maxLength={80} value={form.target_version ?? ""} onChange={event => setForm({ ...form, target_version: event.target.value || null })} /></Field>
            <Field id="target_channel" label="发布渠道"><Select disabled={busy} value={form.target_channel ?? "all"} onValueChange={value => setForm({ ...form, target_channel: value === "all" ? null : value as "stable" | "beta" })}><SelectTrigger id="target_channel" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部渠道</SelectItem><SelectItem value="stable">Stable</SelectItem><SelectItem value="beta">Beta</SelectItem></SelectContent></Select></Field>
          </fieldset>
          <fieldset disabled={busy} className="grid min-w-0 gap-4 border-t pt-4 sm:grid-cols-2">
            <legend className="pr-2 text-sm font-medium">可选外部链接按钮</legend>
            <p className="text-xs text-muted-foreground sm:col-span-2">文字和链接需同时填写，例如“查看更新详情”。全部留空不会显示额外按钮；启动器仍自带关闭和查看公告等操作，无需在这里配置。</p>
            <Field id="action_label" label="按钮文字"><Input id="action_label" maxLength={80} value={form.action_label ?? ""} onChange={event => setForm({ ...form, action_label: event.target.value || null })} /></Field>
            <Field id="action_url" label="链接（HTTP / HTTPS）"><Input id="action_url" type="url" maxLength={2048} value={form.action_url ?? ""} onChange={event => setForm({ ...form, action_url: event.target.value || null })} /></Field>
          </fieldset>
          <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setEditorOpen(false)}>取消</Button><Button disabled={busy} type="submit"><Save />{busy ? "正在保存…" : editing ? "保存修改" : "保存草稿"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <AlertDialog open={Boolean(deleting)} onOpenChange={open => { if (!open && !busy) setDeleting(null); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>永久删除公告？</AlertDialogTitle><AlertDialogDescription className="break-words">“{deleting?.title}”将被永久删除，此操作无法撤销。</AlertDialogDescription></AlertDialogHeader>
        {deleteError && <Alert variant="destructive"><AlertDescription>{deleteError}</AlertDescription></Alert>}
        <AlertDialogFooter><AlertDialogCancel disabled={busy}>取消</AlertDialogCancel><Button variant="destructive" disabled={busy} onClick={() => deleting && void mutate(deleting.id, "delete")}><Trash2 />{busy ? "正在删除…" : "确认删除"}</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
