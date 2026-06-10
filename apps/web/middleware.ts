import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface JwtPayload {
  sub: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  exp: number;
}

/**
 * Decodes a JWT token string's payload section in a simple, Edge-compatible way.
 */
function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonString = atob(payloadBase64);
    return JSON.parse(jsonString) as JwtPayload;
  } catch (err) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessTokenCookie = request.cookies.get("accessToken");
  const refreshTokenCookie = request.cookies.get("refreshToken");

  let accessToken = accessTokenCookie?.value || null;
  let refreshToken = refreshTokenCookie?.value || null;
  let decodedUser: JwtPayload | null = null;
  let newCookiesToSet: { accessToken: string; refreshToken?: string } | null = null;

  // 1. Attempt to decode access token if present and not expired
  if (accessToken) {
    decodedUser = decodeJwt(accessToken);
    const now = Math.floor(Date.now() / 1000);
    // If expired, clear token reference
    if (decodedUser && decodedUser.exp < now) {
      accessToken = null;
      decodedUser = null;
    }
  }

  // 2. If access token is missing/expired, but refresh token exists, attempt inline refresh
  if (!accessToken && refreshToken) {
    try {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const resData = await refreshResponse.json();
        const tokens = resData.data;
        accessToken = tokens.accessToken;
        refreshToken = tokens.refreshToken || null;
        decodedUser = decodeJwt(accessToken!);
        newCookiesToSet = {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };
      } else {
        // Refresh token invalid or revoked
        refreshToken = null;
      }
    } catch (err) {
      console.error("Middleware failed to perform token refresh:", err);
    }
  }

  const isAuthenticated = !!decodedUser;
  const userRole = decodedUser?.role || null;

  // 3. Define routes categories
  const isAdminRoute = pathname.startsWith("/admin");
  const isCustomerRoute = pathname.startsWith("/customer");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  // 4. Implement redirection guards
  if (isAdminRoute || isCustomerRoute) {
    if (!isAuthenticated) {
      // Not authenticated: redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(loginUrl);
      // Clean up stale cookies if any
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return response;
    }

    if (isAdminRoute && userRole !== "ADMIN") {
      // Customer trying to access Admin page: redirect to customer dashboard
      return NextResponse.redirect(new URL("/customer/dashboard", request.url));
    }

    if (isCustomerRoute && userRole !== "CUSTOMER") {
      // Admin trying to access Customer page: redirect to admin dashboard
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  if (isAuthRoute && isAuthenticated) {
    // Authenticated user trying to access login/register: redirect to their dashboard
    const dashboardPath = userRole === "ADMIN" ? "/admin/dashboard" : "/customer/dashboard";
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  // 5. Proceed and append new cookies if refreshed successfully
  const response = NextResponse.next();
  if (newCookiesToSet) {
    const isSecure = request.nextUrl.protocol === "https:";
    response.cookies.set("accessToken", newCookiesToSet.accessToken, {
      path: "/",
      maxAge: 900, // 15 minutes
      sameSite: "lax",
      secure: isSecure,
    });
    if (newCookiesToSet.refreshToken) {
      response.cookies.set("refreshToken", newCookiesToSet.refreshToken, {
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        sameSite: "lax",
        secure: isSecure,
      });
    }
  }

  return response;
}

// Matching paths to avoid running middleware on static files or API endpoints
export const config = {
  matcher: [
    "/admin/:path*",
    "/customer/:path*",
    "/login",
    "/register",
  ],
};
