import { redirect } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";
import { LayoutDashboard } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: brand } = await supabase.from("brands").select("name").eq("user_id", user.id).maybeSingle();

  const name = brand?.name ?? "your brand";

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your workspace — richer widgets arrive in Phase 5."
      />
      <EmptyState
        icon={LayoutDashboard}
        title={`Welcome, ${name}`}
        description="Dashboard overview ships in Phase 5. Brand Brain and navigation are live — open Brand from the sidebar to tune positioning."
      />
    </div>
  );
}
