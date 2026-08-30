import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { AdminShell } from "@/components/layout/admin-shell";
import { getAdminSession } from "@/lib/auth/access";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
export const metadata: Metadata = { title: "AxoAdmin · Axolotl 管理中心", description: "Axolotl 统一管理中心" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let session = null;
  try {
    session = await getAdminSession(await headers());
  } catch {
    session = null;
  }
  return <html lang="zh-CN" suppressHydrationWarning><body className={inter.variable}><AdminShell session={session}>{children}</AdminShell></body></html>;
}
