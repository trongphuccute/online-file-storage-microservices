import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Since access_token is short-lived, the presence of refresh_token acts as a valid session indicator.
  const hasRefreshToken = request.cookies.has("refresh_token");

  const protectedPaths = ["/dashboard", "/profile", "/shares", "/upload", "/gallery"];
  const authPaths = ["/login", "/register"];

  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAuthPage = authPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isProtected && !hasRefreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && hasRefreshToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/shares/:path*",
    "/upload/:path*",
    "/gallery/:path*",
    "/login",
    "/register",
  ],
};
