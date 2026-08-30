// TEMPORARY diagnostics endpoint — exercises the real sponsorRequest probe
// logic against both origins from Vercel's egress. Remove after verification.
import { probe } from "@/lib/api/upstream";
export const dynamic = "force-dynamic";

export async function GET() {
  const origins = [process.env.SPONSOR_GATEWAY_ORIGIN, process.env.SPONSOR_GATEWAY_DIRECT_ORIGIN].filter(Boolean) as string[];
  const out: Record<string, unknown> = {};
  for (const origin of origins) {
    for (const path of ["/healthz", "/admin/users"]) {
      const item: Record<string, unknown> = {};
      const result = await probe(origin, path, { headers: { "content-type": "application/json" } });
      item.classified = result.kind;
      if (result.kind === "ok") {
        item.status = result.response.status;
        item.contentType = result.response.headers.get("content-type");
        item.contentEncoding = result.response.headers.get("content-encoding");
        item.contentLengthHeader = result.response.headers.get("content-length");
        item.body = (await result.response.text()).slice(0, 300);
      }
      out[`${origin}${path}`] = item;
    }
  }
  return Response.json(out);
}