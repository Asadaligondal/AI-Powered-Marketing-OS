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
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Ambient gradient orbs — paint behind all content */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-1/4 top-0 h-[500px] w-[500px] animate-pulse rounded-full bg-violet-600/[0.07] blur-3xl" />
        <div
          className="absolute bottom-1/4 left-1/3 h-[600px] w-[600px] animate-pulse rounded-full bg-fuchsia-600/[0.06] blur-3xl"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute right-1/3 top-1/2 h-[400px] w-[400px] animate-pulse rounded-full bg-blue-600/[0.04] blur-3xl"
          style={{ animationDelay: "4s" }}
        />
      </div>

      {/* Sidebar + main above the orbs */}
      <div className="relative z-10 flex min-h-screen">
        <AppSidebar brandName={brand?.name ?? "Brand"} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <main className="flex-1 overflow-auto px-6 py-8 md:px-10">
            <div className="mx-auto max-w-[1280px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
