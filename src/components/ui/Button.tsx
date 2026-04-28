"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none";
    const variants = {
      primary:
        "bg-gradient-to-br from-[var(--accent)] to-[#5c3dff] text-white hover:opacity-90 shadow-lg shadow-[var(--accent)]/20",
      secondary:
        "bg-[var(--surface-2)] border border-[var(--border)] text-white hover:bg-white/5",
      ghost: "text-[var(--muted)] hover:text-white hover:bg-white/5",
    };
    return <button ref={ref} className={cn(base, variants[variant], className)} {...props} />;
  }
);
Button.displayName = "Button";
