import { AdminErrorBoundary } from "@/components/admin/AdminErrorBoundary";
import { SettingsPanel } from "@/components/admin/SettingsPanel";

export default function SettingsPage() {
  return (
    <AdminErrorBoundary title="Einstellungen konnten nicht geladen werden">
      <SettingsPanel />
    </AdminErrorBoundary>
  );
}
