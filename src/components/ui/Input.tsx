import { cn } from "@/lib/utils";
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

const baseField =
  "w-full rounded-[var(--r-sm)] bg-[var(--surface-2)]/70 border border-[var(--border)] text-white text-sm placeholder:text-[var(--muted-2)] " +
  "hover:border-[var(--border-strong)] " +
  "focus:outline-none focus:border-[var(--accent)]/70 focus:ring-2 focus:ring-[var(--accent)]/25 " +
  "transition-colors duration-150";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(baseField, "h-9 px-3 num", className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(baseField, "px-3 py-2.5 num leading-relaxed resize-y", className)} {...props} />
  )
);
Textarea.displayName = "Textarea";
