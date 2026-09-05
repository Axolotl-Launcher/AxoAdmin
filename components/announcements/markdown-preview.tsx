"use client";

import { useMemo, type MouseEvent } from "react";
import { renderString } from "@/lib/announcements/markdown";
import styles from "./markdown-preview.module.css";

export default function MarkdownPreview({ content }: { content: string }) {
  const html = useMemo(() => renderString(content), [content]);
  function openLink(event: MouseEvent<HTMLDivElement>) {
    const link = event.target instanceof Element ? event.target.closest("a") : null;
    if (!link) return;
    event.preventDefault();
    try {
      const url = new URL(link.getAttribute("href") ?? "");
      if (["http:", "https:"].includes(url.protocol) && !url.username && !url.password) {
        window.open(url.href, "_blank", "noopener,noreferrer");
      }
    } catch {}
  }
  return content.trim() ? <div className={styles.body} onClick={openLink} onAuxClick={openLink} dangerouslySetInnerHTML={{ __html: html }} /> : <p className="text-sm text-muted-foreground">输入正文后，这里会显示渲染结果。</p>;
}
