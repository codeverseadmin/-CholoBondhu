// ─────────────────────────────────────────────
// CHOLO BONDHU — Authentication & Identity Type Contracts
// ─────────────────────────────────────────────

import type { SavedPlan } from "./index";

export type UserRole = "user" | "admin";

export type PhoneVerificationStatus =
  | "phone_unverified"
  | "verification_pending"
  | "active"
  | "suspended"
  | "recovery_pending";

export interface UserRecord {
  id: string;
  phone: string; // Canonical E.164 (+91XXXXXXXXXX)
  passwordHash: string;
  phoneVerificationStatus: PhoneVerificationStatus;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  securityVersion: number;
}

export interface SanitizedUser {
  id: string;
  phone: string;
  displayPhone: string;
  phoneVerificationStatus: PhoneVerificationStatus;
  role: UserRole;
  createdAt: string;
}

export interface SessionRecord {
  id: string; // 64-char hex token
  userId: string;
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export type PasswordRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "expired";

export interface PasswordRequestRecord {
  id: string;
  userId: string;
  phone?: string;
  status: PasswordRequestStatus;
  reason?: string;
  requestedAt?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByAdminId?: string;
  adminNotes?: string;
  resetTokenHash?: string;
  resetExpiresAt?: string;
  resetTokenExpiresAt?: string;
  completedAt?: string;
}

export interface OtpRecord {
  phone: string;
  codeHash: string;
  purpose: "registration" | "password_reset" | "login";
  attempts: number;
  createdAt: string;
  expiresAt: string;
  lastSentAt: string;
}

export interface UserOwnedPlanRecord {
  id: string;
  userId: string;
  name: string;
  savedAt: string;
  version: number;
  itinerary: SavedPlan["itinerary"];
  updatedAt: string;
}
