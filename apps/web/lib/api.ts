import { getCookie, setCookie, eraseCookie } from "./cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface FetchOptions extends RequestInit {
  token?: string;
}

/**
 * Enhanced fetch wrapper that appends credentials and handles auto-refresh on the client side.
 * Works seamlessly in both Client Components and Server Components.
 */
export async function fetchWithAuth(path: string, options: FetchOptions = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let token = options.token;

  // If token is not explicitly provided, try to load it from cookies
  if (!token) {
    if (typeof window === "undefined") {
      // Server-side: Dynamically load Next.js headers to avoid compilation issues on client side
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        token = cookieStore.get("accessToken")?.value;
      } catch {
        // cookies() may throw if evaluated in a static rendering context
      }
    } else {
      // Client-side
      token = getCookie("accessToken") || undefined;
    }
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  let response = await fetch(url, { ...options, headers });

  // Auto-refresh token on the client side if the request fails with 401 Unauthorized
  if (response.status === 401 && typeof window !== "undefined") {
    const refreshToken = getCookie("refreshToken");
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const resData = await refreshResponse.json();
          const { accessToken: newAccess, refreshToken: newRefresh } = resData.data;

          // Store new tokens in client cookies
          setCookie("accessToken", newAccess, 15 / (24 * 60)); // 15 minutes
          setCookie("refreshToken", newRefresh, 7); // 7 days

          // Retry the original request with the new access token
          headers.set("Authorization", `Bearer ${newAccess}`);
          response = await fetch(url, { ...options, headers });
        } else {
          // Refresh token is expired or invalid, clear all local session cookies
          eraseCookie("accessToken");
          eraseCookie("refreshToken");
        }
      } catch (err) {
        console.error("Auto-refresh handler encountered an error:", err);
      }
    }
  }

  return response;
}
