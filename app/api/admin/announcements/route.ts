import { db, admin, body, failure } from "@/lib/announcements/server";
import { announcementInput } from "@/lib/announcements/schema";

export async function GET(request: Request) {
  try {
    await admin(request);
    const response = await db("announcements?select=*&order=created_at.desc&limit=500");
    return Response.json(await response.json(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    const session = await admin(request);
    const input = announcementInput.parse(await body(request));
    const response = await db("announcements", {
      method: "POST", headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...input, starts_at: input.starts_at ?? new Date().toISOString(), status: "draft", created_by: session.identity.email ?? session.identity.name }),
    });
    return Response.json((await response.json())[0], { status: 201 });
  } catch (error) { return failure(error); }
}
