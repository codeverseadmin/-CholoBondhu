// ─────────────────────────────────────────────
// CHOLO BONDHU — Secure Password Hashing & Verification
//
// Memory-hard scrypt algorithm with cryptographically random salt,
// constant-time verification, and strict password policy.
// ─────────────────────────────────────────────

import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";

function deriveScryptKey(password: string, salt: Buffer, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, SCRYPT_PARAMS, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
}

const SCRYPT_KEY_LEN = 64;
const SCRYPT_PARAMS = {
  N: 16384, // CPU/memory cost
  r: 8,     // Block size
  p: 1,     // Parallelization
};

export interface PasswordPolicyResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate password against production security requirements:
 * - 8 to 128 characters
 * - Not purely whitespace
 */
export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password is required." };
  }

  if (password.length < 8) {
    return {
      valid: false,
      error: "Password must be at least 8 characters long.",
    };
  }

  if (password.length > 128) {
    return {
      valid: false,
      error: "Password must not exceed 128 characters.",
    };
  }

  if (password.trim().length === 0) {
    return {
      valid: false,
      error: "Password cannot consist solely of whitespace.",
    };
  }

  return { valid: true };
}

/**
 * Hash password securely using memory-hard scrypt with 16-byte random salt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await deriveScryptKey(password, salt, SCRYPT_KEY_LEN);

  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

/**
 * Constant-time password verification defending against timing attacks
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  if (!storedHash || !storedHash.startsWith("scrypt:")) {
    return false;
  }

  const parts = storedHash.split(":");
  if (parts.length !== 3) {
    return false;
  }

  const [, saltHex, originalKeyHex] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const originalKey = Buffer.from(originalKeyHex, "hex");

  try {
    const derivedKey = await deriveScryptKey(password, salt, originalKey.length);

    return timingSafeEqual(originalKey, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically secure random token (e.g., for sessions or password resets)
 */
export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Hash a high-entropy token (e.g. for reset tokens) before database storage
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
