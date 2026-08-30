import Link from "next/link";
import { ArrowRight, Activity } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Usage() {
  return (
    <div className="grid gap-4">
      <PageHeader title="API 用量" description="查看翻译 API 的请求、字符和错误统计。" />
      <Card>
        <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-muted">
            <Activity className="size-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-medium">按用户查看用量</p>
            <p className="mt-1 text-sm text-muted-foreground">
              当前提供用户维度的明细用量。请从用户列表进入详情查看最近 30 天数据。
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="sm:ml-auto">
            <Link href="/sponsors/users">
              用户列表
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}