import { sponsorRequest } from "@/lib/api/upstream";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function forward(request: Request, context: { params: Promise<{ id: string }> }, suffix: string) {
  const { id } = await context.params;
  if (!uuidPattern.test(id)) {
    return Response.json({ code: "INVALID_USER_ID", message: "invalid user id" }, { status: 400 });
  }
  return sponsorRequest(`/admin/users/${id}/${suffix}${new URL(request.url).search}`, request);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return forward(request, context, "usage");
}
