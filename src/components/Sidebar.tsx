"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sigma, Calculator, BellRing, BookOpen, Home, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const groups: { label?: string; items: { href: string; label: string; icon: typeof Home }[] }[] = [
  {
    items: [{ href: "/", label: "Inicio", icon: Home }],
  },
  {
    label: "Cálculos",
    items: [
      { href: "/varianza", label: "Varianza", icon: Sigma },
      { href: "/valor-esperado", label: "Valor esperado", icon: Calculator },
      { href: "/normal", label: "Normal estándar", icon: BellRing },
    ],
  },
  {
    label: "Práctica",
    items: [{ href: "/problemas", label: "Problemas resueltos", icon: BookOpen }],
  },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside
      aria-hidden={collapsed}
      className={cn(
        "fixed inset-y-0 left-0 w-[260px] hidden md:flex flex-col border-r border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-xl z-20",
        "transition-transform duration-300 ease-out",
        collapsed && "-translate-x-full"
      )}
    >
      {/* Brand + collapse toggle */}
      <div className="px-5 pt-6 pb-7 flex items-center justify-between gap-3">
        <Link href="/" className="group inline-flex items-center gap-2.5 min-w-0">
          <div className="relative h-9 w-9 shrink-0 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border-strong)] grid place-items-center overflow-hidden">
            <span className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/35 to-transparent" />
            <span className="relative font-semibold text-white">Σ</span>
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[15px] font-semibold tracking-tight text-white truncate">ProbaLab</span>
            <span className="text-[11px] text-[var(--muted-2)] truncate">Probabilidad · 2026</span>
          </div>
        </Link>

        <button
          onClick={onToggle}
          aria-label="Cerrar menú"
          title="Cerrar menú (Ctrl+B)"
          className="shrink-0 h-7 w-7 grid place-items-center rounded-[6px] text-[var(--muted-2)] hover:text-white hover:bg-white/[.04] transition-colors"
        >
          <PanelLeftClose className="h-[15px] w-[15px]" />
        </button>
      </div>

      <div className="divider-x mx-5" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {groups.map((group, gi) => (
          <div key={gi} className="space-y-0.5">
            {group.label && (
              <div className="px-3 pb-1.5 text-[10.5px] font-medium uppercase tracking-[0.16em] text-[var(--muted-2)]">
                {group.label}
              </div>
            )}
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-3 pl-4 pr-3 py-2 rounded-[var(--r-sm)] text-[13.5px] transition-colors duration-150",
                    active
                      ? "text-white bg-white/[.04]"
                      : "text-[var(--muted)] hover:text-white hover:bg-white/[.025]"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r-full bg-[var(--accent)]" />
                  )}
                  <Icon className={cn("h-[15px] w-[15px]", active ? "text-[var(--accent)]" : "text-[var(--muted-2)]")} />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer status */}
      <div className="px-5 py-4 border-t border-[var(--border)] flex items-center gap-2 text-[11px] text-[var(--muted)]">
        <span className="dot text-[var(--success)]" />
        Sistema operativo
      </div>
    </aside>
  );
}
