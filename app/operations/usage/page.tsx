import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";

export default function Usage() {
  return <div><PageHeader title="API 用量" description="查看翻译 API 的请求、字符和错误统计。" /><Card><div className="flex items-center gap-3"><Activity className="size-5 text-muted-foreground" /><div><h2 className="font-semibold">按用户查看用量</h2><p className="mt-1 text-sm text-muted-foreground">当前提供用户维度的明细用量。请从用户列表进入详情查看最近 30 天数据。</p></div><Link href="/sponsors/users" className="ml-auto inline-flex items-center gap-1 text-sm font-medium hover:underline">用户列表 <ArrowRight className="size-4" /></Link></div></Card></div>;
}
