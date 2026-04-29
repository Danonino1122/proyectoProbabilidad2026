"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-3.5 text-sm",
};

const variants: Record<Variant, string> = {
  primary:
    "text-white bg-[var(--accent)] hover:bg-[#8b6dff] active:bg-[#6a4cf5] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_0_rgba(0,0,0,0.6)]",
  secondary:
    "text-white bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--surface-3)] hover:border-[var(--border-strong)] active:bg-[var(--surface)]",
  ghost:
    "text-[var(--muted)] hover:text-white hover:bg-white/[.04] active:bg-white/[.02]",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-[var(--r-sm)] font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";
    return <button ref={ref} className={cn(base, sizes[size], variants[variant], className)} {...props} />;
  }
);
Button.displayName = "Button";
