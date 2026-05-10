"use client";

import {
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Palette,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/brand", label: "Brand", icon: Palette },
  { href: "/content", label: "Content", icon: FileText },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/leads", label: "Leads", icon: Users },
] as const;

export function AppSidebar({ brandName }: { brandName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className="flex h-screen w-[240px] shrink-0 flex-col border-r border-[#222222] bg-[#111111] transition-colors duration-150 ease-out"
      aria-label="Main navigation"
    >
      <div className="border-b border-[#222222] px-4 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-[#737373]">
          AI Marketing OS
        </p>
        <p className="mt-1 truncate text-sm font-medium text-[#F5F5F5]">{brandName}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150 ease-out",
                active
                  ? "bg-[#1A1A1A] text-[#F5F5F5]"
                  : "text-[#A3A3A3] hover:bg-[#1A1A1A]/60 hover:text-[#F5F5F5]",
              )}
            >
              <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#222222] p-2">
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-[#A3A3A3] transition-colors duration-150 ease-out hover:bg-[#1A1A1A]/60 hover:text-[#F5F5F5]"
        >
          <LogOut className="size-4 shrink-0 opacity-80" aria-hidden />
          Sign out
        </button>
      </div>
    </aside>
  );
}
