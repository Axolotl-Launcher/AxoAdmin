// 更新服务的 published_at 是不带时区的时间（2026-09-09T14:26:34），实际含义是 UTC；
// /latest 的 pub_date 则带 Z 后缀。这里统一按 UTC 解析后再用浏览器本地时区展示，
// 否则中国时区下会平白少算 8 小时。
export function utcTimestamp(value: string) {
  return new Date(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(value) ? value : value + "Z");
}

export function formatDateTime(value: string) {
  return utcTimestamp(value).toLocaleString("zh-CN", { hour12: false });
}

export function formatDate(value: string) {
  return utcTimestamp(value).toLocaleDateString("zh-CN");
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const scaled = bytes / 1024 ** exponent;
  return `${scaled >= 100 || exponent === 0 ? Math.round(scaled) : scaled.toFixed(1)} ${units[exponent]}`;
}

export function shortDigest(value: string | null, length = 12) {
  if (!value) return "—";
  return value.length > length ? value.slice(0, length) + "…" : value;
}
