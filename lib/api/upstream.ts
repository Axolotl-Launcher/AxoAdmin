import { authFailure, getAdminSession } from "@/lib/auth/access";

type ProbeResult = { kind: "ok"; response: Response } | { kind: "blocked" } | { kind: "unreachable" };

async function probe(origin: string | undefined, path: string, init: RequestInit): Promise<ProbeResult> {
  if (!origin) return { kind: "unreachable" };
  try {
    const response = await fetch(new URL(path, origin), { ...init, signal: AbortSignal.timeout(15000) });
    if (!response.ok && !(response.headers.get("content-type") ?? "").includes("application/json")) {
      // Edge protection (e.g. Cloudflare managed challenge) answers with an
      // HTML error page; treat it as blocked so the direct origin is tried.
      return { kind: "blocked" };
    }
    return { kind: "ok", response };
  } catch {
    return { kind: "unreachable" };
  }
}

function blockedResponse() {
  return Response.json(
    { code: "UPSTREAM_BLOCKED", message: "Sponsor Gateway 被边缘安全策略拦截，请配置 SPONSOR_GATEWAY_DIRECT_ORIGIN 直连入口或调整 Cloudflare 规则" },
    { status: 502 }
  );
}

export async function sponsorRequest(path: string, request: Request, init: RequestInit = {}) {
  try {
    await getAdminSession(request.headers);
  } catch (error) {
    return authFailure(error);
  }
  const origin = process.env.SPONSOR_GATEWAY_ORIGIN;
  const directOrigin = process.env.SPONSOR_GATEWAY_DIRECT_ORIGIN;
  if (!origin && !directOrigin) {
    return Response.json({ code: "UPSTREAM_UNCONFIGURED", message: "Sponsor Gateway 尚未配置" }, { status: 503 });
  }
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  const token = process.env.SPONSOR_GATEWAY_ADMIN_TOKEN;
  if (token) headers.set("authorization", "Bearer " + token);
  const requestInit: RequestInit = { ...init, headers };

  const primary = await probe(origin, path, requestInit);
  if (primary.kind === "ok") return primary.response;
  if (primary.kind === "blocked" && !directOrigin) return blockedResponse();

  const direct = await probe(directOrigin, path, requestInit);
  if (direct.kind === "ok") return direct.response;
  if (direct.kind === "blocked") return blockedResponse();
  // Primary unreachable and direct origin missing or unreachable.
  return Response.json({ code: "UPSTREAM_UNAVAILABLE", message: "Sponsor Gateway 暂时不可用" }, { status: 503 });
}