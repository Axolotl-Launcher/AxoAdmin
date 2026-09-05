import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).nullable().default(null);
const date = z.string().datetime({ offset: true }).nullable().default(null);
export const announcementInput = z.object({
  title: z.string().trim().min(1).max(120),
  summary: optionalText(300),
  content: z.string().trim().min(1).max(20000),
  type: z.enum(["modal", "notification"]),
  priority: z.enum(["low", "normal", "high", "critical"]),
  starts_at: date,
  ends_at: date,
  target_version: optionalText(80),
  target_channel: z.enum(["stable", "beta"]).nullable().default(null),
  action_label: optionalText(80),
  action_url: z.string().url().max(2048).refine(value => ["https:", "http:"].includes(new URL(value).protocol), "链接仅支持 HTTP/HTTPS").nullable().default(null),
}).strict().superRefine((value, context) => {
  if (value.ends_at && Date.parse(value.ends_at) <= Date.parse(value.starts_at ?? new Date().toISOString())) {
    context.addIssue({ code: "custom", path: ["ends_at"], message: "结束时间必须晚于开始时间" });
  }
  if (Boolean(value.action_label) !== Boolean(value.action_url)) {
    context.addIssue({ code: "custom", path: ["action_url"], message: "按钮文字和链接必须同时填写" });
  }
});
export type AnnouncementInput = z.infer<typeof announcementInput>;
export type Announcement = AnnouncementInput & {
  id: string; status: "draft" | "published" | "archived";
  created_at: string; updated_at: string; published_at: string | null;
};
