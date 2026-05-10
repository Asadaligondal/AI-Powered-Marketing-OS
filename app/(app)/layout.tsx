import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AppGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: brand } = await supabase.from("brands").select("name").eq("user_id", user.id).maybeSingle();

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">
      <AppSidebar brandName={brand?.name ?? "Brand"} />
      <main className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}
