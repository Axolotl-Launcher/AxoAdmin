"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ZodError } from "zod";
import type { z } from "zod";

export function useAdminData<T>(path: string, schema: z.ZodType<T>, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const reload = useCallback(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(path, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("请求失败");
        return schema.parse(await response.json());
      })
      .then((value) => { if (!cancelled) setData(value); })
      .catch(() => { if (!cancelled) setError("暂时无法加载数据，请稍后重试。"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [enabled, path, schema]);
  useEffect(() => reload(), [reload]);
  return { data, error, loading, reload };
}

const EMPTY_DATA = "更新服务返回了无法识别的数据格式，请检查契约是否已经变更。";

function describe(status: number) {
  if (status === 401) return "登录状态无效或已过期，请重新通过 Cloudflare Access 登录。";
  if (status === 403) return "没有执行该操作的权限。";
  if (status === 404) return "更新服务中没有找到对应的版本或资源。";
  if (status === 503) return "更新服务尚未配置或暂时不可用。";
  if (status === 504) return "更新服务响应超时，请稍后重试。";
  return "暂时无法加载数据，请稍后重试。";
}

async function explain(response: Response) {
  try {
    const body = (await response.json()) as { error?: { message?: string }; message?: string };
    return body?.error?.message ?? body?.message ?? describe(response.status);
  } catch {
    return describe(response.status);
  }
}

// 更新服务的 204（无更新 / 无可下载包）是合法结果而不是错误，
// 因此这里把状态码一并返回，让页面能区分「已是最新」与真正的失败。
export function useUpdateApi<T>(path: string, schema: z.ZodType<T>, enabled = true) {
  const [snapshot, setSnapshot] = useState<{ data: T | null; status: number; path: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const sequence = useRef(0);
  const active = useRef<AbortController | null>(null);
  const reload = useCallback(async () => {
    if (!enabled) { setLoading(false); return false; }
    const request = ++sequence.current;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setError(null);
    try {
      let response = await fetch(path, { cache: "no-store", signal: controller.signal });
      const waitingSince = Date.now();
      while (response.status === 202 && path.startsWith("/api/admin/updates/stats")) {
        if (Date.now() - waitingSince > 10 * 60 * 1000) throw new Error("定时统计仍在准备中，请稍后刷新。");
        await new Promise<void>((resolve, reject) => {
          const aborted = () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); };
          const timer = setTimeout(() => { controller.signal.removeEventListener("abort", aborted); resolve(); }, 5000);
          if (controller.signal.aborted) aborted();
          else controller.signal.addEventListener("abort", aborted, { once: true });
        });
        response = await fetch(path, { cache: "no-store", signal: controller.signal });
      }
      if (!response.ok && response.status !== 204) throw new Error(await explain(response));
      const data = response.status === 204 ? null : schema.parse(await response.json());
      if (request !== sequence.current || controller.signal.aborted) return false;
      setSnapshot({ data, status: response.status, path });
      return true;
    } catch (error) {
      if (request !== sequence.current || controller.signal.aborted) return false;
      setError(error instanceof ZodError ? EMPTY_DATA : error instanceof Error ? error.message : describe(0));
      return false;
    } finally {
      if (request === sequence.current && !controller.signal.aborted) setLoading(false);
    }
  }, [enabled, path, schema]);
  useEffect(() => {
    void reload();
    return () => { active.current?.abort(); };
  }, [reload]);
  return { data: snapshot?.data ?? null, status: snapshot?.status ?? null, committedPath: snapshot?.path ?? null, error, loading, reload };
}
