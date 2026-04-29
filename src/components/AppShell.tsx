"use client";

import { useEffect, useState } from "react";
import { PanelLeftOpen } from "lucide-react";
import Sidebar from "./Sidebar";

const STORAGE_KEY = "probalab.sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "collapsed") setCollapsed(true);
    setHydrated(true);
  }, []);

  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "expanded");
      return next;
    });
  };

  // keyboard shortcut Ctrl/⌘+B
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative flex min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      <main
        className={
          "relative flex-1 z-10 transition-[margin] duration-300 ease-out " +
          (collapsed ? "md:ml-0" : "md:ml-[260px]")
        }
      >
        <div className="mx-auto w-full max-w-[1180px] px-6 md:px-10 py-8 md:py-12">
          {children}
        </div>
      </main>

      {/* Floating reopen button — visible only when sidebar is collapsed */}
      {hydrated && collapsed && (
        <button
          onClick={toggle}
          aria-label="Abrir menú"
          title="Abrir menú (Ctrl+B)"
          className="fixed top-5 left-4 hidden md:flex h-9 w-9 items-center justify-center rounded-[var(--r-sm)] bg-[var(--surface-2)]/90 border border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] z-30 backdrop-blur-md shadow-[0_4px_16px_-4px_rgba(0,0,0,0.45)] transition-colors"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
