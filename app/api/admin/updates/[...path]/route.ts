import { updateServerRequest } from "@/lib/api/update-server";

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return updateServerRequest(path.join("/"), request);
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return updateServerRequest(path.join("/"), request);
}
