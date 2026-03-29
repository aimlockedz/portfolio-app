import { NextRequest, NextResponse } from "next/server";
import { rateLimit, type TierName } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// Route → Rate-limit tier mapping
// ---------------------------------------------------------------------------

function getTier(pathname: string, method: string): TierName | null {
  // Auth endpoints — strictest limit
  if (pathname.startsWith("/api/auth/login") || pathname.startsWith("/api/auth/register")) {
    return "auth";
  }

  // AI / expensive external-API endpoints
  if (
    pathname.startsWith("/api/watchlist/ai-take") ||
    pathname.startsWith("/api/portfolio/suggestion") ||
    pathname.startsWith("/api/portfolio/correlation") ||
    pathname.startsWith("/api/news")
  ) {
    return "ai";
  }

  // Write operations (POST / PUT / DELETE / PATCH)
  if (pathname.startsWith("/api/") && method !== "GET") {
    return "write";
  }

  // All other API reads
  if (pathname.startsWith("/api/")) {
    return "read";
  }

  return null; // non-API routes — no rate limit
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // ── Rate-limit API routes ───────────────────────────────────────────
  if (path.startsWith("/api/")) {
    const tier = getTier(path, request.method);
    if (tier) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || request.headers.get("x-real-ip")
        || "unknown";
      const key = `${ip}`;

      const result = rateLimit(tier, key);

      if (!result.allowed) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(result.resetSec),
              "X-RateLimit-Limit": String(result.limit),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(result.resetSec),
            },
          },
        );
      }

      // Attach rate-limit info headers to successful responses
      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Limit", String(result.limit));
      response.headers.set("X-RateLimit-Remaining", String(result.remaining));
      response.headers.set("X-RateLimit-Reset", String(result.resetSec));
      return response;
    }

    return NextResponse.next();
  }

  // ── Skip static assets & public pages ───────────────────────────────
  if (
    path.startsWith("/_next") ||
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.includes(".")
  ) {
    return NextResponse.next();
  }

  // ── Dashboard auth guard ────────────────────────────────────────────
  const sessionCookie = request.cookies.get("auth_session");
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Sliding-window session refresh
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
  matcher: [
    // Match API routes + dashboard pages (exclude static assets)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
