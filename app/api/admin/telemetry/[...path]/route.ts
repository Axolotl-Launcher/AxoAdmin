import { telemetryRequest } from "@/lib/api/telemetry-upstream";

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return telemetryRequest(path.join("/"), request);
}
