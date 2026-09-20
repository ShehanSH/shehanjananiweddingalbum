import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, isValidSessionToken } from "@/lib/auth/token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(getSessionCookieName())?.value;
  const authed = await isValidSessionToken(token);

  const isLogin = pathname === "/admin/login" || pathname === "/api/admin/login";
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");

  if ((isAdminPage || isAdminApi) && !isLogin && !authed) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/admin/login" && authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
