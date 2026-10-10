#!/usr/bin/env node
/**
 * ─────────────────────────────────────────────────────────────
 * CHOLO BONDHU — Administrator Provisioning Utility
 * 
 * Secure out-of-band administrative role promotion script.
 * Enforces phone canonicalization and role assignment in MongoDB.
 * Never prints secrets or plaintext credentials.
 * ─────────────────────────────────────────────────────────────
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." node scripts/provision-admin.mjs 9876543210
 */

import { MongoClient } from "mongodb";

function normalizeIndianMobile(raw) {
  if (!raw || typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "");
  let tenDigit = "";
  if (digits.length === 10) {
    tenDigit = digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    tenDigit = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith("91")) {
    tenDigit = digits.slice(2);
  } else {
    return null;
  }

  if (!/^[6-9]\d{9}$/.test(tenDigit)) {
    return null;
  }

  return `+91${tenDigit}`;
}

async function main() {
  const phoneArg = process.argv[2];
  if (!phoneArg) {
    console.error("Error: Please provide a 10-digit Indian mobile number to promote to admin.");
    console.error("Usage: node scripts/provision-admin.mjs <phone_number>");
    process.exit(1);
  }

  const canonicalPhone = normalizeIndianMobile(phoneArg);
  if (!canonicalPhone) {
    console.error("Error: Invalid Indian mobile number. Must be a valid 10-digit number starting with 6, 7, 8, or 9.");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    console.error("Error: MONGODB_URI environment variable is not defined.");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("cholobondhu");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ phone: canonicalPhone });
    if (!user) {
      console.error(
        `Error: No user found for phone ${canonicalPhone.slice(0, 5)}*****${canonicalPhone.slice(-2)}.`
      );
      console.error(
        "For security, the user must first register and verify their phone number via the app before being promoted to admin."
      );
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`User ${canonicalPhone.slice(0, 5)}*****${canonicalPhone.slice(-2)} is already an Administrator.`);
      process.exit(0);
    }

    const result = await usersCollection.updateOne(
      { phone: canonicalPhone },
      {
        $set: {
          role: "admin",
          updatedAt: new Date().toISOString(),
        },
        $inc: {
          securityVersion: 1,
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `Success: User ${canonicalPhone.slice(0, 5)}*****${canonicalPhone.slice(-2)} has been promoted to Administrator.`
      );
      console.log("Their active sessions have been invalidated; they must log in again with their new admin privileges.");
    } else {
      console.error("Failed to update user role.");
      process.exit(1);
    }
  } catch (err) {
    console.error("Database connection error during provisioning:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
