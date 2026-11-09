import { redirect } from "next/navigation";

/** German path alias for /admin/settings */
export default function EinstellungenAliasPage() {
  redirect("/admin/settings");
}
