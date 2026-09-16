import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea un número con n decimales, quitando ceros sobrantes */
export function fmt(n: number, decimals = 4): string {
  if (!Number.isFinite(n)) return "—";
  const fixed = n.toFixed(decimals);
  // Solo se recortan ceros de la parte decimal: sin este guardia,
  // fmt(10, 0) devolvería "1" al comerse el cero de las decenas.
  return fixed.includes(".") ? fixed.replace(/\.?0+$/, "") : fixed;
}

/** Parsea una lista de números separados por coma, espacio o salto de línea */
export function parseNumberList(raw: string): number[] {
  return raw
    .split(/[\s,;]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter(n => Number.isFinite(n));
}
