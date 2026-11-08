export type ReleaseAction = "revoke" | "restore" | "force-update" | "delete" | "cleanup";
export type ReleaseActionResult = { status?: string; version?: string; force_update?: boolean; idempotent?: boolean; files_cleanup_pending?: boolean };
export class ReleaseActionError extends Error { constructor(message: string, public readonly code?: string) { super(message); } }

export async function mutateRelease(version: string, action: ReleaseAction, reason = "", forceUpdate?: boolean): Promise<ReleaseActionResult> {
  const path = `/api/admin/updates/versions/${encodeURIComponent(version)}${action === "delete" ? "" : `/${action}`}`;
  const method = action === "delete" ? "DELETE" : action === "force-update" ? "PATCH" : "POST";
  const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, ...(action === "force-update" ? { force_update: forceUpdate } : {}) }) });
  const result = await response.json().catch(() => null) as (ReleaseActionResult & { error?: { code?: string; message?: string } }) | null;
  if (!response.ok) {
    const messages: Record<string, string> = { manifest_unavailable: "该版本的本地清单缺失，请先在更新服务重建清单。", invalid_manifest: "该版本清单与元数据不一致，请先校验或重建。", version_busy: "该版本正在被其他操作修改，请稍后重试。", version_cleanup_pending: "该版本还有待清理文件，请先重试删除清理。", version_exists: "该版本目前存在，可能已经重新发布，未执行清理。如需删除，请重新确认版本。", version_restore_failed: "文件恢复失败，需要在服务器检查隔离目录。", stats_busy: "统计查询繁忙，请稍后重试。" };
    throw new ReleaseActionError(messages[result?.error?.code ?? ""] ?? result?.error?.message ?? "操作失败，请稍后重试。", result?.error?.code);
  }
  if (!result) throw new Error("更新服务返回了无法识别的操作结果，请刷新确认当前状态。");
  return result;
}

const cleanupKey = "axo-admin:update-cleanup";
export function pendingCleanup(): string[] { try { const value: unknown = JSON.parse(sessionStorage.getItem(cleanupKey) ?? "[]"); return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; } catch { return []; } }
export function rememberCleanup(version: string, pending: boolean) { const versions = new Set(pendingCleanup()); if (pending) versions.add(version); else versions.delete(version); try { sessionStorage.setItem(cleanupKey, JSON.stringify([...versions])); } catch {} }
