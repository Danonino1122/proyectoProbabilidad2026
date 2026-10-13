// Utilidades para la distribución t de Student con ν grados de libertad.
//
// A diferencia de la normal estándar, la t no tiene una fórmula cerrada simple
// para su acumulada: se apoya en la función beta incompleta regularizada I_x(a,b),
// que vive en special.ts porque la F del ANOVA necesita exactamente la misma.

import { lnGamma, regularizedIncompleteBeta, bisectCdf } from "./special";

/** Función de densidad de la t de Student: f(t; ν) */
export function pdfT(t: number, v: number): number {
  if (!(v > 0) || !Number.isFinite(t)) return 0;
  const logC = lnGamma((v + 1) / 2) - lnGamma(v / 2) - 0.5 * Math.log(v * Math.PI);
  return Math.exp(logC) * Math.pow(1 + (t * t) / v, -(v + 1) / 2);
}

/** Acumulada de la t de Student: F(t; ν) = P(T ≤ t) */
export function cdfT(t: number, v: number): number {
  if (!(v > 0)) return NaN;
  if (t === Infinity) return 1;
  if (t === -Infinity) return 0;
  if (!Number.isFinite(t)) return NaN;
  if (t === 0) return 0.5;
  const x = v / (v + t * t);
  const tail = 0.5 * regularizedIncompleteBeta(v / 2, 0.5, x);
  return t > 0 ? 1 - tail : tail;
}

/** Inversa de F: devuelve t tal que P(T ≤ t) = p, con ν grados de libertad.
 *  Se resuelve por bisección porque la acumulada es continua y estrictamente creciente. */
export function invT(p: number, v: number): number {
  if (!(v > 0)) return NaN;
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;
  return bisectCdf(t => cdfT(t, v), p, -1e3, 1e3);
}

/** Media de T: existe solo si ν > 1. */
export function meanT(v: number): number {
  return v > 1 ? 0 : NaN;
}

/** Varianza de T: ν/(ν−2) si ν > 2; infinita si 1 < ν ≤ 2. */
export function varT(v: number): number {
  if (v > 2) return v / (v - 2);
  if (v > 1) return Infinity;
  return NaN;
}
