import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  return <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-12"><Card className="w-full max-w-md"><CardHeader><div className="mb-2 grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></div><CardTitle>登录 AxoAdmin</CardTitle><CardDescription>使用 Cloudflare Access 验证管理员身份后继续。</CardDescription></CardHeader><CardContent><Button asChild className="w-full"><a href="/"><span>继续登录</span><ArrowRight className="size-4" /></a></Button><p className="mt-4 text-center text-xs text-muted-foreground">登录请求将由当前站点的 Cloudflare Access 策略处理。</p></CardContent></Card></main>;
}
