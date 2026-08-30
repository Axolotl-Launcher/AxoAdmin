// TEMPORARY diagnostics endpoint — reproduces the sponsor proxy's upstream
// fetch from Vercel's egress to diagnose 403/502. Remove after investigation.
export const dynamic = "force-dynamic";

export async function GET() {
  const origin = process.env.SPONSOR_GATEWAY_ORIGIN ?? "(unset)";
  const out: Record<string, unknown> = { origin };
  for (const path of ["/healthz", "/admin/users"]) {
    const item: Record<string, unknown> = {};
    try {
      const response = await fetch(new URL(path, origin), {
        headers: { "content-type": "application/json" },
        signal: AbortSignal.timeout(20000),
      });
      item.status = response.status;
      item.contentType = response.headers.get("content-type");
      item.cfMitigated = response.headers.get("cf-mitigated");
      item.cfRay = response.headers.get("cf-ray");
      item.server = response.headers.get("server");
      item.body = (await response.text()).slice(0, 600);
    } catch (error) {
      item.error = error instanceof Error ? error.message : String(error);
    }
    out[path] = item;
  }
  return Response.json(out);
}