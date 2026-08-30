import { authFailure, getAdminSession } from "@/lib/auth/access";

type ProbeResult = { kind: "ok"; response: Response } | { kind: "blocked" } | { kind: "unreachable" };

// Node fetch transparently decompresses gzip/br bodies but leaves the
// `content-encoding` header in place. Forwarding it verbatim makes browsers
// fail with ERR_CONTENT_DECODING_FAILED. Drop it (and the stale compressed
// content-length) and let the response body travel as-is.
async function passthrough(response: Response): Promise<Response> {
  const headers = new Headers();
  for (const [key, value] of response.headers) {
    if (key === "content-encoding" || key === "content-length") continue;
    headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function probe(origin: string | undefined, path: string, init: RequestInit): Promise<ProbeResult> {
  if (!origin) return { kind: "unreachable" };
  try {
    const response = await fetch(new URL(path, origin), { ...init, signal: AbortSignal.timeout(15000) });
    if (!(response.headers.get("content-type") ?? "").includes("application/json")) {
      // The gateway only ever answers JSON. Non-JSON responses (Cloudflare
      // managed challenge pages, Caddy error pages) are edge artifacts:
      // treat them as blocked so the direct origin is tried. The challenge
      // interstitial can come back with HTTP 200, so the content-type check
      // must not depend on response.ok.
      return { kind: "blocked" };
    }
    return { kind: "ok", response: await passthrough(response) };
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