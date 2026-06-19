"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getCookie, setCookie, eraseCookie } from "../lib/cookie";
import { fetchWithAuth } from "../lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN" | "AGENT" | "SUPPORT_L1" | "SUPPORT_L2" | "BILLING";
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: (redirectPath?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  sendMagicLink: (email: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithMagicLink: (token: string) => Promise<{ success: boolean; error?: string; user?: User }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Helper to fetch the current user profile using the active access token
  const fetchUserProfile = async (token?: string): Promise<User | null> => {
    try {
      const response = await fetchWithAuth("/auth/me", {
        method: "GET",
        ...(token ? { token } : {}),
      });

      if (response.ok) {
        const resData = await response.json();
        return resData.data.user as User;
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
    return null;
  };

  // Main session initialization logic
  const initializeSession = async () => {
    setLoading(true);
    const accessToken = getCookie("accessToken");
    const refreshToken = getCookie("refreshToken");

    if (accessToken) {
      const profile = await fetchUserProfile(accessToken);
      if (profile) {
        setUser(profile);
        setLoading(false);
        return;
      }
    }

    // Access token missing or invalid; try refreshing
    if (refreshToken) {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const resData = await refreshResponse.json();
          const { accessToken: newAccess, refreshToken: newRefresh } = resData.data;

          // Save new tokens
          setCookie("accessToken", newAccess, 15 / (24 * 60)); // 15 mins
          if (newRefresh) {
            setCookie("refreshToken", newRefresh, 7); // 7 days
          }

          const profile = await fetchUserProfile(newAccess);
          if (profile) {
            setUser(profile);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Session refresh initialization failed:", err);
      }
    }

    // No valid session
    eraseCookie("accessToken");
    eraseCookie("refreshToken");
    setUser(null);
    setLoading(false);
  };

  useEffect(() => {
    initializeSession();
  }, []);

  const refreshUser = async () => {
    const profile = await fetchUserProfile();
    if (profile) {
      setUser(profile);
    } else {
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const resData = await response.json();

      if (!response.ok) {
        let errorMessage = resData.error?.message || "Invalid credentials. Please try again.";
        if (resData.error?.details && Array.isArray(resData.error.details)) {
          errorMessage = resData.error.details.map((d: any) => d.message).join(". ");
        }
        return {
          success: false,
          error: errorMessage,
        };
      }

      const { tokens, user: loggedUser } = resData.data;
      const { accessToken, refreshToken } = tokens;

      // Save credentials in cookies
      setCookie("accessToken", accessToken, 15 / (24 * 60)); // 15 mins
      setCookie("refreshToken", refreshToken, 7); // 7 days

      setUser(loggedUser);
      return { success: true };
    } catch (err) {
      console.error("Login request error:", err);
      return { success: false, error: "Unable to connect to the login server." };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const resData = await response.json();

      if (!response.ok) {
        let errorMessage = resData.error?.message || "Registration failed. Email might already be registered.";
        if (resData.error?.details && Array.isArray(resData.error.details)) {
          errorMessage = resData.error.details.map((d: any) => d.message).join(". ");
        }
        return {
          success: false,
          error: errorMessage,
        };
      }

      // Registration is successful.
      return { success: true, message: resData.data.message || "Registration successful. Please verify your email." };
    } catch (err) {
      console.error("Registration request error:", err);
      return { success: false, error: "Unable to connect to the registration server." };
    }
  };

  const logout = async (redirectPath?: string) => {
    const refreshToken = getCookie("refreshToken");
    if (refreshToken) {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (err) {
        console.error("Logout request to api failed:", err);
      }
    }

    // Clear everything locally regardless of backend status
    eraseCookie("accessToken");
    eraseCookie("refreshToken");
    setUser(null);
    router.push(redirectPath ?? "/login");
  };

  const sendMagicLink = async (email: string, name?: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const response = await fetch(`${API_URL}/auth/magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const resData = await response.json();

      if (!response.ok) {
        let errorMessage = resData.error?.message || "Failed to send magic link.";
        if (resData.error?.details && Array.isArray(resData.error.details)) {
          errorMessage = resData.error.details.map((d: any) => d.message).join(". ");
        }
        return {
          success: false,
          error: errorMessage,
        };
      }

      if (resData.data?.magicLink) {
        console.log("Dev Magic Link from API Response:", resData.data.magicLink);
      }

      return { success: true };
    } catch (err) {
      console.error("Send magic link error:", err);
      return { success: false, error: "Unable to connect to the server." };
    }
  };

  const loginWithMagicLink = async (token: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const response = await fetch(`${API_URL}/auth/magic-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const resData = await response.json();

      if (!response.ok) {
        let errorMessage = resData.error?.message || "Invalid or expired magic link.";
        if (resData.error?.details && Array.isArray(resData.error.details)) {
          errorMessage = resData.error.details.map((d: any) => d.message).join(". ");
        }
        return {
          success: false,
          error: errorMessage,
        };
      }

      const { tokens, user: loggedUser } = resData.data;
      const { accessToken, refreshToken } = tokens;

      // Save credentials in cookies
      setCookie("accessToken", accessToken, 15 / (24 * 60)); // 15 mins
      setCookie("refreshToken", refreshToken, 7); // 7 days

      setUser(loggedUser);
      return { success: true, user: loggedUser };
    } catch (err) {
      console.error("Magic login error:", err);
      return { success: false, error: "Unable to connect to the server." };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, sendMagicLink, loginWithMagicLink }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
