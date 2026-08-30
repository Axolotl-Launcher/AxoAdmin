import { KeyRound } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function ApiKeys() {
  return (
    <div className="grid gap-4">
      <PageHeader title="API Key" description="查看用户 API Key 的状态和最近使用情况。" />
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="grid size-10 place-items-center rounded-2xl bg-muted">
            <KeyRound className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">API Key 数据尚未接入</p>
            <p className="mt-1 text-sm text-muted-foreground">密钥只展示脱敏信息，不会显示完整凭据。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}