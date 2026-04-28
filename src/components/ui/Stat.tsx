import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
  accent?: boolean;
}

export function Stat({ label, value, hint, className, accent }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4",
        accent && "bg-gradient-to-br from-[var(--accent)]/15 to-transparent border-[var(--accent)]/30",
        className
      )}
    >
      <div className="text-xs uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <div className="text-2xl font-semibold mt-1 font-mono">{value}</div>
      {hint && <div className="text-xs text-[var(--muted)] mt-1">{hint}</div>}
    </div>
  );
}
