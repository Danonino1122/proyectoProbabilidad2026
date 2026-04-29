import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "hero";

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
  accent?: boolean;
  size?: Size;
  trailing?: React.ReactNode;
}

const valueClass: Record<Size, string> = {
  sm: "text-[15px] md:text-base",
  md: "text-2xl",
  lg: "text-3xl",
  hero: "text-[44px] leading-none",
};

const padClass: Record<Size, string> = {
  sm: "px-3.5 py-3",
  md: "px-4 py-3.5",
  lg: "px-5 py-4",
  hero: "px-6 py-5",
};

export function Stat({ label, value, hint, className, accent, size = "md", trailing }: Props) {
  return (
    <div
      className={cn(
        "rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface-2)]/55 transition-colors",
        accent && "bg-gradient-to-br from-[var(--accent)]/14 via-[var(--surface-2)]/40 to-transparent border-[var(--accent)]/35",
        padClass[size],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="label">{label}</div>
        {trailing}
      </div>
      <div className={cn("num font-semibold mt-2 text-white", valueClass[size])}>
        {value}
      </div>
      {hint && <div className="text-[12px] text-[var(--muted)] mt-1.5 leading-snug">{hint}</div>}
    </div>
  );
}
