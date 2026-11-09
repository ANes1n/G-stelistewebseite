import "server-only";

import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";

export async function requireAdminApi() {
  const user = await getAdminUser();
  if (!user) {
    return {
      user: null as null,
      error: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, error: null as null };
}
