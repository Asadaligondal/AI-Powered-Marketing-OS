import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { FileText } from "lucide-react";

export default function ContentPage() {
  return (
    <div className="space-y-8 pb-16">
      <PageHeader title="Content" subtitle="Phase 2 — multi-platform generation from a single topic." />
      <EmptyState
        icon={FileText}
        title="Content studio"
        description="Generate platform-specific drafts from your Brand Brain context in the next phase."
      />
    </div>
  );
}
