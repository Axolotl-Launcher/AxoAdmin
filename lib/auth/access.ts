import { createRemoteJWKSet, jwtVerify } from "jose";

export type AdminSession = { identity: { name: string; email: string | null }; organization: string; logoutUrl: string };

export class AdminAuthError extends Error {
  constructor(public readonly code: "UNAUTHENTICATED" | "ADMIN_AUTH_UNCONFIGURED", message: string, public readonly status: 401 | 503) {
    super(message);
  }
}

export async function getAdminSession(headers: Headers): Promise<AdminSession> {
  const logoutUrl = process.env.CF_ACCESS_TEAM_DOMAIN ? `https://${process.env.CF_ACCESS_TEAM_DOMAIN}.cloudflareaccess.com/cdn-cgi/access/logout` : "/login";
  if (process.env.NODE_ENV === "development" && process.env.AXOADMIN_MOCK_AUTH === "true") {
    return { identity: { name: "本地开发身份", email: "dev@example.com" }, organization: "axolotl-launcher", logoutUrl };
  }

  const token = headers.get("cf-access-jwt-assertion");
  const team = process.env.CF_ACCESS_TEAM_DOMAIN;
  const audience = process.env.CF_ACCESS_AUDIENCE;
  if (!team || !audience) throw new AdminAuthError("ADMIN_AUTH_UNCONFIGURED", "Cloudflare Access 尚未配置", 503);
  if (!token) throw new AdminAuthError("UNAUTHENTICATED", "需要通过 Cloudflare Access 登录", 401);

  const issuer = `https://${team}.cloudflareaccess.com`;
  try {
    const { payload } = await jwtVerify(token, createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)), { issuer, audience, algorithms: ["RS256"] });
    const email = typeof payload.email === "string" ? payload.email : null;
    const name = typeof payload.name === "string" ? payload.name : (email ?? "GitHub member");
    return { identity: { name, email }, organization: "axolotl-launcher", logoutUrl };
  } catch {
    throw new AdminAuthError("UNAUTHENTICATED", "Cloudflare Access 凭证无效或已过期", 401);
  }
}

export function authFailure(error: unknown) {
  if (error instanceof AdminAuthError) return Response.json({ code: error.code, message: error.message }, { status: error.status });
  return Response.json({ code: "INTERNAL_ERROR", message: "服务暂时不可用，请稍后重试" }, { status: 500 });
}
