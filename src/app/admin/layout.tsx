import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { getAdminUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser();

  if (!admin) {
    let hasUser = false;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      hasUser = Boolean(data.user);
    } catch {
      hasUser = false;
    }
    // Non-admin sessions are cleared via logout (cookie writes only there / proxy).
    redirect(hasUser ? "/api/auth/logout" : "/login");
  }

  return (
    <div className="min-h-dvh md:pl-56">
      <AdminNav />
      <div className="safe-pad mx-auto w-full max-w-6xl pb-24 pt-6 md:pb-8">
        {children}
      </div>
    </div>
  );
}
