import { z } from "zod";

const nullableNumber = z.number().nullable();
export const statsMetricsSchema = z.object({
  requests: z.number(), unique_ips: z.number(), unique_user_agents: z.number(), requests_per_second: z.number(),
  status_samples: z.number(), status_1xx: z.number(), status_2xx: z.number(), status_3xx: z.number(), status_4xx: z.number(), status_5xx: z.number(),
  rate_limited_requests: z.number(), access_denied_requests: z.number(), response_bytes: z.number(), request_bytes: z.number(),
  response_byte_samples: z.number(), request_byte_samples: z.number(), duration_samples: z.number(), avg_duration_ms: nullableNumber, max_duration_ms: nullableNumber,
  bot_samples: z.number(), bot_requests: z.number(), country_samples: z.number(), app_cache_hits: z.number(), app_cache_misses: z.number(), app_cache_bypass: z.number(),
  error_rate: nullableNumber, app_cache_hit_rate: nullableNumber,
});
export const statsOverviewSchema = statsMetricsSchema.extend({ latency: z.object({ p50_ms: nullableNumber, p90_ms: nullableNumber, p95_ms: nullableNumber, p99_ms: nullableNumber }) });
export const statsBreakdownSchema = z.object({ dimension: z.string(), items: z.array(statsMetricsSchema.extend({ value: z.string().nullable() })), total_requests: z.number(), other_requests: z.number(), limit: z.number() });
export const statsWindowSchema = z.object({ start: z.string(), end: z.string(), interval: z.string(), interval_seconds: z.number(), filters: z.record(z.string()), retention_clamped: z.boolean() });
export const statsDashboardSchema = z.object({ schema_version: z.literal(2), scope: z.literal("origin"), generated_at: z.string(), window: statsWindowSchema, data: z.object({ overview: statsOverviewSchema, timeseries: z.array(statsMetricsSchema.extend({ time: z.string() })), breakdowns: z.record(statsBreakdownSchema) }) });
export const statsBreakdownResponseSchema = z.object({ schema_version: z.literal(2), window: statsWindowSchema, data: statsBreakdownSchema });
export const statsMetaSchema = z.object({ schema_version: z.literal(2), retention_days: z.number(), dimensions: z.array(z.string()), intervals: z.array(z.string()), includes_stats_requests: z.boolean(), capabilities: z.record(z.boolean()) });
export const statsStatusSchema = z.object({ schema_version: z.literal(2), data: z.object({ enabled: z.boolean(), requests: z.number(), requests_with_http_metrics: z.number(), oldest_request: z.string().nullable(), newest_request: z.string().nullable(), collector_attached: z.boolean(), collector: z.object({ written: z.number(), failed_batches: z.number(), dropped: z.number(), queue_length: z.number() }).optional() }) });
export const statsRequestSchema = z.object({
  id: z.number(), occurred_at: z.string(), route: z.string(), user_agent: z.string(), client_ip: z.string().nullable(),
  method: z.string().nullable(), status_code: z.number().nullable(), duration_ms: nullableNumber, request_bytes: nullableNumber, response_bytes: nullableNumber,
  channel: z.string().nullable(), client_version: z.string().nullable(), target_version: z.string().nullable(), platform: z.string().nullable(),
  country: z.string().nullable(), continent: z.string().nullable(), region: z.string().nullable(), city: z.string().nullable(), asn: nullableNumber, asn_org: z.string().nullable(),
  browser: z.string().nullable(), browser_version: z.string().nullable(), os: z.string().nullable(), os_version: z.string().nullable(), device_type: z.string().nullable(), is_bot: z.boolean().nullable(),
  host: z.string().nullable(), scheme: z.string().nullable(), http_version: z.string().nullable(), tls_version: z.string().nullable(), content_type: z.string().nullable(), referer_host: z.string().nullable(), app_cache: z.string().nullable(), error_code: z.string().nullable(),
  include_updater: z.boolean().nullable().optional(), include_revoked: z.boolean().nullable().optional(),
});
export const statsRequestsSchema = z.object({ schema_version: z.literal(2), window: statsWindowSchema, data: z.object({ items: z.array(statsRequestSchema), next_cursor: z.string().nullable(), has_more: z.boolean(), limit: z.number() }) });

export type StatsMetrics = z.infer<typeof statsMetricsSchema>;
export type StatsDashboard = z.infer<typeof statsDashboardSchema>;
export type StatsBreakdown = z.infer<typeof statsBreakdownSchema>;
export type StatsRequest = z.infer<typeof statsRequestSchema>;
export type StatsMeta = z.infer<typeof statsMetaSchema>;
export type StatsStatus = z.infer<typeof statsStatusSchema>;
export type AnalyticsFilter = { key: string; value: string };
export type AnalyticsQuery = { start: string; end: string; filters: AnalyticsFilter[] };

export const dimensionLabels: Record<string, string> = { route: "接口路径", method: "请求方法", host: "主机名", scheme: "协议", http_version: "HTTP 版本", tls_version: "TLS 版本", status_code: "状态码", status_class: "状态类别", country: "国家 / 地区", continent: "洲", region: "省份 / 区域", city: "城市", asn: "ASN", asn_org: "网络运营商", client_ip: "客户端 IP", ip_version: "IP 版本", user_agent: "User-Agent", browser: "浏览器 / 客户端", browser_version: "浏览器版本", os: "操作系统", os_version: "系统版本", device_type: "设备类型", is_bot: "机器人", referer_host: "来源 / 引荐域名", content_type: "响应内容类型", app_cache: "应用缓存", error_code: "错误类型", channel: "更新渠道", client_version: "客户端版本", platform: "更新平台", target_version: "目标版本", include_updater: "包含更新器", include_revoked: "包含撤销版本" };
const names = new Intl.DisplayNames(["zh-CN"], { type: "region" });
export function dimensionValue(key: string, value: string | null) {
  if (value === null) return "未知";
  const semanticValues: Record<string, Record<string, string>> = {
    referer_host: { "@application": "应用直接访问", "@direct": "直接访问（无引荐域名）" },
    browser: { Axolotl: "应用" }, browser_version: { "@application": "应用（不适用浏览器版本）" },
    os: { "@not_provided": "未提供系统信息" }, content_type: { "@empty": "无响应体" },
    error_code: { "@none": "无错误", "@http_error": "HTTP 错误（未记录错误码）" },
    include_updater: { "@not_applicable": "不适用" }, include_revoked: { "@not_applicable": "不适用" },
  };
  if (semanticValues[key]?.[value]) return semanticValues[key][value];
  if (key === "country") { try { return names.of(value) ?? value; } catch { return value; } }
  if (key === "app_cache") return ({ hit: "命中", miss: "未命中", bypass: "绕过" })[value] ?? value;
  if (key === "device_type") return ({ desktop: "桌面", mobile: "手机", tablet: "平板", bot: "机器人", cli: "命令行", application: "应用", unknown: "未知" })[value] ?? value;
  if (["is_bot", "include_updater", "include_revoked"].includes(key)) return value === "true" ? "是" : value === "false" ? "否" : value;
  return value === "Unknown" ? "未知" : value;
}

export function requestDimensionValue(request: StatsRequest, key: string): string {
  if (key === "error_code" && request.error_code === null && request.status_code !== null) {
    return dimensionValue(key, request.status_code < 400 ? "@none" : "@http_error");
  }
  if (key === "include_updater" || key === "include_revoked") {
    if (!["/api/downloads/latest", "/api/downloads/:version"].includes(request.route)) return "不适用";
    const value = request[key];
    return value === true ? "是" : value === false ? "否" : "未采集或参数无效";
  }
  return dimensionValue(key, (request[key as keyof StatsRequest] as string | null) ?? null);
}
export const formatCount = (value: number) => new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 }).format(value);
export const formatPercent = (value: number | null) => value === null ? "—" : new Intl.NumberFormat("zh-CN", { style: "percent", maximumFractionDigits: 2 }).format(value);
export const formatDuration = (value: number | null) => value === null ? "—" : value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${value.toFixed(value < 10 ? 2 : 1)} ms`;
export function analyticsQuery(query: AnalyticsQuery) { const params = new URLSearchParams({ start: query.start, end: query.end, interval: "auto" }); query.filters.forEach(({ key, value }) => params.set(key, value)); return params; }
export function timeRange(hours: number): AnalyticsQuery { const end = new Date(); return { start: new Date(end.getTime() - hours * 3600000).toISOString(), end: end.toISOString(), filters: [] }; }
