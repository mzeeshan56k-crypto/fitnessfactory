import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession, canAccessPath, homeForRole } from "@/lib/auth/session";

const PROTECTED = ["/dashboard", "/client", "/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const user = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!canAccessPath(user.role, pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = homeForRole(user.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/client/:path*", "/admin/:path*"],
};
