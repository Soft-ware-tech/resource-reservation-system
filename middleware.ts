import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname.startsWith("/admin");
  const isUserPath = pathname.startsWith("/user");
  const isLoginPage = pathname === "/admin/login" || pathname === "/user/login";
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!isAdminPath && !isUserPath) return NextResponse.next();
  if (!token) {
    if (isLoginPage) return NextResponse.next();
    return NextResponse.redirect(new URL(isAdminPath ? "/admin/login" : "/user/login", request.url));
  }

  try {
    const session = await verifySessionToken(token);
    const sessionHome = session.role === "ADMIN" ? "/admin" : "/user";

    if (isLoginPage) {
      return NextResponse.redirect(new URL(sessionHome, request.url));
    }
    if ((isAdminPath && session.role !== "ADMIN") || (isUserPath && session.role !== "USER")) {
      return NextResponse.redirect(new URL(sessionHome, request.url));
    }
    return NextResponse.next();
  } catch {
    if (isLoginPage) return NextResponse.next();
    const response = NextResponse.redirect(
      new URL(isAdminPath ? "/admin/login" : "/user/login", request.url),
    );
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/user/:path*"],
};
