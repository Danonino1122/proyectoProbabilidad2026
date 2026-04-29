import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type Tone = "default" | "elevated" | "featured" | "quiet";
type Pad = "sm" | "md" | "lg";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  pad?: Pad;
}

const toneClass: Record<Tone, string> = {
  default: "surface",
  elevated: "surface-elevated",
  featured: "surface-featured",
  quiet: "surface-quiet",
};

const padClass: Record<Pad, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ className, tone = "default", pad = "md", ...props }: CardProps) {
  return (
    <div
      className={cn(
        toneClass[tone],
        padClass[pad],
        "rounded-[var(--r-lg)] shadow-[0_1px_0_rgba(255,255,255,0.02)_inset]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-5 flex flex-col gap-1", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("h-card", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[13px] text-[var(--muted)] leading-relaxed", className)} {...props} />;
}
