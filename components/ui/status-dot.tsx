import { cn } from "@/lib/utils";

const toneClass = {
  default: "bg-muted-foreground",
  primary: "bg-primary",
  success: "bg-[color:var(--success)]",
  warning: "bg-muted-foreground/80",
  danger: "bg-destructive",
} as const;

export function StatusDot({
  tone = "default",
  className,
  pulse,
}: {
  tone?: keyof typeof toneClass;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-full",
        toneClass[tone],
        pulse && "animate-pulse",
        className,
      )}
      aria-hidden
    />
  );
}
