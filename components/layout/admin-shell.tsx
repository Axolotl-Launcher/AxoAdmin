"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Coins, Command, KeyRound, LayoutDashboard, ReceiptText, Server, Settings, ShieldCheck, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AdminSession } from "@/lib/auth/access";

const groups = [
  { label: "工作台", items: [{ label: "总览", href: "/", icon: LayoutDashboard }] },
  { label: "遥测中心", items: [{ label: "数据总览", href: "/telemetry", icon: Activity }, { label: "错误分析", href: "/telemetry/errors", icon: BarChart3 }, { label: "系统状态", href: "/telemetry/system", icon: Server }] },
  { label: "赞助与权益", items: [{ label: "用户", href: "/sponsors/users", icon: Users }, { label: "赞助订单", href: "/sponsors/orders", icon: ReceiptText }, { label: "CDK 管理", href: "/sponsors/cdks", icon: Coins }] },
  { label: "运营", items: [{ label: "API Key", href: "/operations/api-keys", icon: KeyRound }, { label: "API 用量", href: "/operations/usage", icon: Activity }] },
  { label: "平台", items: [{ label: "审计日志", href: "/audit-logs", icon: ShieldCheck }, { label: "设置", href: "/settings", icon: Settings }] },
];

function currentTitle(pathname: string) {
  const active = groups
    .map((group) => ({ group, item: group.items.find((item) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))) }))
    .find((match) => match.item);
  return active ? `${active.group.label} / ${active.item!.label}` : "AxoAdmin";
}

function ShellSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };
  return (
    <>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" onClick={closeOnMobile}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="flex min-w-0 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">AxoAdmin</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Axolotl 管理中心</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                        <Link href={item.href} onClick={closeOnMobile}>
                          <Icon className="size-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </>
  );
}

export function AdminShell({ children, session }: { children: React.ReactNode; session: AdminSession | null }) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <Sidebar collapsible="icon" variant="inset">
          <ShellSidebar />
          <SidebarFooter>
            <div className="flex items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-3 py-2.5 text-xs text-sidebar-foreground/70">
              <ShieldCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="leading-5 group-data-[collapsible=icon]:hidden">GitHub axolotl-launcher 组织成员可访问。</span>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 px-4 sm:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-sm font-medium">{currentTitle(pathname)}</p>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">统一运营与管理控制台</p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {session ? (
                <>
                  <span className="hidden max-w-48 truncate text-xs text-muted-foreground md:block">{session.identity.email ?? session.identity.name}</span>
                  <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 lg:flex dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    已认证
                  </span>
                  <ThemeToggle />
                  <Button asChild variant="outline" size="sm">
                    <a href={session.logoutUrl}>退出</a>
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-xs text-destructive">未认证</span>
                  <ThemeToggle />
                  <Button asChild variant="outline" size="sm">
                    <a href="/">登录</a>
                  </Button>
                </>
              )}
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 pt-6 sm:p-6 lg:p-8 lg:pt-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}