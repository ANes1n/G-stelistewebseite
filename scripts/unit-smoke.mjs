/**
 * Local unit smoke tests (no network / no Supabase required).
 */
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { z } from "zod";

function ok(m) {
  console.log("OK:", m);
}
function fail(m) {
  console.error("FAIL:", m);
  process.exitCode = 1;
}

// --- token hash ---
const token = randomBytes(32).toString("base64url");
const hash = createHash("sha256").update(token, "utf8").digest("hex");
const hash2 = createHash("sha256").update(token, "utf8").digest("hex");
if (hash === hash2 && hash.length === 64) ok("token SHA-256 stable");
else fail("token hash");

const a = Buffer.from(hash, "utf8");
const b = Buffer.from(hash2, "utf8");
if (timingSafeEqual(a, b)) ok("timingSafeEqual match");
else fail("timingSafeEqual match");

// --- zod HTML reject ---
const HTML_PATTERN = /[<>]|&#|javascript:/i;
const nameField = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .superRefine((value, ctx) => {
    if (HTML_PATTERN.test(value)) {
      ctx.addIssue({ code: "custom", message: "Ungültige Zeichen" });
    }
  });

if (!nameField.safeParse("<script>").success) ok("rejects HTML in name");
else fail("HTML accepted");
if (nameField.safeParse("  Ada  ").success) ok("trims name");
else fail("trim failed");

// --- honeypot schema ---
const rsvpLite = z.object({
  website: z.string().max(0).optional().or(z.literal("")),
});
if (!rsvpLite.safeParse({ website: "x" }).success) ok("honeypot max(0)");
else fail("honeypot accepted");

// --- in-memory rate limit ---
const buckets = new Map();
function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (existing.count >= limit) return { ok: false };
  existing.count += 1;
  return { ok: true };
}
let hit = false;
for (let i = 0; i < 6; i++) {
  if (!rateLimit("t", 5, 60_000).ok) hit = true;
}
if (hit) ok("rate limit blocks after 5");
else fail("rate limit");

console.log("unit smoke done");
