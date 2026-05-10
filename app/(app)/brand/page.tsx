import { redirect } from "next/navigation";

import { BrandBrainClient } from "@/components/brand/brand-brain-client";
import { createClient } from "@/lib/supabase/server";
import type { BrandRow } from "@/lib/types";

export default async function BrandPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: brand, error } = await supabase.from("brands").select("*").eq("user_id", user.id).single();

  if (error || !brand) {
    return (
      <div className="rounded-lg border border-[#222222] bg-[#111111] p-6 text-[#F5F5F5]">
        <p className="text-sm">No brand row found for this account.</p>
        <p className="mt-2 text-sm text-[#A3A3A3]">
          Run migrations, set env vars, then <code className="rounded bg-[#0A0A0A] px-1 py-0.5 text-xs">npm run seed</code>.
        </p>
      </div>
    );
  }

  return <BrandBrainClient brand={brand as BrandRow} />;
}
