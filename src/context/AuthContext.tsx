"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { SanitizedUser } from "@/types/auth";
import { getSavedPlans } from "@/lib/saved-plans";

interface AuthContextType {
  user: SanitizedUser | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string; unverified?: boolean }>;
  register: (phone: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtpCode: (phone: string, code: string, purpose?: "registration" | "password_reset") => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SanitizedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.authenticated && data.user ? data.user : null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setUser(data.authenticated && data.user ? data.user : null);
          }
        } else if (!ignore) {
          setUser(null);
        }
      } catch {
        if (!ignore) setUser(null);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    initSession();
    return () => {
      ignore = true;
    };
  }, []);

  // Sync guest plans on login
  const mergeGuestPlans = async () => {
    try {
      const guestPlans = getSavedPlans();
      if (guestPlans.length > 0) {
        await fetch("/api/plans/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestPlans }),
        });
      }
    } catch (err) {
      console.warn("Guest plan merge error:", err);
    }
  };

  const login = async (phone: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        await mergeGuestPlans();
        return { success: true };
      }

      return {
        success: false,
        error: data.error || "Login failed.",
        unverified: data.unverified,
      };
    } catch {
      return { success: false, error: "Network error during login." };
    }
  };

  const register = async (phone: string, password: string, confirmPassword: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, confirmPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true };
      }

      return { success: false, error: data.error || "Registration failed." };
    } catch {
      return { success: false, error: "Network error during registration." };
    }
  };

  const verifyOtpCode = async (
    phone: string,
    code: string,
    purpose: "registration" | "password_reset" = "registration"
  ) => {
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, purpose }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user) {
          setUser(data.user);
          await mergeGuestPlans();
        }
        return { success: true };
      }

      return { success: false, error: data.error || "Verification failed." };
    } catch {
      return { success: false, error: "Network error during verification." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        verifyOtpCode,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
