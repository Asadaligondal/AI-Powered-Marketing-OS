import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { CalendarDays } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="space-y-8 pb-16">
      <PageHeader title="Calendar" subtitle="Phase 3 — schedule, drag-reschedule, and publish workflows." />
      <EmptyState
        icon={CalendarDays}
        title="Calendar"
        description="Month view and scheduling arrive in Phase 3."
      />
    </div>
  );
}
