import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string;
};

/**
 * Returns the admin user only when getUser succeeds and email matches ADMIN_EMAIL.
 * Transient errors / missing session → null (never treat as definitive logout on the client).
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email) return null;

    const email = data.user.email.trim().toLowerCase();
    if (email !== adminEmail) return null;

    return { id: data.user.id, email };
  } catch {
    return null;
  }
}

export async function requireAdminUser(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) {
    const err = new Error("Unauthorized");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  return user;
}
