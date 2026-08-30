import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function Audit() {
  return (
    <div className="grid gap-4">
      <PageHeader title="审计日志" description="追踪管理中心中的关键查看、生成、撤销和配置操作。" />
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="grid size-10 place-items-center rounded-2xl bg-muted">
            <ScrollText className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">暂无审计日志</p>
            <p className="mt-1 text-sm text-muted-foreground">关键管理操作产生后将在此展示。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}