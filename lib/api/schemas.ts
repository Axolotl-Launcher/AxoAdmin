import { z } from "zod";

const nullableDate = z.string().datetime().nullable().optional();

export const overviewSchema = z.object({
  users: z.object({ total: z.number(), active: z.number(), suspended: z.number(), blocked: z.number() }),
  entitlements: z.object({ granted: z.number(), pending: z.number(), suspended: z.number(), manual_review: z.number() }),
  orders: z.object({ paid_count: z.number(), paid_amount_fen: z.number(), refunded_count: z.number() }),
  usage: z.object({ today_request_count: z.number(), today_input_chars: z.number(), today_error_count: z.number() }),
  cdks: z.object({ active_count: z.number(), redeemed_count: z.number(), redeemed_amount_fen: z.number() }),
  generated_at: z.string().datetime(),
});

export const apiKeySchema = z.object({ status: z.string(), created_at: z.string().datetime(), last_used_at: nullableDate });
export const userSchema = z.object({
  id: z.string(), email: z.string().nullable(), status: z.string(), created_at: z.string().datetime(),
  entitlement_status: z.string(), lifetime_paid_fen: z.number(), granted_at: nullableDate,
  active_api_key: apiKeySchema.nullable().optional(),
});
export const userPageSchema = z.object({ items: z.array(userSchema), page: z.number(), page_size: z.number(), total: z.number() });
export const usageSchema = z.object({
  days: z.array(z.object({ date: z.string(), request_count: z.number(), input_chars: z.number(), error_count: z.number() })),
  total_request_count: z.number(), total_input_chars: z.number(), total_error_count: z.number(),
});
export const userDetailSchema = userSchema.extend({ recalculated_at: nullableDate, usage_summary: usageSchema });
export const orderSchema = z.object({ user_id: z.string(), user_email: z.string().nullable(), actual_paid_fen: z.number(), status: z.string(), synced_at: z.string().datetime() });
export const orderPageSchema = z.object({ items: z.array(orderSchema), page: z.number(), page_size: z.number(), total: z.number() });
export const cdkSchema = z.object({ id: z.string(), batch_id: z.string(), amount_fen: z.number(), status: z.string(), redeemed_at: nullableDate });
export const cdkListSchema = z.array(cdkSchema);
export const adminApiKeySchema = z.object({ id: z.string(), user_id: z.string(), user_email: z.string().nullable(), status: z.string(), created_at: z.string().datetime(), last_used_at: nullableDate });
export const adminApiKeyPageSchema = z.object({ items: z.array(adminApiKeySchema), page: z.number(), page_size: z.number(), total: z.number() });

export type Overview = z.infer<typeof overviewSchema>;
export type User = z.infer<typeof userSchema>;
export type UserPage = z.infer<typeof userPageSchema>;
export type UserDetail = z.infer<typeof userDetailSchema>;
export type OrderPage = z.infer<typeof orderPageSchema>;
export const telemetryMetricSchema = z.object({ value: z.number(), label: z.string() });
export const telemetryOverviewSchema = z.object({
  range: z.enum(['7d', '30d', '90d', '365d']), generatedAt: z.string(),
  metrics: z.object({ totalInstallations: telemetryMetricSchema, dau: telemetryMetricSchema, wau: telemetryMetricSchema, mau: telemetryMetricSchema, newInstallationsToday: telemetryMetricSchema }),
});
export const telemetryActivitySchema = z.object({ range: z.enum(['7d', '30d', '90d', '365d']), points: z.array(z.object({ day: z.string(), activeInstallations: z.number(), newInstallations: z.number() })) });
export const telemetryDistributionsSchema = z.object({ range: z.enum(['7d', '30d', '90d', '365d']), versions: z.array(z.object({ label: z.string(), value: z.number() })), platforms: z.array(z.object({ label: z.string(), value: z.number() })), architectures: z.array(z.object({ label: z.string(), value: z.number() })) });
export const telemetryServiceSchema = z.object({ status: z.enum(['available', 'degraded', 'unavailable']), label: z.string(), detail: z.string() });
export const telemetrySystemSchema = z.object({ generatedAt: z.string(), publicWorker: telemetryServiceSchema, d1: telemetryServiceSchema, latestDataDay: z.string().nullable(), cron: telemetryServiceSchema, accountUsage: telemetryServiceSchema });

export type TelemetryOverview = z.infer<typeof telemetryOverviewSchema>;
export type TelemetryActivity = z.infer<typeof telemetryActivitySchema>;
export type TelemetryDistributions = z.infer<typeof telemetryDistributionsSchema>;
export type TelemetrySystem = z.infer<typeof telemetrySystemSchema>;

// 更新服务契约。注意 published_at 是无时区的本地风格时间（例如 2026-09-09T14:26:34），
// 只有 /latest 的 pub_date 带 Z 后缀，因此这里不能使用 z.string().datetime()。
export const updateHealthSchema = z.object({ service: z.string(), status: z.string() });
export const updateArtifactSchema = z.object({
  kind: z.string(), platform: z.string(), architecture: z.string(), variant: z.string(),
  filename: z.string(), display_name: z.string(), content_type: z.string(), relative_path: z.string(),
  sha256: z.string().nullable(), size: z.number(), sort_order: z.number(), is_public: z.boolean(),
  signature: z.string().nullable(), signature_filename: z.string().nullable(),
});
export const updateVersionSchema = z.object({
  version: z.string(), channel: z.string(), status: z.string(), notes: z.string().nullable(),
  release_tag: z.string().nullable(), release_id: z.string().nullable(), published_at: z.string(),
  minimum_version: z.string().nullable(), force_update: z.boolean(), artifacts: z.array(updateArtifactSchema),
});
export const updateVersionListSchema = z.object({ versions: z.array(updateVersionSchema) });
export const updateDownloadSchema = z.object({
  id: z.number(), kind: z.string(), platform: z.string(), architecture: z.string(), variant: z.string(),
  label: z.string(), display_name: z.string(), sort_order: z.number(), filename: z.string(), url: z.string(),
  size: z.number(), sha256: z.string().nullable(), signature: z.string().nullable(), signature_filename: z.string().nullable(),
});
export const updateDownloadsSchema = z.object({
  version: z.string(), channel: z.string(), status: z.string(), published_at: z.string(),
  force_update: z.boolean(), downloads: z.array(updateDownloadSchema),
});
export const updateManifestSchema = z.object({
  version: z.string(), notes: z.string().nullable(), pub_date: z.string(), published_at: z.string(),
  force_update: z.boolean(), platforms: z.record(z.string(), z.object({ signature: z.string(), url: z.string() })),
});
export const updateAuditLogsSchema = z.object({
  logs: z.array(z.object({
    operator: z.string(), action: z.string(), channel: z.string(), version: z.string(),
    reason: z.string().nullable(), request_id: z.string(), ip_address: z.string(), created_at: z.string(),
  })),
});

export type UpdateHealth = z.infer<typeof updateHealthSchema>;
export type UpdateArtifact = z.infer<typeof updateArtifactSchema>;
export type UpdateVersion = z.infer<typeof updateVersionSchema>;
export type UpdateDownload = z.infer<typeof updateDownloadSchema>;
export type UpdateDownloads = z.infer<typeof updateDownloadsSchema>;
export type UpdateManifest = z.infer<typeof updateManifestSchema>;
export type UpdateAuditLogs = z.infer<typeof updateAuditLogsSchema>;
