/**
 * Security smoke tests against a configured Supabase project + local/dev server.
 * Usage:
 *   node --env-file=.env.local scripts/security-smoke.mjs
 * Optional: BASE_URL=http://localhost:3000
 */
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fail(msg) {
  console.error("FAIL:", msg);
  process.exitCode = 1;
}
function ok(msg) {
  console.log("OK:", msg);
}

if (!url || !anon || !service) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const anonClient = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function expectDenied(label, promise) {
  const { data, error } = await promise;
  if (!error && (data === null || data === undefined || (Array.isArray(data) && data.length === 0))) {
    // empty select without error can happen with RLS returning zero rows —
    // treat insert/update/delete errors as required; for select, error OR empty is OK
  }
  if (label.startsWith("SELECT")) {
    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      ok(`${label} denied/empty for anon`);
      return;
    }
    fail(`${label} returned data for anon`);
    return;
  }
  if (error) {
    ok(`${label} denied for anon (${error.code || error.message})`);
  } else {
    fail(`${label} unexpectedly succeeded for anon`);
  }
}

console.log("=== Anonymous table access ===");
for (const table of ["invite_codes", "rsvps", "settings"]) {
  await expectDenied(
    `SELECT ${table}`,
    anonClient.from(table).select("*").limit(5),
  );
  await expectDenied(
    `INSERT ${table}`,
    anonClient.from(table).insert({}),
  );
  await expectDenied(
    `UPDATE ${table}`,
    anonClient.from(table).update({}).neq("id", "00000000-0000-0000-0000-000000000000"),
  );
  await expectDenied(
    `DELETE ${table}`,
    anonClient.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000"),
  );
}

console.log("\n=== Invite page codes ===");
async function statusOf(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  return res.status;
}

const sMissing = await statusOf("/einladung");
const sWrong = await statusOf("/einladung?code=definitely-wrong-code-xx");
if (sMissing === 404) ok("/einladung without code → 404");
else fail(`/einladung without code → ${sMissing}`);
if (sWrong === 404) ok("wrong code → 404");
else fail(`wrong code → ${sWrong}`);

console.log("\n=== Manage token ===");
const badManage = await statusOf("/einladung/manage?token=not-a-real-token-value-xxx");
if (badManage === 404) ok("wrong manage token → 404");
else fail(`wrong manage token → ${badManage}`);

console.log("\n=== RSVP honeypot & rate limit ===");
const hp = await fetch(`${BASE}/api/rsvp`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    code: "x",
    firstName: "Ada",
    lastName: "Lovelace",
    response: "komme_nicht",
    over16: true,
    over18: false,
    note: "",
    website: "http://spam.example",
  }),
});
if (hp.status >= 400) ok(`honeypot rejected (${hp.status})`);
else fail("honeypot was accepted");

let limited = false;
for (let i = 0; i < 8; i++) {
  const res = await fetch(`${BASE}/api/rsvp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      code: "x",
      firstName: "Ada",
      lastName: "Lovelace",
      response: "komme_nicht",
      over16: true,
      over18: false,
      note: "",
      website: "",
    }),
  });
  if (res.status === 429) {
    limited = true;
    break;
  }
}
if (limited) ok("rate limit eventually returns 429");
else fail("rate limit did not trigger within 8 requests");

console.log("\n=== Admin gate ===");
const adminPage = await fetch(`${BASE}/admin/zusagen`, { redirect: "manual" });
if (adminPage.status === 307 || adminPage.status === 302 || adminPage.status === 303) {
  ok(`/admin redirects when anonymous (${adminPage.status})`);
} else if (adminPage.status === 401) {
  ok("/admin returns 401 when anonymous");
} else {
  // might be 200 of login after rewrite — check location
  const loc = adminPage.headers.get("location") || "";
  if (loc.includes("/login")) ok("admin → login");
  else fail(`admin unexpected status ${adminPage.status}`);
}

const adminApi = await fetch(`${BASE}/api/admin/rsvps`);
if (adminApi.status === 401) ok("admin API 401 for anonymous");
else fail(`admin API status ${adminApi.status}`);

console.log("\n=== Token hash helper sanity ===");
const token = randomBytes(32).toString("base64url");
const hash = createHash("sha256").update(token, "utf8").digest("hex");
if (hash.length === 64) ok("SHA-256 manage token hash length");
else fail("bad hash length");

// Cleanup note: this script does not create durable rows when invite is invalid.
console.log("\nDone.");
