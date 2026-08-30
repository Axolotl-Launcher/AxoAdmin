import { Settings2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="grid gap-4">
      <PageHeader title="设置" description="管理 AxoAdmin 的基础运行配置。" />
      <Card>
        <CardContent className="flex items-start gap-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-muted">
            <Settings2 className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">平台设置</p>
            <p className="mt-1 text-sm text-muted-foreground">
              管理员访问由 Cloudflare Access 和 GitHub axolotl-launcher 组织策略保护。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}