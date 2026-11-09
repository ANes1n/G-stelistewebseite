import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function generateManageToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Constant-time compare for equal-length strings (UTF-8 / hex). */
export function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Still run a comparison to reduce timing noise on length mismatch.
    timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function hashEquals(token: string, storedHash: string): boolean {
  const computed = hashToken(token);
  return safeEqualString(computed, storedHash);
}
