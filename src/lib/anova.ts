// ANOVA de un factor (análisis de varianza de una vía).
//
// Notación tal como se vio en clase:
//   STC = ΣΣ(y_ij − ȳ..)²   suma total de cuadrados
//   SCT = Σ n_i(ȳ_i. − ȳ..)² suma de cuadrados del tratamiento
//   SCE = ΣΣ(y_ij − ȳ_i.)²   suma de cuadrados del error
//
// La identidad fundamental es STC = SCT + SCE: la variación total se parte en
// la que explican los tratamientos y la que queda sin explicar (el error).
//
// En clase la fórmula del tratamiento aparece como n·Σ(ȳ_i. − ȳ..)², con la n
// fuera de la suma porque todos los grupos tienen el mismo tamaño. Aquí se usa
// Σ n_i(...)², que es idéntica cuando el diseño es balanceado y además sigue
// siendo correcta cuando los grupos tienen tamaños distintos.

import { sfF } from "./fisher";

export interface GrupoEntrada {
  nombre: string;
  datos: number[];
}

export interface GrupoResumen {
  nombre: string;
  datos: number[];
  /** n_i — cuántas observaciones tiene el grupo */
  n: number;
  /** T_i — suma de las observaciones del grupo */
  suma: number;
  /** ȳ_i. — media del grupo */
  media: number;
  /** Σ y_ij² dentro del grupo */
  sumaCuadrados: number;
  /** ΣΣ(y_ij − ȳ_i.)² — lo que este grupo aporta al SCE */
  aporteSCE: number;
  /** (ȳ_i. − ȳ..) — qué tan lejos está del promedio general */
  desviacion: number;
  /** n_i(ȳ_i. − ȳ..)² — lo que este grupo aporta al SCT */
  aporteSCT: number;
  /** Varianza muestral del grupo, con n_i − 1 */
  varianza: number;
}

export interface ResultadoAnova {
  ok: boolean;
  /** Mensaje para la interfaz cuando los datos todavía no permiten calcular */
  error?: string;

  grupos: GrupoResumen[];
  /** k — número de tratamientos */
  k: number;
  /** N — total de observaciones */
  N: number;
  /** True si todos los grupos tienen el mismo tamaño */
  balanceado: boolean;
  /** n común, solo cuando el diseño es balanceado */
  nComun?: number;

  /** T = ΣΣ y_ij */
  total: number;
  /** ΣΣ y_ij² */
  sumaCuadradosTotal: number;
  /** C = T²/N — el término de corrección de la vía abreviada */
  correccion: number;
  /** ȳ.. — media global */
  mediaGlobal: number;

  STC: number;
  SCT: number;
  SCE: number;

  /** k − 1 */
  glTratamiento: number;
  /** N − k */
  glError: number;
  /** N − 1 */
  glTotal: number;

  /** CMT = SCT/(k−1) */
  CMT: number;
  /** CME = SCE/(N−k) */
  CME: number;

  /** F = CMT/CME */
  F: number;
  /** P(F > F_calculada) — la probabilidad de ver esta diferencia por puro azar */
  valorP: number;
}

const suma = (xs: number[]) => xs.reduce((acc, x) => acc + x, 0);

/** Calcula la tabla ANOVA completa a partir de los grupos capturados. */
export function calcularAnova(entrada: GrupoEntrada[]): ResultadoAnova {
  const grupos = entrada.filter(g => g.datos.length > 0);
  const k = grupos.length;
  const N = suma(grupos.map(g => g.datos.length));

  const vacio: ResultadoAnova = {
    ok: false, grupos: [], k, N, balanceado: false,
    total: NaN, sumaCuadradosTotal: NaN, correccion: NaN, mediaGlobal: NaN,
    STC: NaN, SCT: NaN, SCE: NaN,
    glTratamiento: k - 1, glError: N - k, glTotal: N - 1,
    CMT: NaN, CME: NaN, F: NaN, valorP: NaN,
  };

  if (k < 2) {
    return { ...vacio, error: "Se necesitan al menos 2 tratamientos para comparar." };
  }
  if (N - k < 1) {
    return {
      ...vacio,
      error: "Faltan datos: con una sola observación por tratamiento no quedan grados de libertad para el error.",
    };
  }

  const total = suma(grupos.map(g => suma(g.datos)));
  const mediaGlobal = total / N;
  const sumaCuadradosTotal = suma(grupos.map(g => suma(g.datos.map(y => y * y))));
  const correccion = (total * total) / N;

  const resumen: GrupoResumen[] = grupos.map(g => {
    const n = g.datos.length;
    const s = suma(g.datos);
    const media = s / n;
    const aporteSCE = suma(g.datos.map(y => (y - media) ** 2));
    const desviacion = media - mediaGlobal;
    return {
      nombre: g.nombre,
      datos: g.datos,
      n,
      suma: s,
      media,
      sumaCuadrados: suma(g.datos.map(y => y * y)),
      aporteSCE,
      desviacion,
      aporteSCT: n * desviacion * desviacion,
      varianza: n > 1 ? aporteSCE / (n - 1) : NaN,
    };
  });

  // Se calcula con desviaciones y no con T²/n: da el mismo resultado y es
  // numéricamente más estable (la vía abreviada resta números grandes entre sí).
  const SCT = suma(resumen.map(g => g.aporteSCT));
  const SCE = suma(resumen.map(g => g.aporteSCE));
  const STC = SCT + SCE;

  const glTratamiento = k - 1;
  const glError = N - k;
  const CMT = SCT / glTratamiento;
  const CME = SCE / glError;

  // Si no hay variación dentro de los grupos, F se dispara a infinito: es un
  // resultado legítimo (datos idénticos dentro de cada tratamiento), no un error.
  const F = CME > 0 ? CMT / CME : (SCT > 0 ? Infinity : NaN);
  const valorP = CME > 0 ? sfF(F, glTratamiento, glError) : (SCT > 0 ? 0 : NaN);

  const tamanos = resumen.map(g => g.n);
  const balanceado = tamanos.every(n => n === tamanos[0]);

  return {
    ok: true,
    grupos: resumen,
    k, N, balanceado,
    nComun: balanceado ? tamanos[0] : undefined,
    total, sumaCuadradosTotal, correccion, mediaGlobal,
    STC, SCT, SCE,
    glTratamiento, glError, glTotal: N - 1,
    CMT, CME, F, valorP,
  };
}
