// Funciones especiales compartidas por las distribuciones del proyecto.
//
// Tanto la t de Student como la F de Fisher necesitan la misma herramienta:
// la función beta incompleta regularizada I_x(a,b). Por eso vive aquí y no
// dentro de un módulo concreto — la t la usa para su acumulada y la F
// (la del ANOVA) la usa exactamente igual.

/** Logaritmo de la función gamma: ln Γ(x). Aproximación de Lanczos (g=7, n=9).
 *  Se trabaja con el logaritmo porque Γ crece tan rápido que desborda enseguida. */
export function lnGamma(x: number): number {
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

/** Logaritmo de la función beta: ln B(a,b) = ln Γ(a) + ln Γ(b) − ln Γ(a+b). */
export function lnBeta(a: number, b: number): number {
  return lnGamma(a) + lnGamma(b) - lnGamma(a + b);
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
export function regularizedIncompleteBeta(a: number, b: number, x: number): number {
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

/** Invierte una acumulada creciente por bisección: devuelve el x tal que cdf(x) = p.
 *  Se usa para los valores críticos de la t y de la F. Es lento en teoría e
 *  instantáneo en la práctica, y sobre todo es fácil de explicar y de verificar. */
export function bisectCdf(
  cdf: (x: number) => number,
  p: number,
  lo: number,
  hi: number,
  iterations = 300,
): number {
  let a = lo, b = hi;
  for (let i = 0; i < iterations; i++) {
    const mid = (a + b) / 2;
    if (cdf(mid) < p) a = mid; else b = mid;
    if (b - a < 1e-12) break;
  }
  return (a + b) / 2;
}
