// Prueba LSD de Fisher (diferencia mínima significativa).
//
// El ANOVA responde "¿hay alguna diferencia?", pero no dice CUÁL par de
// tratamientos difiere. El LSD contesta eso: compara las medias de dos en dos
// y declara distinto a todo par cuya diferencia supere un umbral.
//
//   LSD = t_{α/2, N−k} · √( CME · (1/n_i + 1/n_j) )
//
// Cuando todos los grupos tienen el mismo tamaño n, el paréntesis vale 2/n y
// queda la forma que suele escribirse en clase:
//
//   LSD = t_{α/2, N−k} · √( 2·CME / n )
//
// Dos detalles que valen la pena entender:
//  · Se usa el CME del ANOVA, no la varianza de cada par. Esa es la ventaja:
//    aprovecha TODAS las observaciones para estimar el error, así que tiene
//    más grados de libertad (N−k) que una t aplicada a dos grupos sueltos.
//  · El LSD solo se aplica si el ANOVA rechazó H₀. Si no, comparar todos los
//    pares infla la probabilidad de encontrar diferencias por puro azar.

import { invT, cdfT } from "./tstudent";
import type { ResultadoAnova } from "./anova";

export interface ComparacionLSD {
  /** Índices de los dos tratamientos comparados */
  i: number;
  j: number;
  nombreI: string;
  nombreJ: string;
  mediaI: number;
  mediaJ: number;
  /** ȳ_i − ȳ_j, con signo */
  diferencia: number;
  /** |ȳ_i − ȳ_j|, que es lo que se compara contra el LSD */
  absDiferencia: number;
  /** El umbral para este par. Es el mismo para todos si el diseño es balanceado. */
  lsd: number;
  /** True si |ȳ_i − ȳ_j| ≥ LSD: las medias se declaran distintas.
   *  Se usa ≥ (y no >) porque así se enuncia la regla de decisión en clase. */
  significativa: boolean;
  /** Estadístico t del par y su valor p (prueba de dos colas) */
  t: number;
  valorP: number;
}

export interface ResultadoLSD {
  ok: boolean;
  error?: string;
  /** Valor crítico t_{α/2, N−k} */
  tCritico: number;
  /** Umbral común, solo cuando todos los grupos tienen el mismo tamaño */
  lsdComun?: number;
  /** True si todos los tratamientos tienen el mismo n */
  balanceado: boolean;
  comparaciones: ComparacionLSD[];
  /** Cuántos pares resultaron significativos */
  totalSignificativas: number;
}

/** Calcula todas las comparaciones por pares a partir del resultado del ANOVA. */
export function calcularLSD(r: ResultadoAnova, alpha: number): ResultadoLSD {
  const vacio: ResultadoLSD = {
    ok: false, tCritico: NaN, balanceado: false,
    comparaciones: [], totalSignificativas: 0,
  };

  if (!r.ok) return { ...vacio, error: "Primero hace falta un ANOVA válido." };
  if (!(alpha > 0 && alpha < 1)) {
    return { ...vacio, error: "El nivel de significancia debe estar entre 0 y 1." };
  }
  if (!(r.CME > 0)) {
    return {
      ...vacio,
      error: "Con CME = 0 no hay variación dentro de los tratamientos, así que no hay error con el cual comparar las medias.",
    };
  }

  const tCritico = invT(1 - alpha / 2, r.glError);

  const comparaciones: ComparacionLSD[] = [];
  for (let i = 0; i < r.grupos.length; i++) {
    for (let j = i + 1; j < r.grupos.length; j++) {
      const a = r.grupos[i], b = r.grupos[j];
      const errorEstandar = Math.sqrt(r.CME * (1 / a.n + 1 / b.n));
      const lsd = tCritico * errorEstandar;
      const diferencia = a.media - b.media;
      const absDiferencia = Math.abs(diferencia);
      const t = diferencia / errorEstandar;
      // Valor p de dos colas: la diferencia puede caer hacia cualquier lado.
      const valorP = 2 * (1 - cdfT(Math.abs(t), r.glError));

      comparaciones.push({
        i, j,
        nombreI: a.nombre, nombreJ: b.nombre,
        mediaI: a.media, mediaJ: b.media,
        diferencia, absDiferencia,
        lsd,
        significativa: absDiferencia >= lsd,
        t, valorP,
      });
    }
  }

  const tamanos = r.grupos.map(g => g.n);
  const balanceado = tamanos.every(n => n === tamanos[0]);

  return {
    ok: true,
    tCritico,
    lsdComun: balanceado ? comparaciones[0]?.lsd : undefined,
    balanceado,
    comparaciones,
    totalSignificativas: comparaciones.filter(c => c.significativa).length,
  };
}
