import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Users } from "lucide-react";

export default function LeadsPage() {
  return (
    <div className="space-y-8 pb-16">
      <PageHeader title="Leads" subtitle="Phase 4 — simulated DMs, parsing, and Klaviyo sync." />
      <EmptyState icon={Users} title="Leads" description="Lead capture and CRM handoff ship in Phase 4." />
    </div>
  );
}
