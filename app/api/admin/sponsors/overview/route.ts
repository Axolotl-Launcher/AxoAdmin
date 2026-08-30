import { sponsorRequest } from "@/lib/api/upstream";

export async function GET(request: Request) {
  return sponsorRequest(`/admin/overview${new URL(request.url).search}`, request);
}
