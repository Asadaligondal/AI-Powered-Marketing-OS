"use client";

import {
  CalendarDays,
  ChevronUp,
  FileText,
  LayoutDashboard,
  LogOut,
  Palette,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/brand", label: "Brand", icon: Palette },
  { href: "/content", label: "Content", icon: FileText },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/leads", label: "Leads", icon: Users },
] as const;

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const chars =
    parts.length >= 2
      ? `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`
      : (parts[0]?.slice(0, 2) ?? "?");
  return chars.toUpperCase();
}

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
      className="flex h-screen w-[240px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-colors duration-150 ease-out"
      aria-label="Main navigation"
    >
      <div className="border-b border-sidebar-border px-4 py-4 shadow-[var(--elev-edge)]">
        <p className="text-[13px] font-medium uppercase tracking-[0.4px] text-muted-foreground">
          AI Marketing OS
        </p>
        <p className="mt-0.5 truncate text-[14px] font-medium tracking-tight text-foreground">{brandName}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2 pt-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150 ease-out",
                active
                  ? "bg-muted text-foreground before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0 opacity-85" strokeWidth={1.5} aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left outline-none transition-colors duration-150 ease-out hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar size="sm" className="size-7 border border-border">
              <AvatarFallback className="text-[11px] font-medium">{initialsFromName(brandName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">Account</p>
              <p className="truncate text-[11px] text-muted-foreground">{brandName}</p>
            </div>
            <ChevronUp className="size-4 shrink-0 text-muted-foreground opacity-70" strokeWidth={1.5} aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="min-w-52">
            <DropdownMenuItem onClick={() => void signOut()} className="gap-2 text-[13px]">
              <LogOut className="size-3.5" strokeWidth={1.5} aria-hidden />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
