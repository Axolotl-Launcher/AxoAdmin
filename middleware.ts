import { NextResponse } from "next/server";
import { AdminAuthError, getAdminSession } from "@/lib/auth/access";

export async function middleware(request: Request) {
  try {
    await getAdminSession(request.headers);
    return NextResponse.next();
  } catch (error) {
    if (error instanceof AdminAuthError && error.code === "UNAUTHENTICATED") {
      return NextResponse.redirect(new URL("/cdn-cgi/access/login", request.url));
    }
    return NextResponse.json({ code: "ADMIN_AUTH_UNCONFIGURED", message: "Cloudflare Access 尚未配置" }, { status: 503 });
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|cdn-cgi).*)"],
};
