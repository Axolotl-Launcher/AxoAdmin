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
    return await fetch(new URL(path, origin), { ...init, headers, signal: AbortSignal.timeout(15000) });
  } catch {
    return Response.json({ code: "UPSTREAM_UNAVAILABLE", message: "Sponsor Gateway 暂时不可用" }, { status: 503 });
  }
}
