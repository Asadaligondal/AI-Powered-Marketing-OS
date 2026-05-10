import * as React from "react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function Section({
  eyebrow,
  title,
  description,
  children,
  className,
  density = "comfortable",
  layout = "split",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  density?: "comfortable" | "compact";
  layout?: "split" | "stack";
}) {
  const meta = Boolean(eyebrow || title || description);

  return (
    <section className={cn(density === "compact" ? "space-y-4" : "space-y-6", className)}>
      {meta ? (
        <div
          className={cn(
            layout === "stack"
              ? "flex flex-col gap-4"
              : "grid gap-6 md:grid-cols-[minmax(0,240px)_1fr] md:items-start md:gap-8",
          )}
        >
          <div className="space-y-1">
            {eyebrow ? (
              <p className="text-[13px] font-medium uppercase tracking-[0.4px] text-muted-foreground">{eyebrow}</p>
            ) : null}
            {title ? <h2 className="text-base font-medium tracking-tight text-foreground">{title}</h2> : null}
            {description ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <div className="min-w-0">{children}</div>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

export function SectionDivider({ className }: { className?: string }) {
  return <Separator className={cn("my-8 bg-border", className)} />;
}
