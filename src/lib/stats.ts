// Funciones estadísticas puras, sin dependencias externas.

export function mean(data: number[]): number {
  if (data.length === 0) return NaN;
  return data.reduce((a, b) => a + b, 0) / data.length;
}

export function sum(data: number[]): number {
  return data.reduce((a, b) => a + b, 0);
}

/** Varianza poblacional: divide entre N */
export function variancePop(data: number[]): number {
  const n = data.length;
  if (n === 0) return NaN;
  const m = mean(data);
  return data.reduce((acc, x) => acc + (x - m) ** 2, 0) / n;
}

/** Varianza muestral: divide entre N - 1 */
export function varianceSample(data: number[]): number {
  const n = data.length;
  if (n < 2) return NaN;
  const m = mean(data);
  return data.reduce((acc, x) => acc + (x - m) ** 2, 0) / (n - 1);
}

export function stdPop(data: number[]): number {
  return Math.sqrt(variancePop(data));
}
export function stdSample(data: number[]): number {
  return Math.sqrt(varianceSample(data));
}

export function minMax(data: number[]): [number, number] {
  return [Math.min(...data), Math.max(...data)];
}

/** Valor esperado: Σ x·P(x) */
export function expectedValue(xs: number[], ps: number[]): number {
  return xs.reduce((acc, x, i) => acc + x * ps[i], 0);
}

/** Varianza de una variable aleatoria: Σ (x - E)² P(x) */
export function varianceRV(xs: number[], ps: number[]): number {
  const mu = expectedValue(xs, ps);
  return xs.reduce((acc, x, i) => acc + (x - mu) ** 2 * ps[i], 0);
}
