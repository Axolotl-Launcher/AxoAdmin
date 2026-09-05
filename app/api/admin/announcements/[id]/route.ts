import { z } from "zod";
import { db, admin, body, failure, AnnouncementError } from "@/lib/announcements/server";
import { announcementInput, type Announcement } from "@/lib/announcements/schema";

type Context = { params: Promise<{ id: string }> };
async function path(context: Context) {
  return "announcements?id=eq." + z.string().uuid().parse((await context.params).id);
}
export async function PATCH(request: Request, context: Context) {
  try {
    await admin(request);
    const location = await path(context);
    const current: Announcement | undefined = (await (await db(location)).json())[0];
    if (!current) throw new AnnouncementError("公告不存在", 404);
    const input = await body(request);
    let patch: Record<string, unknown>;
    if ("action" in input) {
      const { action } = z.object({ action: z.enum(["publish", "archive", "draft"]) }).strict().parse(input);
      if (action === "publish" && current.ends_at && Date.parse(current.ends_at) <= Date.now()) throw new AnnouncementError("公告已过期，请先修改结束时间", 400);
      patch = { status: action === "publish" ? "published" : action === "archive" ? "archived" : "draft" };
      if (action === "publish" && current.status !== "published") patch.published_at = new Date().toISOString();
    } else {
      patch = announcementInput.parse(input);
      patch.starts_at ??= new Date().toISOString();
    }
    const response = await db(location, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }) });
    return Response.json((await response.json())[0]);
  } catch (error) { return failure(error); }
}
export async function DELETE(request: Request, context: Context) {
  try {
    await admin(request);
    const response = await db(await path(context), { method: "DELETE", headers: { Prefer: "return=representation" } });
    if (!(await response.json()).length) throw new AnnouncementError("公告不存在", 404);
    return new Response(null, { status: 204 });
  } catch (error) { return failure(error); }
}
