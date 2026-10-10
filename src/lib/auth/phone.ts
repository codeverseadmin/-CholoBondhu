// ─────────────────────────────────────────────
// CHOLO BONDHU — Indian Mobile Number Normalizer & Validator
//
// Strictly enforces canonical E.164 (+91XXXXXXXXXX) format
// for valid Indian telecom circles (digits 6, 7, 8, 9).
// ─────────────────────────────────────────────

export interface PhoneNormalizationResult {
  success: boolean;
  canonical?: string;
  display?: string;
  masked?: string;
  error?: string;
}

/**
 * Normalizes and validates Indian mobile phone numbers.
 * Supported inputs:
 *  - "+91 98300 12345"
 *  - "+919830012345"
 *  - "9830012345"
 *  - "09830012345"
 *  - "919830012345"
 *  - "98300-12345"
 */
export function normalizeIndianPhoneNumber(raw: string): PhoneNormalizationResult {
  if (!raw || typeof raw !== "string") {
    return { success: false, error: "Phone number is required." };
  }

  // Strip all whitespace, hyphens, parentheses, and dots
  const cleaned = raw.replace(/[\s\-\(\)\.]/g, "");

  // Extract digits and optional leading plus
  let digits = cleaned;
  if (digits.startsWith("+91")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  } else if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  }

  // Ensure digits contains only 0-9
  if (!/^\d+$/.test(digits)) {
    return {
      success: false,
      error: "Phone number must contain only numeric digits.",
    };
  }

  // Indian mobile numbers must be exactly 10 digits
  if (digits.length !== 10) {
    return {
      success: false,
      error: `Indian mobile number must be exactly 10 digits (received ${digits.length}).`,
    };
  }

  // Valid Indian mobile numbers start with 6, 7, 8, or 9
  const firstDigit = digits.charAt(0);
  if (!["6", "7", "8", "9"].includes(firstDigit)) {
    return {
      success: false,
      error: "Indian mobile number must start with 6, 7, 8, or 9.",
    };
  }

  const canonical = `+91${digits}`;
  const display = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  const masked = `+91 ${digits.slice(0, 2)}*** ***${digits.slice(8)}`;

  return {
    success: true,
    canonical,
    display,
    masked,
  };
}

export function normalizeIndianMobile(raw: string): string | null {
  const res = normalizeIndianPhoneNumber(raw);
  return res.success ? (res.canonical || null) : null;
}

export function isValidIndianMobile(raw: string): boolean {
  return normalizeIndianPhoneNumber(raw).success;
}

export function maskPhoneNumber(raw: string): string {
  const norm = normalizeIndianPhoneNumber(raw);
  if (norm.success && norm.canonical) {
    const digits = norm.canonical.slice(3);
    return `+91 ••••• ••${digits.slice(-3)}`;
  }
  return raw;
}

