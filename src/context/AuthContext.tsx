"use client";

import React, { createContext, useContext } from "react";
import type { SanitizedUser } from "@/types/auth";

interface AuthContextType {
  user: SanitizedUser | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string; unverified?: boolean }>;
  register: (phone: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtpCode: (phone: string, code: string, purpose?: "registration" | "password_reset") => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const defaultContext: AuthContextType = {
  user: null,
  isLoading: false,
  login: async () => ({ success: true }),
  register: async () => ({ success: true }),
  verifyOtpCode: async () => ({ success: true }),
  logout: async () => {},
  refreshUser: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={defaultContext}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
