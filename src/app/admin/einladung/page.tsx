import { AdminErrorBoundary } from "@/components/admin/AdminErrorBoundary";
import { EventPanel } from "@/components/admin/EventPanel";

export default function AdminEinladungPage() {
  return (
    <AdminErrorBoundary title="Einladung konnte nicht geladen werden">
      <EventPanel />
    </AdminErrorBoundary>
  );
}
