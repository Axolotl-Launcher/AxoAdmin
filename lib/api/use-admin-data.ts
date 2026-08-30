"use client";

import { useCallback, useEffect, useState } from "react";
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
