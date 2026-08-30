import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const target = new URL("/", request.url);
  try {
    const response = await fetch(target, {
      headers: { cookie: "" },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const location = response.headers.get("location");
    if (location && response.status >= 300 && response.status < 400) {
      return NextResponse.redirect(new URL(location, target), 302);
    }
    return NextResponse.json({ code: "ACCESS_NOT_PROTECTING_HOST", message: "Cloudflare Access 尚未接管当前域名，请检查 Access 应用的 hostname 和路径配置。" }, { status: 503 });
  } catch {
    return NextResponse.json({ code: "ACCESS_UNAVAILABLE", message: "无法连接 Cloudflare Access，请稍后重试。" }, { status: 503 });
  }
}
