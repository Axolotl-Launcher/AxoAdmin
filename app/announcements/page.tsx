"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Save, RefreshCw, Pencil, Send, Archive, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Announcement, AnnouncementInput } from "@/lib/announcements/schema";

const empty: AnnouncementInput = { title: "", summary: "", content: "", type: "notification", priority: "normal", starts_at: null, ends_at: null, target_version: null, target_channel: null, action_label: null, action_url: null };
const statusNames = { draft: "草稿", published: "已发布", archived: "已归档" };
const control = "w-full rounded-md border bg-background p-2 text-sm";
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
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await request("/api/admin/announcements")); }
    catch (error) { setError(error instanceof Error ? error.message : "加载失败"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  function edit(item: Announcement) {
    const next = { ...empty };
    for (const key of Object.keys(empty) as (keyof AnnouncementInput)[]) Object.assign(next, { [key]: item[key] });
    setForm(next); setEditing(item.id);
  }
  async function mutate(id?: string, action?: string) {
    if (action === "delete" && !window.confirm("永久删除这条公告？")) return;
    setBusy(true); setError("");
    try {
      const target = id ?? editing;
      await request("/api/admin/announcements" + (target ? "/" + target : ""), {
        method: action === "delete" ? "DELETE" : target ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: action === "delete" ? undefined : JSON.stringify(action ? { action } : form),
      });
      if (!action || (action === "delete" && id === editing)) { setEditing(null); setForm(empty); }
      await load();
    } catch (error) { setError(error instanceof Error ? error.message : "操作失败"); }
    finally { setBusy(false); }
  }
  return <div className="grid gap-6">
    <header className="flex items-center justify-between gap-4"><h1 className="text-xl font-semibold">公告管理</h1><Button variant="outline" disabled={busy || loading} onClick={() => { setError(""); void load(); }}><RefreshCw />刷新</Button></header>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <form className="grid gap-4 border-b pb-6" onSubmit={event => { event.preventDefault(); void mutate(); }}>
      <div className="flex items-center justify-between"><h2 className="text-base font-medium">{editing ? "编辑公告" : "新建公告"}</h2><Button type="button" variant="ghost" disabled={busy} onClick={() => { setEditing(null); setForm(empty); }}><Plus />新建</Button></div>
      <fieldset disabled={busy} className="grid min-w-0 gap-4 border-0 p-0 sm:grid-cols-2">
        <label className="grid gap-1 sm:col-span-2">标题<input required maxLength={120} className={control} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label>
        <label className="grid gap-1 sm:col-span-2">摘要<input maxLength={300} className={control} value={form.summary ?? ""} onChange={event => setForm({ ...form, summary: event.target.value })} /></label>
        <label className="grid gap-1 sm:col-span-2">正文<textarea required maxLength={20000} rows={8} className={control} value={form.content} onChange={event => setForm({ ...form, content: event.target.value })} /></label>
        <label className="grid gap-1">展示类型<select className={control} value={form.type} onChange={event => setForm({ ...form, type: event.target.value as AnnouncementInput["type"] })}><option value="notification">右上角 Popup 通知</option><option value="modal">启动弹窗</option></select></label>
        <label className="grid gap-1">优先级<select className={control} value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value as AnnouncementInput["priority"] })}><option value="low">低</option><option value="normal">普通</option><option value="high">重要</option><option value="critical">紧急</option></select></label>
        {(["starts_at", "ends_at"] as const).map(key => <label key={key} className="grid gap-1">{key === "starts_at" ? "开始时间（本地时区，留空为立即）" : "结束时间（可选）"}<input type="datetime-local" className={control} value={localDate(form[key])} onChange={event => setForm({ ...form, [key]: event.target.value ? new Date(event.target.value).toISOString() : null })} /></label>)}
        <label className="grid gap-1">目标版本（精确匹配，可选）<input maxLength={80} className={control} value={form.target_version ?? ""} onChange={event => setForm({ ...form, target_version: event.target.value || null })} /></label>
        <label className="grid gap-1">发布渠道<select className={control} value={form.target_channel ?? ""} onChange={event => setForm({ ...form, target_channel: event.target.value as "stable" | "beta" || null })}><option value="">全部</option><option value="stable">Stable</option><option value="beta">Beta</option></select></label>
        <label className="grid gap-1">操作按钮文字<input maxLength={80} className={control} value={form.action_label ?? ""} onChange={event => setForm({ ...form, action_label: event.target.value || null })} /></label>
        <label className="grid gap-1">操作链接<input type="url" className={control} value={form.action_url ?? ""} onChange={event => setForm({ ...form, action_url: event.target.value || null })} /></label>
      </fieldset>
      <div><Button disabled={busy} type="submit"><Save />{editing ? "保存修改" : "保存草稿"}</Button></div>
    </form>
    <section className="grid gap-3"><h2 className="text-base font-medium">公告列表</h2>
      {loading && <p role="status">加载中…</p>}
      {!loading && !items.length && <p className="text-muted-foreground">暂无公告</p>}
      {items.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3">
        <div className="min-w-0 flex-1"><h3 className="break-words text-sm font-medium">{item.title}</h3><p className="text-xs text-muted-foreground">{statusNames[item.status]} · {item.type === "modal" ? "启动弹窗" : "Popup"} · {new Date(item.created_at).toLocaleString()}</p></div>
        <div className="flex flex-wrap gap-2"><Button disabled={busy} variant="outline" onClick={() => edit(item)}><Pencil />编辑</Button>{item.status !== "published" && <Button disabled={busy} onClick={() => void mutate(item.id, "publish")}><Send />发布</Button>}{item.status !== "draft" && <Button disabled={busy} variant="outline" onClick={() => void mutate(item.id, "draft")}><Undo2 />撤回</Button>}{item.status !== "archived" && <Button disabled={busy} variant="outline" onClick={() => void mutate(item.id, "archive")}><Archive />归档</Button>}<Button disabled={busy} variant="destructive" onClick={() => void mutate(item.id, "delete")}><Trash2 />删除</Button></div>
      </article>)}
    </section>
  </div>;
}
