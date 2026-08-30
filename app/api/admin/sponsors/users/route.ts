import { sponsorRequest } from "@/lib/api/upstream";

export async function GET(request: Request) {
  const search = new URL(request.url).search;
  return sponsorRequest(`/admin/users${search}`, request);
}
