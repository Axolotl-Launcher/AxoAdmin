"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Coins, Command, LayoutDashboard, Menu, ReceiptText, Server, Settings, ShieldCheck, Users, X, KeyRound } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AdminSession } from "@/lib/auth/access";

const groups = [
  { label: "工作台", items: [{ label: "总览", href: "/", icon: LayoutDashboard }] },
  { label: "遥测中心", items: [{ label: "数据总览", href: "/telemetry", icon: Activity }, { label: "错误分析", href: "/telemetry/errors", icon: BarChart3 }, { label: "系统状态", href: "/telemetry/system", icon: Server }] },
  { label: "赞助与权益", items: [{ label: "用户", href: "/sponsors/users", icon: Users }, { label: "赞助订单", href: "/sponsors/orders", icon: ReceiptText }, { label: "CDK 管理", href: "/sponsors/cdks", icon: Coins }] },
  { label: "运营", items: [{ label: "API Key", href: "/operations/api-keys", icon: KeyRound }, { label: "API 用量", href: "/operations/usage", icon: Activity }] },
  { label: "平台", items: [{ label: "审计日志", href: "/audit-logs", icon: ShieldCheck }, { label: "设置", href: "/settings", icon: Settings }] },
];

export function AdminShell({ children, session }: { children: React.ReactNode; session: AdminSession | null }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return <div className="min-h-svh bg-background">
    <div className={cn("fixed inset-0 z-40 bg-black/30 md:hidden", !open && "hidden")} onClick={() => setOpen(false)} />
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background px-4 py-5 transition-transform md:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex items-center gap-3 px-2"><div className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground"><Command className="size-4" /></div><div><p className="text-sm font-semibold">AxoAdmin</p><p className="text-xs text-muted-foreground">Axolotl 管理中心</p></div><Button className="ml-auto md:hidden" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="关闭导航"><X className="size-4" /></Button></div>
      <nav className="mt-8 flex-1 space-y-6">{groups.map((group) => <div key={group.label}><p className="mb-2 px-2 text-xs font-medium text-muted-foreground">{group.label}</p><div className="space-y-1">{group.items.map((item) => { const Icon = item.icon; const active = item.href === "/" ? path === "/" : path.startsWith(item.href); return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("flex h-10 items-center gap-3 rounded-2xl px-3 text-sm transition-colors", active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon className="size-4" />{item.label}</Link>; })}</div></div>)}</nav>
      <div className="rounded-2xl border bg-muted/40 p-3 text-xs text-muted-foreground"><div className="flex items-center gap-2 font-medium text-foreground"><ShieldCheck className="size-3.5 text-emerald-600" />Cloudflare Access</div><p className="mt-2 leading-5">GitHub axolotl-launcher 组织成员可访问。</p></div>
    </aside>
    <div className="md:pl-64"><header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/80 px-4 backdrop-blur-md sm:px-6"><Button className="mr-2 md:hidden" variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="打开导航"><Menu className="size-4" /></Button><div className="min-w-0"><p className="truncate text-sm font-medium">{path === "/" ? "工作台" : path.includes("cdks") ? "CDK 管理" : path.includes("users") ? "用户" : path.includes("orders") ? "赞助订单" : path.includes("telemetry") ? "遥测中心" : path.includes("api-keys") ? "API Key" : path.includes("usage") ? "API 用量" : "管理中心"}</p><p className="hidden text-xs text-muted-foreground sm:block">统一运营与管理控制台</p></div><div className="ml-auto flex items-center gap-2">
      {session ? <><span className="hidden max-w-48 truncate text-xs text-muted-foreground sm:block">{session.identity.email ?? session.identity.name}</span><span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-400 sm:flex"><span className="size-1.5 rounded-full bg-emerald-500" />已认证</span><Button asChild variant="ghost" size="sm"><a href={session.logoutUrl}>退出</a></Button></> : <><span className="text-xs text-destructive">未认证</span><Button asChild variant="outline" size="sm"><a href="/cdn-cgi/access/login">登录</a></Button></>}
    </div></header><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main></div>
  </div>;
}
