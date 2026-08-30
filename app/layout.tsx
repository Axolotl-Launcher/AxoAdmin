import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AdminShell } from "@/components/layout/admin-shell";
const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
export const metadata: Metadata = { title: "AxoAdmin · Axolotl 管理中心", description: "Axolotl 统一管理中心" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN" suppressHydrationWarning><body className={inter.variable}><AdminShell>{children}</AdminShell></body></html>; }