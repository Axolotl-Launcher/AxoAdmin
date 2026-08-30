import { authFailure, getAdminSession } from "@/lib/auth/access";

export async function sponsorRequest(path: string, request: Request, init: RequestInit = {}) {
  try {
    await getAdminSession(request.headers);
  } catch (error) {
    return authFailure(error);
  }
  const origin = process.env.SPONSOR_GATEWAY_ORIGIN;
  if (!origin) return Response.json({ code: "UPSTREAM_UNCONFIGURED", message: "Sponsor Gateway 尚未配置" }, { status: 503 });
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  const token = process.env.SPONSOR_GATEWAY_ADMIN_TOKEN;
  if (token) headers.set("authorization", "Bearer " + token);
  try {
    const response = await fetch(new URL(path, origin), { ...init, headers, signal: AbortSignal.timeout(15000) });
    if (!response.ok && !(response.headers.get("content-type") ?? "").includes("application/json")) {
      // Edge protection (e.g. Cloudflare managed challenge on api.axlmc.org)
      // answers server-to-server calls with an HTML 403. Surface a readable
      // error instead of passing the challenge page through.
      return Response.json(
        { code: "UPSTREAM_BLOCKED", message: "Sponsor Gateway 被边缘安全策略拦截，请确认 api.axlmc.org 已放行 /admin/* 路径的服务器请求" },
        { status: 502 }
      );
    }
    return response;
  } catch {
    return Response.json({ code: "UPSTREAM_UNAVAILABLE", message: "Sponsor Gateway 暂时不可用" }, { status: 503 });
  }
}
