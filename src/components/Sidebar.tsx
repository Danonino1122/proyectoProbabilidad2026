"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sigma, Calculator, BellRing, BookOpen, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/varianza", label: "Varianza", icon: Sigma },
  { href: "/valor-esperado", label: "Valor Esperado", icon: Calculator },
  { href: "/normal", label: "Normal Estándar", icon: BellRing },
  { href: "/problemas", label: "Problemas", icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 w-64 hidden md:flex flex-col border-r border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-xl z-20">
      <div className="px-6 pt-6 pb-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] grid place-items-center text-white font-bold shadow-lg">
            Σ
          </div>
          <div>
            <div className="font-semibold tracking-tight">ProbaLab</div>
            <div className="text-xs text-[var(--muted)]">Probabilidad y Estadística</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                active
                  ? "bg-[var(--accent)]/15 text-white border border-[var(--accent)]/30"
                  : "text-[var(--muted)] hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 text-xs text-[var(--muted)] border-t border-[var(--border)]">
        Proyecto universitario · 2026
      </div>
    </aside>
  );
}
