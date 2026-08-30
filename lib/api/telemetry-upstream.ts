import { getAdminSession } from "@/lib/auth/access";

const allowed = new Set(["overview", "activity", "distributions", "errors", "system"]);
const errorParams = new Set(["range", "page", "pageSize", "search", "version", "platform", "errorType", "hasSample", "sort", "direction"]);
const ranges = new Set(["7d", "30d", "90d", "365d"]);

function failure(message: string, status = 503) {
  return Response.json({ error: { code: status === 400 ? "invalid_query" : "upstream_unavailable", message } }, { status });
}

export async function telemetryRequest(path: string, request: Request) {
  await getAdminSession(request.headers);
  const origin = process.env.TELEMETRY_ADMIN_ORIGIN;
  if (!origin) return failure("Telemetry service 尚未配置");
  const incoming = new URL(request.url);
  const parts = path.split("/").filter(Boolean);
  const resource = parts[0];
  if (!allowed.has(resource)) return failure("Not found", 404);
  if (resource === "errors") {
    if (parts.length > 2 && (parts.length !== 3 || parts[2] !== "sample")) return failure("Not found", 404);
  } else if (parts.length > 1) return failure("Not found", 404);
  if (resource !== "errors" && [...incoming.searchParams.keys()].some((key) => key !== "range")) return failure("Invalid query parameters", 400);
  if (resource === "errors") {
    for (const key of incoming.searchParams.keys()) if (!errorParams.has(key)) return failure("Invalid query parameters", 400);
    const range = incoming.searchParams.get("range");
    if (range && !ranges.has(range)) return failure("Invalid range", 400);
  }
  const upstreamPath = `/api/admin/${resource}${parts.slice(1).map((part) => `/${encodeURIComponent(part)}`).join("")}${incoming.search}`;
  const headers = new Headers({ accept: "application/json" });
  const assertion = request.headers.get("cf-access-jwt-assertion");
  if (assertion) headers.set("cf-access-jwt-assertion", assertion);
  try {
    const response = await fetch(new URL(upstreamPath, origin), { headers, cache: "no-store", signal: AbortSignal.timeout(15000) });
    return new Response(response.body, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json", "cache-control": "no-store" } });
  } catch {
    return failure("Telemetry service unavailable");
  }
}
