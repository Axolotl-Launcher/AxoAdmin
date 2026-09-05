import { getAdminSession, authFailure } from "@/lib/auth/access";
import { ZodError } from "zod";

export class AnnouncementError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}
export async function db(path: string, init: RequestInit = {}) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new AnnouncementError("公告数据库尚未配置");
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("Authorization", "Bearer " + key);
  headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(new URL("/rest/v1/" + path, url), {
      ...init, headers, cache: "no-store", signal: AbortSignal.timeout(10000),
    });
  } catch { throw new AnnouncementError("公告数据库连接失败"); }
  if (!response.ok) throw new AnnouncementError("公告数据库操作失败", 502);
  return response;
}
export async function admin(request: Request) {
  const session = await getAdminSession(request.headers);
  if (request.method !== "GET" && request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) {
    throw new AnnouncementError("不允许跨站修改公告", 403);
  }
  return session;
}
export async function body(request: Request) {
  const raw = await request.text();
  if (raw.length > 40000) throw new AnnouncementError("公告内容过长", 413);
  try { return JSON.parse(raw); } catch { throw new AnnouncementError("无效 JSON", 400); }
}
export function failure(error: unknown) {
  if (error instanceof ZodError) return Response.json({ message: error.issues.map(issue => issue.path.join(".") + ": " + issue.message).join("；") }, { status: 400 });
  if (error instanceof AnnouncementError) return Response.json({ message: error.message }, { status: error.status });
  return authFailure(error);
}
