import * as React from "react";

import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center rounded-sm border border-border bg-muted px-1 font-mono text-[11px] font-medium text-muted-foreground shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.2)]",
        className,
      )}
      {...props}
    />
  );
}
