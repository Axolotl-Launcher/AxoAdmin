"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bell, Coins, Command, KeyRound, LayoutDashboard, ReceiptText, Server, Settings, ShieldCheck, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
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
  { label: "遥测中心", items: [{ label: "数据总览", href: "/telemetry", icon: Activity }, { label: "系统状态", href: "/telemetry/system", icon: Server }] },
  { label: "赞助与权益", items: [{ label: "用户", href: "/sponsors/users", icon: Users }, { label: "赞助订单", href: "/sponsors/orders", icon: ReceiptText }, { label: "CDK 管理", href: "/sponsors/cdks", icon: Coins }] },
  { label: "公告", items: [{ label: "公告管理", href: "/announcements", icon: Bell }] },
  { label: "运营", items: [{ label: "API Key", href: "/operations/api-keys", icon: KeyRound }, { label: "API 用量", href: "/operations/usage", icon: Activity }] },
  { label: "平台", items: [{ label: "审计日志", href: "/audit-logs", icon: ShieldCheck }, { label: "设置", href: "/settings", icon: Settings }] },
];

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function matchItem(pathname: string) {
  return groups
    .flatMap((group) => group.items.map((item) => ({ group, item })))
    .filter(({ item }) => isActive(item.href, pathname))
    .sort((a, b) => b.item.href.length - a.item.href.length)[0];
}

function currentTitle(pathname: string) {
  const active = matchItem(pathname);
  return active ? `${active.group.label} / ${active.item.label}` : "AxoAdmin";
}

function ShellSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };
  const activeItem = matchItem(pathname)?.item;
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
                  const active = item === activeItem;
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

