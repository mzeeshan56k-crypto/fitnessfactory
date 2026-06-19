// Edge-safe session helpers (JWT sign/verify via jose). No Node-only deps so
// this can be imported from middleware.
import { SignJWT, jwtVerify } from "jose";

export type Role = "owner" | "admin" | "coach" | "member";

export interface SessionUser {
  email: string;
  name: string;
  role: Role;
}

export const SESSION_COOKIE = "ffkc_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secretKey() {
  const secret = process.env.AUTH_SECRET || "dev-insecure-secret-change-me-in-production";
  if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
    console.warn("[auth] AUTH_SECRET is not set — using an insecure fallback. Set AUTH_SECRET in the environment.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.email)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub || !payload.role) return null;
    return {
      email: String(payload.sub),
      name: String(payload.name ?? ""),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

/** Which top-level portals a role may access. */
export function canAccessPath(role: Role, pathname: string): boolean {
  if (pathname.startsWith("/admin")) return role === "owner" || role === "admin";
  if (pathname.startsWith("/dashboard")) return role === "owner" || role === "admin" || role === "coach";
  if (pathname.startsWith("/client")) return true; // any authenticated user
  return true;
}

/** Default landing portal for a role. */
export function homeForRole(role: Role): string {
  if (role === "member") return "/client";
  if (role === "admin") return "/admin";
  return "/dashboard";
}
