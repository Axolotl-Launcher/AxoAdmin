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
  metrics: z.object({ totalInstallations: telemetryMetricSchema, dau: telemetryMetricSchema, wau: telemetryMetricSchema, mau: telemetryMetricSchema, newInstallationsToday: telemetryMetricSchema, errorOccurrences: telemetryMetricSchema, distinctErrorGroups: telemetryMetricSchema, r2SamplesToday: telemetryMetricSchema }),
});
export const telemetryActivitySchema = z.object({ range: z.enum(['7d', '30d', '90d', '365d']), points: z.array(z.object({ day: z.string(), activeInstallations: z.number(), newInstallations: z.number(), errorOccurrences: z.number() })) });
export const telemetryDistributionsSchema = z.object({ range: z.enum(['7d', '30d', '90d', '365d']), versions: z.array(z.object({ label: z.string(), value: z.number() })), platforms: z.array(z.object({ label: z.string(), value: z.number() })), architectures: z.array(z.object({ label: z.string(), value: z.number() })) });
export const telemetryErrorsSchema = z.object({ items: z.array(z.object({ fingerprint: z.string(), errorType: z.string(), latestMessage: z.string(), appVersion: z.string(), firstSeen: z.string(), lastSeen: z.string(), occurrenceCount: z.number(), affectedInstallations: z.number(), hasSample: z.boolean() })), page: z.number(), pageSize: z.number(), total: z.number(), totalPages: z.number(), filters: z.object({ versions: z.array(z.string()), platforms: z.array(z.string()), errorTypes: z.array(z.string()) }) });
export const telemetryDetailSchema = z.object({ fingerprint: z.string(), errorType: z.string(), latestMessage: z.string(), appVersion: z.string(), firstSeen: z.string(), lastSeen: z.string(), occurrenceCount: z.number(), affectedInstallations: z.number(), hasSample: z.boolean(), route: z.string().nullable(), command: z.string().nullable(), stack: z.string().nullable() });
export const telemetrySampleSchema = z.object({ fingerprint: z.string(), occurredAt: z.string(), appVersion: z.string(), platform: z.string(), architecture: z.string(), errorType: z.string(), message: z.string(), stack: z.string().nullable(), route: z.string().nullable(), command: z.string().nullable(), context: z.string().nullable() });
export const telemetryServiceSchema = z.object({ status: z.enum(['available', 'degraded', 'unavailable']), label: z.string(), detail: z.string() });
export const telemetrySystemSchema = z.object({ generatedAt: z.string(), publicWorker: telemetryServiceSchema, d1: telemetryServiceSchema, r2: telemetryServiceSchema, storeErrorContext: z.boolean(), r2Budget: z.object({ used: z.number(), limit: z.number() }), limits: z.object({ samplesPerGroup: z.number(), dailyActiveRetentionDays: z.number(), errorReportsRetentionDays: z.number(), r2RetentionDays: z.number(), errorAggregatesRetentionDays: z.number() }), latestDataDay: z.string().nullable(), cron: telemetryServiceSchema, accountUsage: telemetryServiceSchema });

export type TelemetryOverview = z.infer<typeof telemetryOverviewSchema>;
export type TelemetryActivity = z.infer<typeof telemetryActivitySchema>;
export type TelemetryDistributions = z.infer<typeof telemetryDistributionsSchema>;
export type TelemetryErrors = z.infer<typeof telemetryErrorsSchema>;
export type TelemetryDetail = z.infer<typeof telemetryDetailSchema>;
export type TelemetrySample = z.infer<typeof telemetrySampleSchema>;
export type TelemetrySystem = z.infer<typeof telemetrySystemSchema>;
