import { db, failure } from "@/lib/announcements/server";
import type { Announcement } from "@/lib/announcements/schema";

const fields = "id,title,summary,content,type,priority,starts_at,ends_at,target_version,target_channel,action_label,action_url,published_at,updated_at";
const rank = { low: 0, normal: 1, high: 2, critical: 3 };
export async function GET(request: Request) {
  try {
    const now = new Date().toISOString();
    const params = new URLSearchParams({ select: fields, status: "eq.published", starts_at: "lte." + now, or: "(ends_at.is.null,ends_at.gt." + now + ")", order: "published_at.desc", limit: "200" });
    const rows: Announcement[] = await (await db("announcements?" + params)).json();
    const query = new URL(request.url).searchParams;
    const announcements = rows.filter(item => (!item.target_version || item.target_version === query.get("version")) && (!item.target_channel || item.target_channel === query.get("channel"))).sort((first, second) => rank[second.priority] - rank[first.priority]);
    return Response.json({ announcements }, { headers: { "Cache-Control": "public, max-age=0, s-maxage=30", "Access-Control-Allow-Origin": "*" } });
  } catch (error) {
    const response = failure(error);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  }
}
