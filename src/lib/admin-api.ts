import "server-only";

import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { isAdminUiPreview } from "@/lib/admin-preview-store";

export async function requireAdminApi() {
  if (isAdminUiPreview()) {
    return {
      user: {
        id: "preview-admin",
        email: process.env.ADMIN_EMAIL?.trim().toLowerCase() || "preview@local",
      },
      error: null as null,
    };
  }

  const user = await getAdminUser();
  if (!user) {
    return {
      user: null as null,
      error: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, error: null as null };
}
