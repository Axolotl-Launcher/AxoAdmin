import { authFailure, getAdminSession, type AdminSession } from "@/lib/auth/access";
import { passthrough } from "@/lib/api/edge-proxy";
import { recordAudit } from "@/lib/audit";

// 归一化 SemVer，与更新服务要求一致（例如 1.9.4、1.9.5-beta.1）。
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z][0-9A-Za-z.-]*)?(?:\+[0-9A-Za-z.-]+)?$/;
const channels = new Set(["release", "beta"]);
const platforms = new Set(["windows-x86_64", "linux-x86_64", "linux-aarch64", "darwin-x86_64", "darwin-aarch64"]);

type Route = {
  pattern: string[];
  method: "GET" | "POST";
  auth: "public" | "admin";
  params: string[];
  upstream: (parts: string[]) => string;
  audit?: string;
};

// 显式白名单：只有列出的路径才会被转发，未知路径一律 404。
// 查询参数同样受 params 白名单约束，未列出的参数直接拒绝。
const routes: Route[] = [
  { pattern: ["health"], method: "GET", auth: "public", params: [], upstream: () => "/api/health" },
  { pattern: ["versions"], method: "GET", auth: "public", params: [], upstream: () => "/api/versions" },
  { pattern: ["versions", ":version"], method: "GET", auth: "public", params: [], upstream: (parts) => `/api/versions/${encodeURIComponent(parts[1])}` },
  { pattern: ["latest"], method: "GET", auth: "public", params: ["channel", "platform", "current_version"], upstream: () => "/latest" },
  { pattern: ["downloads", "latest"], method: "GET", auth: "public", params: ["channel", "include_updater", "include_revoked"], upstream: () => "/api/downloads/latest" },
  { pattern: ["downloads", ":version"], method: "GET", auth: "public", params: ["include_updater", "include_revoked"], upstream: (parts) => `/api/downloads/${encodeURIComponent(parts[1])}` },
  { pattern: ["audit-logs"], method: "GET", auth: "admin", params: [], upstream: () => "/api/admin/audit-logs" },
  { pattern: ["versions", ":version", "revoke"], method: "POST", auth: "admin", params: [], upstream: (parts) => `/api/admin/versions/${encodeURIComponent(parts[1])}/revoke`, audit: "revoke" },
  { pattern: ["versions", ":version", "restore"], method: "POST", auth: "admin", params: [], upstream: (parts) => `/api/admin/versions/${encodeURIComponent(parts[1])}/restore`, audit: "restore" },
];

function payload(code: string, message: string, status: number, requestId?: string | null) {
  return Response.json({ error: { code, message, ...(requestId ? { request_id: requestId } : {}) } }, { status, headers: { "cache-control": "no-store" } });
}

function match(method: string, parts: string[]) {
  return routes.find((route) => route.method === method && route.pattern.length === parts.length && route.pattern.every((segment, index) => segment.startsWith(":") || segment === parts[index]));
}

// 更新服务的错误响应体经常是空的（404 / 401 / 204），所以这里不依赖上游报文，
// 而是统一合成本面板自己的 JSON 信封，保证前端总是拿到可解析的结构。
export async function updateServerRequest(path: string, request: Request) {
  let session: AdminSession;
  try {
    session = await getAdminSession(request.headers);
  } catch (error) {
    return authFailure(error);
  }

  const incoming = new URL(request.url);
  const origin = process.env.UPDATE_SERVER_ORIGIN;
  const directOrigin = process.env.UPDATE_SERVER_DIRECT_ORIGIN;
  if (!origin && !directOrigin) return payload("upstream_unconfigured", "更新服务尚未配置，请设置 UPDATE_SERVER_ORIGIN。", 503);

  if (request.method !== "GET" && request.headers.get("origin") && request.headers.get("origin") !== incoming.origin) {
    return payload("forbidden", "不允许跨站修改发布状态。", 403);
  }

  const parts = path.split("/").filter(Boolean);
  const route = match(request.method, parts);
  if (!route) return payload("not_found", "未找到对应的更新服务接口。", 404);

  const versionIndex = route.pattern.indexOf(":version");
  if (versionIndex >= 0 && !semver.test(parts[versionIndex])) return payload("invalid_version", "版本号必须是规范化的 SemVer，例如 1.9.4 或 1.9.5-beta.1。", 400);

  const allowed = new Set(route.params);
  for (const key of incoming.searchParams.keys()) {
    if (!allowed.has(key)) return payload("invalid_query", "不支持的查询参数：" + key, 400);
  }
  const channel = incoming.searchParams.get("channel");
  if (channel && !channels.has(channel)) return payload("invalid_query", "channel 只能是 release 或 beta。", 400);
  const platform = incoming.searchParams.get("platform");
  if (platform && !platforms.has(platform)) return payload("invalid_query", "platform 不在支持的更新平台列表中。", 400);
  const currentVersion = incoming.searchParams.get("current_version");
  if (currentVersion && !semver.test(currentVersion)) return payload("invalid_query", "current_version 必须是规范化的 SemVer。", 400);
  for (const key of ["include_updater", "include_revoked"]) {
    const value = incoming.searchParams.get(key);
    if (value !== null && value !== "true" && value !== "false") return payload("invalid_query", key + " 只能是 true 或 false。", 400);
  }

  // include_revoked 需要更新服务的管理凭证，因此即使下载目录本身是公开接口，也要注入 Bearer。
  const needsAdmin = route.auth === "admin" || incoming.searchParams.get("include_revoked") === "true";
  const token = process.env.UPDATE_SERVER_ADMIN_TOKEN;
  if (needsAdmin && !token) return payload("upstream_unconfigured", "尚未配置 UPDATE_SERVER_ADMIN_TOKEN，无法访问更新服务管理接口。", 503);

  let body: string | undefined;
  let reason: string | null = null;
  if (route.method === "POST") {
    const raw = await request.text();
    if (raw.length > 4000) return payload("invalid_body", "请求内容过长。", 413);
    let parsed: { reason?: unknown } = {};
    if (raw) {
      try {
        parsed = JSON.parse(raw) as { reason?: unknown };
      } catch {
        return payload("invalid_body", "无效的 JSON。", 400);
      }
    }
    reason = typeof parsed.reason === "string" && parsed.reason.trim() ? parsed.reason.trim().slice(0, 500) : null;
    // operator 由服务端从 Cloudflare Access 会话取得，不接受客户端传入。
    body = JSON.stringify({ operator: session.identity.email ?? session.identity.name, reason });
  }

  const query = new URLSearchParams();
  for (const key of route.params) {
    const value = incoming.searchParams.get(key);
    if (value !== null) query.set(key, value);
  }
  const search = query.toString();
  const upstreamPath = route.upstream(parts) + (search ? "?" + search : "");

  const headers = new Headers({ accept: "application/json" });
  if (route.method === "POST") headers.set("content-type", "application/json");
  if (needsAdmin && token) headers.set("authorization", "Bearer " + token);

  // 更新服务不返回非 JSON 的错误页，因此这里不做上游 sponsorRequest 那样的
  // content-type 探针：204 与空响应体都是合法结果，按网络失败回退直连即可。
  let response: Response | null = null;
  let timedOut = false;
  for (const target of [origin, directOrigin]) {
    if (!target) continue;
    try {
      response = await fetch(new URL(upstreamPath, target), { method: route.method, headers, body, cache: "no-store", signal: AbortSignal.timeout(15000) });
      break;
    } catch (error) {
      timedOut = error instanceof Error && error.name === "TimeoutError";
      response = null;
    }
  }
  if (!response) {
    if (timedOut) return payload("upstream_timeout", "更新服务超过 15 秒没有响应，请稍后重试。", 504);
    return payload("upstream_unavailable", "更新服务暂时不可用，请稍后重试。", 503);
  }

  const requestId = response.headers.get("x-request-id");
  if (response.status === 204) return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) return payload("upstream_unauthorized", "更新服务拒绝了管理凭证，请检查 UPDATE_SERVER_ADMIN_TOKEN 是否正确。", 502, requestId);
    if (response.status === 404) return payload("not_found", "更新服务中没有找到对应的版本或资源。", 404, requestId);
    if (response.status === 409) return payload("conflict", "更新服务拒绝了本次操作，目标状态可能已经变更。", 409, requestId);
    return payload("upstream_error", "更新服务返回错误响应（HTTP " + response.status + "）。", 502, requestId);
  }

  if (route.audit) {
    // 撤销/恢复已经生效，审计写入失败不应再把响应变成错误。
    try {
      await recordAudit(request, route.audit, "release", versionIndex >= 0 ? parts[versionIndex] : null, { reason });
    } catch {}
  }

  const forwarded = passthrough(response);
  forwarded.headers.set("cache-control", "no-store");
  return forwarded;
}
