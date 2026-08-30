import { NextResponse } from "next/server";

export function middleware(request: Request) {
  if (process.env.NODE_ENV === "development" && process.env.AXOADMIN_MOCK_AUTH === "true") {
    return NextResponse.next();
  }
  if (!process.env.CF_ACCESS_TEAM_DOMAIN || !process.env.CF_ACCESS_AUDIENCE) {
    return NextResponse.json({ code: "ADMIN_AUTH_UNCONFIGURED", message: "Cloudflare Access 尚未配置" }, { status: 503 });
  }
  if (!request.headers.get("cf-access-jwt-assertion")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|cdn-cgi|login).*)"],
};
