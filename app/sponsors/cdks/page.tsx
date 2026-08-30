import { Coins, Ticket } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CdkCreateForm } from "@/components/sponsors/cdk-create-form";

export default function Cdks() {
  return (
    <div className="grid gap-4">
      <PageHeader title="CDK 管理" description="生成固定金额或订单等值 CDK，并追踪兑换状态。">
        <CdkCreateForm />
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">可用 CDK</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">—</p>
              <p className="mt-1 text-xs text-muted-foreground">等待 Sponsor Gateway CDK API 接入</p>
            </div>
            <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-muted text-foreground">
              <Ticket className="size-4" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">已兑换金额</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">¥ —</p>
              <p className="mt-1 text-xs text-muted-foreground">等待 Sponsor Gateway CDK API 接入</p>
            </div>
            <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Coins className="size-4" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">发行批次</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">—</p>
              <p className="mt-1 text-xs text-muted-foreground">等待 Sponsor Gateway CDK API 接入</p>
            </div>
            <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-muted text-foreground">
              <Ticket className="size-4" />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
          <Coins className="size-5 text-muted-foreground/60" />
          CDK 批次和兑换记录将在 Sponsor Gateway CDK API 接入后显示。
        </CardContent>
      </Card>
    </div>
  );
}