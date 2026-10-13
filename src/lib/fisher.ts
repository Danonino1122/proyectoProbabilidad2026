// Distribución F de Fisher-Snedecor con d1 y d2 grados de libertad.
//
// Es la distribución del cociente de dos varianzas, y por eso es la que cierra
// el ANOVA: F = CMT / CME compara la variación entre tratamientos contra la
// variación dentro de los grupos.
//
// Su acumulada se apoya en la misma beta incompleta regularizada que ya usaba
// la t de Student (special.ts): no hace falta matemática nueva, solo conectarla.

import { lnBeta, regularizedIncompleteBeta, bisectCdf } from "./special";

/** Función de densidad de la F: f(x; d1, d2), definida para x > 0.
 *  Se calcula en logaritmos porque las potencias desbordan con gl grandes. */
export function pdfF(x: number, d1: number, d2: number): number {
  if (!(d1 > 0) || !(d2 > 0) || !(x > 0) || !Number.isFinite(x)) return 0;
  const logNum =
    (d1 / 2) * Math.log(d1) +
    (d2 / 2) * Math.log(d2) +
    (d1 / 2 - 1) * Math.log(x) -
    ((d1 + d2) / 2) * Math.log(d2 + d1 * x);
  return Math.exp(logNum - lnBeta(d1 / 2, d2 / 2));
}

/** Acumulada de la F: P(X ≤ x) = I_{d1·x/(d1·x + d2)}(d1/2, d2/2) */
export function cdfF(x: number, d1: number, d2: number): number {
  if (!(d1 > 0) || !(d2 > 0)) return NaN;
  if (x <= 0) return 0;
  if (x === Infinity) return 1;
  if (!Number.isFinite(x)) return NaN;
  return regularizedIncompleteBeta(d1 / 2, d2 / 2, (d1 * x) / (d1 * x + d2));
}

/** Probabilidad de la cola derecha: P(X > x). Es el valor p del ANOVA. */
export function sfF(x: number, d1: number, d2: number): number {
  const p = cdfF(x, d1, d2);
  return Number.isFinite(p) ? 1 - p : NaN;
}

/** Inversa de la acumulada: devuelve el x tal que P(X ≤ x) = p.
 *  Con p = 1 − α da el valor crítico F_α que aparece en las tablas. */
export function invF(p: number, d1: number, d2: number): number {
  if (!(d1 > 0) || !(d2 > 0)) return NaN;
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;
  // La F no tiene cota superior fija: se amplía el techo hasta encerrar el valor.
  let hi = 2;
  while (cdfF(hi, d1, d2) < p && hi < 1e12) hi *= 4;
  return bisectCdf(x => cdfF(x, d1, d2), p, 0, hi);
}

/** Valor crítico de la cola derecha, que es como vienen las tablas F:
 *  F_{α}(d1, d2) deja un área α a su derecha. */
export function criticalF(alpha: number, d1: number, d2: number): number {
  return invF(1 - alpha, d1, d2);
}
