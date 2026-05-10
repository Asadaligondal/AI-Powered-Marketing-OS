import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: brand } = await supabase.from("brands").select("name").eq("user_id", user.id).maybeSingle();

  return (
    <div className="rounded-lg border border-[#222222] bg-[#111111] p-6">
      <h1 className="text-lg font-medium text-[#F5F5F5]">Welcome, {brand?.name ?? "your brand"}</h1>
      <p className="mt-2 text-sm text-[#A3A3A3]">
        Dashboard overview ships in Phase 5 — navigation and Brand Brain are live now.
      </p>
    </div>
  );
}
