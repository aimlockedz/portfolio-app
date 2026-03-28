import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Only run on dashboard routes — skip API, static, login, register
  const path = request.nextUrl.pathname;
  if (
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("auth_session");
  if (!sessionCookie) {
    // No session → redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Refresh session cookie expiry on every page navigation (sliding window)
  const response = NextResponse.next();
  response.cookies.set("auth_session", sessionCookie.value, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
};
