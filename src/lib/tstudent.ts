// Utilidades para la distribución t de Student con ν grados de libertad.
//
// A diferencia de la normal estándar, la t no tiene una fórmula cerrada simple
// para su acumulada: se apoya en la función beta incompleta regularizada I_x(a,b).
// Aquí se implementa igual que en normal.ts, sin librerías externas.

/** Logaritmo de la función gamma: ln Γ(x). Aproximación de Lanczos (g=7, n=9). */
function lnGamma(x: number): number {
  const g = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    // Fórmula de reflexión: Γ(x)Γ(1−x) = π / sin(πx)
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  }
  x -= 1;
  let a = g[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += g[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Fracción continua para la beta incompleta (método modificado de Lentz). */
function betaContinuedFraction(a: number, b: number, x: number): number {
  const FPMIN = 1e-300;
  const EPS = 3e-12;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    // Paso par
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    // Paso impar
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Beta incompleta regularizada I_x(a,b). Devuelve un valor en [0,1]. */
function regularizedIncompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(
    lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );
  // La fracción continua converge rápido solo en una mitad del dominio;
  // en la otra se usa la simetría I_x(a,b) = 1 − I_{1−x}(b,a).
  return x < (a + 1) / (a + b + 2)
    ? (front * betaContinuedFraction(a, b, x)) / a
    : 1 - (front * betaContinuedFraction(b, a, 1 - x)) / b;
}

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

  let lo = -1e3, hi = 1e3;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    if (cdfT(mid, v) < p) lo = mid; else hi = mid;
    if (hi - lo < 1e-12) break;
  }
  return (lo + hi) / 2;
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
