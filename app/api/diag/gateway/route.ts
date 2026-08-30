// TEMPORARY diagnostics endpoint — reproduces the sponsor proxy's upstream
// fetches from Vercel's egress to diagnose 403/502. Remove after investigation.
export const dynamic = "force-dynamic";

export async function GET() {
  const origins = [process.env.SPONSOR_GATEWAY_ORIGIN, process.env.SPONSOR_GATEWAY_DIRECT_ORIGIN].filter(Boolean) as string[];
  const out: Record<string, unknown> = { origins };
  for (const origin of origins) {
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
        item.server = response.headers.get("server");
        item.body = (await response.text()).slice(0, 400);
      } catch (error) {
        item.error = error instanceof Error ? error.message : String(error);
      }
      out[`${origin}${path}`] = item;
    }
  }
  return Response.json(out);
}