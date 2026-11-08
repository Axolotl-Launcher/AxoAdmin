import { authFailure, getAdminSession, type AdminSession } from "@/lib/auth/access";
import { passthrough } from "@/lib/api/edge-proxy";
import { recordAudit } from "@/lib/audit";

// 归一化 SemVer，与更新服务要求一致（例如 1.9.4、1.9.5-beta.1）。
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z][0-9A-Za-z.-]*)?(?:\+[0-9A-Za-z.-]+)?$/;
const channels = new Set(["release", "beta"]);
const platforms = new Set(["windows-x86_64", "linux-x86_64", "linux-aarch64", "darwin-x86_64", "darwin-aarch64"]);

type Route = {
  pattern: string[];
  method: "GET" | "POST" | "PATCH" | "DELETE";
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
  { pattern: ["versions", ":version", "cleanup"], method: "POST", auth: "admin", params: [], upstream: (parts) => `/api/admin/versions/${encodeURIComponent(parts[1])}/cleanup`, audit: "cleanup_version" },
  { pattern: ["versions", ":version", "force-update"], method: "PATCH", auth: "admin", params: [], upstream: (parts) => `/api/admin/versions/${encodeURIComponent(parts[1])}/force-update`, audit: "force_update" },
  { pattern: ["versions", ":version"], method: "DELETE", auth: "admin", params: [], upstream: (parts) => `/api/admin/versions/${encodeURIComponent(parts[1])}`, audit: "delete_version" },
];

const statsFilters = ["route", "method", "host", "scheme", "http_version", "tls_version", "status_code", "status_class", "country", "continent", "region", "city", "asn", "asn_org", "client_ip", "ip_version", "user_agent", "browser", "browser_version", "os", "os_version", "device_type", "is_bot", "referer_host", "content_type", "app_cache", "error_code", "channel", "client_version", "platform", "target_version", "include_updater", "include_revoked"];
const statsParams = ["start", "end", "interval", "limit", ...statsFilters];
routes.push({ pattern: ["stats"], method: "GET", auth: "admin", params: [...statsParams, "dimensions"], upstream: () => "/api/admin/stats" });
for (const kind of ["overview", "timeseries", "breakdown", "requests", "meta", "status"]) {
  routes.push({ pattern: ["stats", kind], method: "GET", auth: "admin", params: kind === "meta" || kind === "status" ? [] : [...statsParams, ...(kind === "breakdown" ? ["dimension"] : kind === "requests" ? ["cursor"] : [])], upstream: () => `/api/admin/stats/${kind}` });
}

function payload(code: string, message: string, status: number, requestId?: string | null) {
  return Response.json({ error: { code, message, ...(requestId ? { request_id: requestId } : {}) } }, { status, headers: { "cache-control": "no-store" } });
}

function match(method: string, parts: string[]) {
  return routes.find((route) => route.method === method && route.pattern.length === parts.length && route.pattern.every((segment, index) => segment.startsWith(":") || segment === parts[index]));
}

function sameOrigin(request: Request, incoming: URL) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const supplied = new URL(origin);
    const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
    const protocol = forwarded === "http" || forwarded === "https" ? `${forwarded}:` : incoming.protocol;
    const host = request.headers.get("host") ?? incoming.host;
    return supplied.origin === origin && supplied.host === host && supplied.protocol === protocol;
  } catch { return false; }
}

// All browser calls stay same-origin. Only the server injects the upstream token.
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

  if (request.method !== "GET" && !sameOrigin(request, incoming)) {
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
  if (route.method !== "GET") {
    const raw = await request.text();
    if (raw.length > 4000) return payload("invalid_body", "请求内容过长。", 413);
    let parsed: Record<string, unknown> = {};
    if (raw) {
      try {
        const value: unknown = JSON.parse(raw);
        if (!value || typeof value !== "object" || Array.isArray(value)) return payload("invalid_body", "请求内容必须是 JSON 对象。", 400);
        parsed = value as Record<string, unknown>;
      } catch {
        return payload("invalid_body", "无效的 JSON。", 400);
      }
    }
    if (parsed.reason !== undefined && typeof parsed.reason !== "string") return payload("invalid_body", "操作原因必须是字符串。", 400);
    if (route.method === "PATCH" && typeof parsed.force_update !== "boolean") return payload("invalid_force_update", "force_update 必须是布尔值。", 400);
    reason = typeof parsed.reason === "string" ? parsed.reason.trim().slice(0, 500) : "";
    // operator 由服务端从 Cloudflare Access 会话取得，不接受客户端传入。
    body = JSON.stringify({ operator: session.identity.email || session.identity.name || "admin", reason, ...(route.method === "PATCH" ? { force_update: parsed.force_update } : {}) });
  }

  const query = new URLSearchParams();
  for (const key of route.params) {
    const value = incoming.searchParams.get(key);
    if (value !== null) query.set(key, value);
  }
  const search = query.toString();
  const upstreamPath = route.upstream(parts) + (search ? "?" + search : "");

  const headers = new Headers({ accept: "application/json" });
  if (route.method !== "GET") headers.set("content-type", "application/json");
  if (needsAdmin && token) headers.set("authorization", "Bearer " + token);

  // 更新服务不返回非 JSON 的错误页，因此这里不做上游 sponsorRequest 那样的
  // content-type 探针：204 与空响应体都是合法结果，按网络失败回退直连即可。
  let response: Response | null = null;
  let timedOut = false;
  // Mutations are never retried against a second origin: the first may have committed.
  const timeout = parts[0] === "stats" ? 30000 : 15000;
  for (const target of [...new Set([origin, directOrigin].filter((value): value is string => Boolean(value)))]) {
    if (!target) continue;
    try {
      response = await fetch(new URL(upstreamPath, target), { method: route.method, headers, body, cache: "no-store", signal: AbortSignal.any([request.signal, AbortSignal.timeout(timeout)]) });
      break;
    } catch (error) {
      timedOut = error instanceof Error && error.name === "TimeoutError";
      response = null;
      if (route.method !== "GET" || request.signal.aborted) break;
    }
  }
  if (!response) {
    if (timedOut) return payload("upstream_timeout", `更新服务超过 ${timeout / 1000} 秒没有响应，请稍后重试。`, 504);
    return payload("upstream_unavailable", "更新服务暂时不可用，请稍后重试。", 503);
  }

  const requestId = response.headers.get("x-request-id");
  if (response.status === 204) return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  if (!response.ok) {
    const failure = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null;
    if (response.status === 401 || response.status === 403) return payload("upstream_unauthorized", "更新服务拒绝了管理凭证，请检查 UPDATE_SERVER_ADMIN_TOKEN 是否正确。", 502, requestId);
    if ([400, 404, 409, 413, 429, 503].includes(response.status) && failure?.error?.code && failure.error.message) return payload(failure.error.code, failure.error.message, response.status, requestId);
    if (response.status === 404) return payload("not_found", parts[0] === "stats" ? "当前更新服务不支持统计 API，请先升级 Update Server。" : "更新服务中没有找到对应的版本或资源。", 404, requestId);
    if (response.status === 409) return payload("conflict", "更新服务拒绝了本次操作，目标状态可能已经变更。", 409, requestId);
    return payload("upstream_error", "更新服务返回错误响应（HTTP " + response.status + "）。", 502, requestId);
  }

  if (route.audit) {
    // 撤销/恢复已经生效，审计写入失败不应再把响应变成错误。
    try {
      await recordAudit(request, route.audit, "release", versionIndex >= 0 ? parts[versionIndex] : null, { reason, ...(route.method === "PATCH" && body ? { force_update: (JSON.parse(body) as { force_update: boolean }).force_update } : {}) });
    } catch {}
  }

  const forwarded = passthrough(response);
  forwarded.headers.set("cache-control", "no-store");
  return forwarded;
}
