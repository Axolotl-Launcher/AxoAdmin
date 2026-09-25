"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  Coins,
  Command,
  GitBranch,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  Server,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AdminSession } from "@/lib/auth/access";

const groups = [
  { label: "工作台", items: [{ label: "总览", href: "/", icon: LayoutDashboard }] },
  { label: "遥测中心", items: [{ label: "数据总览", href: "/telemetry", icon: Activity }, { label: "系统状态", href: "/telemetry/system", icon: Server }] },
  { label: "更新", items: [{ label: "版本与产物", href: "/updates", icon: Package }, { label: "渠道分发", href: "/updates/channels", icon: GitBranch }, { label: "发布审计", href: "/updates/audit", icon: History }] },
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

function getBreadcrumbs(pathname: string) {
  const match = matchItem(pathname);
  if (!match) return [{ label: "工作台", href: "/" }];

  const items = [{ label: match.group.label, href: match.item.href }];

  // If path is an exact match for the menu item
  if (pathname === match.item.href) {
    items.push({ label: match.item.label, href: "" });
    return items;
  }

  items.push({ label: match.item.label, href: match.item.href });

  // Handle sub-pages
  if (pathname.startsWith("/updates/") && pathname !== "/updates/channels" && pathname !== "/updates/audit") {
    const version = decodeURIComponent(pathname.replace("/updates/", ""));
    items.push({ label: version, href: "" });
  } else if (pathname.startsWith("/sponsors/users/") && pathname !== "/sponsors/users") {
    items.push({ label: "用户详情", href: "" });
  }

  return items;
}

function ShellSidebar({ session }: { session: AdminSession | null }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };
  const activeItem = matchItem(pathname)?.item;

  const userInitial = (session?.identity.name || session?.identity.email || "A").slice(0, 2).toUpperCase();

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
      {session && (
        <SidebarFooter>
          <div className="flex items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5">
            <Avatar className="size-7 rounded-lg">
              <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">{session.identity.name || session.identity.email}</span>
              <span className="truncate text-[10px] text-muted-foreground">{session.identity.email || "已认证管理员"}</span>
            </div>
            <Button asChild variant="ghost" size="icon-xs" className="shrink-0 group-data-[collapsible=icon]:hidden" title="退出登录">
              <a href={session.logoutUrl} aria-label="退出登录">
                <LogOut className="size-3.5 text-muted-foreground hover:text-foreground" />
              </a>
            </Button>
          </div>
        </SidebarFooter>
      )}
    </>
  );
}

export function AdminShell({ children, session }: { children: React.ReactNode; session: AdminSession | null }) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;

  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <Sidebar collapsible="icon" variant="inset">
          <ShellSidebar session={session} />
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                      <span key={index} className="inline-flex items-center gap-1.5 sm:gap-2">
                        {index > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem>
                          {isLast || !crumb.href ? (
                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link href={crumb.href}>{crumb.label}</Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </span>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {session ? (
                <>
                  <Badge variant="success" className="hidden sm:inline-flex">
                    已认证
                  </Badge>
                  <ThemeToggle />
                  <Button asChild variant="outline" size="sm">
                    <a href={session.logoutUrl}>退出</a>
                  </Button>
                </>
              ) : (
                <>
                  <Badge variant="destructive">未认证</Badge>
                  <ThemeToggle />
                  <Button asChild variant="outline" size="sm">
                    <Link href="/">登录</Link>
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
