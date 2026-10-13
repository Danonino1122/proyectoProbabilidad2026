"use client";

import { useMemo, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Stat } from "@/components/ui/Stat";
import PlotClient, { darkLayout } from "@/components/PlotClient";
import { calcularAnova } from "@/lib/anova";
import { pdfF, criticalF } from "@/lib/fisher";
import { fmt, parseNumberList } from "@/lib/utils";

interface GrupoCampo {
  id: number;
  nombre: string;
  raw: string;
}

/** Ejemplo visto en clase: rendimiento en millas por galón de tres automóviles. */
const EJEMPLO_CLASE: GrupoCampo[] = [
  { id: 1, nombre: "Malibu", raw: "19, 21, 20, 19, 21" },
  { id: 2, nombre: "Altima", raw: "19, 20, 22, 21, 23" },
  { id: 3, nombre: "Passat", raw: "24, 26, 23, 25, 27" },
];

const COLORES = ["#22d3ee", "#7c5cff", "#f59e0b", "#34d399", "#f472b6", "#60a5fa"];

const NIVELES = [0.1, 0.05, 0.01];

/** F puede valer infinito cuando no hay variación dentro de los grupos (CME = 0).
 *  Es un resultado legítimo, así que se muestra como ∞ y no como dato faltante. */
const fmtF = (x: number, d = 4) => (x === Infinity ? "∞" : fmt(x, d));
const fmtFTex = (x: number, d = 4) => (x === Infinity ? "\\infty" : fmt(x, d));

export default function AnovaPage() {
  const [campos, setCampos] = useState<GrupoCampo[]>(EJEMPLO_CLASE);
  const [alpha, setAlpha] = useState(0.05);

  const siguienteId = useMemo(
    () => Math.max(0, ...campos.map(c => c.id)) + 1,
    [campos],
  );

  const agregar = () =>
    setCampos(cs => [...cs, { id: siguienteId, nombre: `Tratamiento ${cs.length + 1}`, raw: "" }]);

  const quitar = (id: number) => setCampos(cs => cs.filter(c => c.id !== id));

  const actualizar = (id: number, cambios: Partial<GrupoCampo>) =>
    setCampos(cs => cs.map(c => (c.id === id ? { ...c, ...cambios } : c)));

  const restaurar = () => setCampos(EJEMPLO_CLASE);

  // ── Cálculo ─────────────────────────────────────────
  const r = useMemo(
    () => calcularAnova(campos.map(c => ({ nombre: c.nombre.trim() || "Sin nombre", datos: parseNumberList(c.raw) }))),
    [campos],
  );

  const fCritico = useMemo(
    () => (r.ok ? criticalF(alpha, r.glTratamiento, r.glError) : NaN),
    [r, alpha],
  );

  // F infinita (CME = 0) también cae en la región de rechazo: la comparación
  // tiene que admitirla, no descartarla por no ser un número finito.
  const seRechaza = r.ok && (r.F === Infinity || (Number.isFinite(r.F) && r.F > fCritico));

  // ── Gráfica de la curva F ───────────────────────────
  const curvaF = useMemo(() => {
    if (!r.ok) return { xs: [], ys: [], limite: 5 };
    const limite = Math.min(60, Math.max(5, (Number.isFinite(r.F) ? r.F : 0) * 1.3, fCritico * 2));
    const xs: number[] = [], ys: number[] = [];
    for (let x = 0.001; x <= limite; x += limite / 420) {
      xs.push(x); ys.push(pdfF(x, r.glTratamiento, r.glError));
    }
    return { xs, ys, limite };
  }, [r, fCritico]);

  const regionRechazo = useMemo(() => {
    if (!r.ok || !Number.isFinite(fCritico)) return { xs: [], ys: [] };
    const xs: number[] = [], ys: number[] = [];
    for (let x = fCritico; x <= curvaF.limite; x += curvaF.limite / 420) {
      xs.push(x); ys.push(pdfF(x, r.glTratamiento, r.glError));
    }
    return { xs, ys };
  }, [r, fCritico, curvaF.limite]);

  // ── Gráfica de los grupos ───────────────────────────
  const trazasGrupos = useMemo(() => {
    if (!r.ok) return [];
    const puntos = r.grupos.map((g, i) => ({
      x: g.datos.map(() => g.nombre),
      y: g.datos,
      type: "scatter" as const,
      mode: "markers" as const,
      name: g.nombre,
      marker: { color: COLORES[i % COLORES.length], size: 8, opacity: 0.75 },
      showlegend: false,
    }));
    const medias = {
      x: r.grupos.map(g => g.nombre),
      y: r.grupos.map(g => g.media),
      type: "scatter" as const,
      mode: "markers" as const,
      name: "Media del grupo",
      marker: { color: "#ffffff", size: 13, symbol: "diamond" as const,
        line: { color: "#0a0a0f", width: 1.5 } },
    };
    return [...puntos, medias];
  }, [r]);

  const alphaPct = fmt(alpha * 100, 0);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-3 max-w-2xl">
        <span className="eyebrow eyebrow--accent">05 · Análisis de varianza</span>
        <h1 className="h-page">ANOVA de un factor</h1>
        <p className="text-[14.5px] text-[var(--muted)] leading-relaxed">
          Compara las medias de <span className="text-white">varios tratamientos a la vez</span>.
          La idea es partir la variación total de los datos en dos pedazos: la que se explica por
          el tratamiento y la que queda como error. Si la primera es suficientemente grande frente
          a la segunda, se concluye que al menos una media es distinta.
        </p>
      </header>

      {/* ── Captura de datos ───────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <span className="eyebrow">Datos</span>
            <h2 className="h-section mt-1.5">Tratamientos</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={restaurar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)]/50 text-[12.5px] text-[var(--muted)] hover:text-white hover:border-[var(--border-strong)] transition-colors"
            >
              <RotateCcw className="h-[13px] w-[13px]" />
              Ejemplo de clase
            </button>
            <button
              onClick={agregar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-sm)] border border-[var(--accent)]/45 bg-[var(--accent)]/12 text-[12.5px] text-white hover:bg-[var(--accent)]/20 transition-colors"
            >
              <Plus className="h-[13px] w-[13px]" />
              Agregar tratamiento
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {campos.map((c, i) => {
            const datos = parseNumberList(c.raw);
            const color = COLORES[i % COLORES.length];
            return (
              <Card key={c.id} pad="sm" className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <Input
                    value={c.nombre}
                    onChange={e => actualizar(c.id, { nombre: e.target.value })}
                    placeholder="Nombre del tratamiento"
                    className="h-8 text-[13px]"
                  />
                  <button
                    onClick={() => quitar(c.id)}
                    disabled={campos.length <= 2}
                    title={campos.length <= 2 ? "Se necesitan al menos 2 tratamientos" : "Quitar tratamiento"}
                    className="shrink-0 h-8 w-8 grid place-items-center rounded-[var(--r-sm)] text-[var(--muted-2)] hover:text-[#ef4444] hover:bg-white/[.04] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-[var(--muted-2)] disabled:hover:bg-transparent"
                  >
                    <Trash2 className="h-[14px] w-[14px]" />
                  </button>
                </div>
                <Textarea
                  rows={3}
                  value={c.raw}
                  onChange={e => actualizar(c.id, { raw: e.target.value })}
                  placeholder="19, 21, 20, 19, 21"
                  className="text-[13px]"
                />
                <div className="flex items-center justify-between text-[11.5px] text-[var(--muted-2)]">
                  <span className="num">n = {datos.length}</span>
                  {datos.length > 0 && (
                    <span className="num">
                      T<sub>i</sub> = {fmt(datos.reduce((s, x) => s + x, 0))} · ȳ
                      <sub>i.</sub> = {fmt(datos.reduce((s, x) => s + x, 0) / datos.length)}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <p className="text-[12.5px] text-[var(--muted-2)]">
          Separa los valores con comas, espacios o saltos de línea. Los tratamientos pueden tener
          distinto número de observaciones.
        </p>
      </section>

      {!r.ok && (
        <Card pad="lg" tone="quiet">
          <p className="text-[13.5px] text-[var(--muted)]">{r.error}</p>
        </Card>
      )}

      {r.ok && (
        <>
          {/* ── Resultado ──────────────────────────────── */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <Card tone="elevated" pad="md" className="lg:col-span-2">
              <div className="label">Estadístico de prueba</div>
              <div className="num font-semibold text-white text-[44px] leading-none mt-2">
                F = {fmtF(r.F, 3)}
              </div>
              <div className="text-[12.5px] text-[var(--muted)] mt-2">
                Contra el valor crítico{" "}
                <span className="num text-white">F<sub>{fmt(alpha, 2)}</sub>({r.glTratamiento}, {r.glError}) = {fmt(fCritico, 3)}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <div className="label mb-2">Nivel de significancia α</div>
                <div className="flex gap-1.5">
                  {NIVELES.map(a => (
                    <button
                      key={a}
                      onClick={() => setAlpha(a)}
                      className={
                        "num flex-1 px-2.5 py-1.5 rounded-[var(--r-sm)] border text-[12.5px] transition-colors " +
                        (alpha === a
                          ? "bg-[var(--accent)]/12 border-[var(--accent)]/45 text-white"
                          : "bg-[var(--surface-2)]/50 border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-[var(--border-strong)]")
                      }
                    >
                      {fmt(a, 2)}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={
                  "mt-4 rounded-[var(--r-md)] border px-4 py-3.5 " +
                  (seRechaza
                    ? "border-[var(--accent-2)]/45 bg-[var(--accent-2)]/10"
                    : "border-[var(--border-strong)] bg-[var(--surface-2)]/55")
                }
              >
                <div className="label mb-1.5">Decisión</div>
                <p className="text-[13.5px] text-white leading-relaxed">
                  {seRechaza ? (
                    <>
                      Se <span className="font-semibold">rechaza</span> H₀: con α = {fmt(alpha, 2)} hay
                      evidencia de que al menos una media de tratamiento es distinta.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">No se rechaza</span> H₀: con α = {fmt(alpha, 2)} no
                      hay evidencia suficiente de que las medias difieran.
                    </>
                  )}
                </p>
                <p className="text-[12px] text-[var(--muted)] mt-2 num">
                  {(Number.isFinite(r.F) || r.F === Infinity) && Number.isFinite(fCritico)
                    ? `${fmtF(r.F, 3)} ${seRechaza ? ">" : "≤"} ${fmt(fCritico, 3)}`
                    : "—"}
                </p>
              </div>
            </Card>

            <div className="lg:col-span-3 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Stat
                  label="Valor p"
                  value={
                    !Number.isFinite(r.valorP) ? "—"
                      : r.valorP < 0.0001 ? "< 0.0001"
                      : fmt(r.valorP, 5)
                  }
                  hint={
                    Number.isFinite(r.valorP)
                      ? (r.valorP < alpha ? `Menor que α = ${fmt(alpha, 2)}` : `Mayor que α = ${fmt(alpha, 2)}`)
                      : "Probabilidad de ver esta F por azar"
                  }
                  size="sm"
                  accent={Number.isFinite(r.valorP) && r.valorP < alpha}
                />
                <Stat
                  label="Tratamientos (k)"
                  value={r.k}
                  hint={`N = ${r.N} observaciones${r.balanceado ? ` · n = ${r.nComun} c/u` : " · tamaños desiguales"}`}
                  size="sm"
                />
                <Stat
                  label="Media global ȳ.."
                  value={fmt(r.mediaGlobal)}
                  hint={`T = ${fmt(r.total)}`}
                  size="sm"
                />
              </div>

              <Card pad="md">
                <CardHeader>
                  <CardTitle>Observaciones por tratamiento</CardTitle>
                  <CardDescription>
                    Los rombos blancos son las medias de cada grupo y la línea punteada es la media
                    global. ANOVA pregunta si los rombos están más separados de lo que justifica la
                    dispersión interna de los puntos.
                  </CardDescription>
                </CardHeader>
                <PlotClient
                  data={trazasGrupos}
                  layout={{
                    ...darkLayout, height: 320, showlegend: false,
                    xaxis: { ...darkLayout.xaxis, title: { text: "Tratamiento" } },
                    yaxis: { ...darkLayout.yaxis, title: { text: "Observación" } },
                    shapes: [{
                      type: "line" as const, xref: "paper" as const,
                      x0: 0, x1: 1, y0: r.mediaGlobal, y1: r.mediaGlobal,
                      line: { color: "#ef4444", width: 1.5, dash: "dot" as const },
                    }],
                    annotations: [{
                      xref: "paper" as const, x: 1, y: r.mediaGlobal,
                      text: `ȳ.. = ${fmt(r.mediaGlobal)}`, showarrow: false,
                      font: { color: "#ef4444", size: 11 }, yshift: 11, xanchor: "right" as const,
                    }],
                  }}
                  config={{ displayModeBar: false, responsive: true }}
                  style={{ width: "100%" }}
                />
              </Card>
            </div>
          </section>

          {/* ── Tabla ANOVA ────────────────────────────── */}
          <section className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow">Resultado</span>
                <h2 className="h-section mt-1.5">Tabla ANOVA</h2>
              </div>
              <p className="hidden md:block max-w-sm text-[13px] text-[var(--muted)] text-right leading-relaxed">
                Es la tabla que se arma a mano, con la identidad STC = SCT + SCE como verificación.
              </p>
            </div>

            <Card pad="md">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] border-collapse">
                  <thead>
                    <tr className="text-left">
                      <th className="label font-medium pb-2.5 pr-4">Fuente de variación</th>
                      <th className="label font-medium pb-2.5 pr-4">Suma de cuadrados</th>
                      <th className="label font-medium pb-2.5 pr-4">gl</th>
                      <th className="label font-medium pb-2.5 pr-4">Cuadrado medio</th>
                      <th className="label font-medium pb-2.5">F</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    <tr className="border-t border-[var(--border)]">
                      <td className="py-3 pr-4">Tratamientos</td>
                      <td className="num py-3 pr-4 text-[var(--accent-2)]">SCT = {fmt(r.SCT, 4)}</td>
                      <td className="num py-3 pr-4">{r.glTratamiento}</td>
                      <td className="num py-3 pr-4">CMT = {fmt(r.CMT, 4)}</td>
                      <td className="num py-3 font-semibold">{fmtF(r.F, 4)}</td>
                    </tr>
                    <tr className="border-t border-[var(--border)]">
                      <td className="py-3 pr-4">Error</td>
                      <td className="num py-3 pr-4">SCE = {fmt(r.SCE, 4)}</td>
                      <td className="num py-3 pr-4">{r.glError}</td>
                      <td className="num py-3 pr-4">CME = {fmt(r.CME, 4)}</td>
                      <td className="py-3" />
                    </tr>
                    <tr className="border-t border-[var(--border-strong)]">
                      <td className="py-3 pr-4 font-medium">Total</td>
                      <td className="num py-3 pr-4 font-medium">STC = {fmt(r.STC, 4)}</td>
                      <td className="num py-3 pr-4 font-medium">{r.glTotal}</td>
                      <td className="py-3 pr-4" />
                      <td className="py-3" />
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 pt-3.5 border-t border-[var(--border)] text-[12.5px] text-[var(--muted)]">
                Verificación: SCT + SCE ={" "}
                <span className="num text-white">{fmt(r.SCT, 4)} + {fmt(r.SCE, 4)} = {fmt(r.SCT + r.SCE, 4)}</span>
                , que coincide con STC. Lo mismo con los grados de libertad:{" "}
                <span className="num text-white">{r.glTratamiento} + {r.glError} = {r.glTotal}</span>.
              </p>
            </Card>

            <Card pad="md">
              <CardHeader>
                <CardTitle>Distribución F con la región de rechazo</CardTitle>
                <CardDescription>
                  El área sombreada es el {alphaPct}% más extremo de la distribución{" "}
                  <InlineMath math={`F_{${r.glTratamiento},\\,${r.glError}}`} />. Si la F calculada cae
                  dentro, se rechaza H₀.
                </CardDescription>
              </CardHeader>
              <PlotClient
                data={[
                  {
                    x: curvaF.xs, y: curvaF.ys, type: "scatter", mode: "lines",
                    line: { color: "#22d3ee", width: 2.5 }, name: "f(x)",
                  },
                  {
                    x: regionRechazo.xs, y: regionRechazo.ys, type: "scatter", mode: "lines",
                    fill: "tozeroy", fillcolor: "rgba(124,92,255,0.32)",
                    line: { color: "#7c5cff", width: 2 }, name: "Región de rechazo",
                  },
                ]}
                layout={{
                  ...darkLayout, height: 330, showlegend: false,
                  xaxis: { ...darkLayout.xaxis, title: { text: "F" }, range: [0, curvaF.limite] },
                  yaxis: { ...darkLayout.yaxis, title: { text: "f(F)" } },
                  shapes: [
                    ...(Number.isFinite(fCritico) ? [{
                      type: "line" as const, x0: fCritico, x1: fCritico,
                      y0: 0, y1: pdfF(fCritico, r.glTratamiento, r.glError),
                      line: { color: "#a78bff", width: 1.5, dash: "dot" as const },
                    }] : []),
                    ...(Number.isFinite(r.F) && r.F <= curvaF.limite ? [{
                      type: "line" as const, x0: r.F, x1: r.F, y0: 0,
                      y1: Math.max(pdfF(r.F, r.glTratamiento, r.glError), curvaF.ys[0] ?? 0.1),
                      line: { color: "#ef4444", width: 2 },
                    }] : []),
                  ],
                  annotations: [
                    ...(Number.isFinite(fCritico) ? [{
                      x: fCritico, y: pdfF(fCritico, r.glTratamiento, r.glError),
                      text: `F crítico = ${fmt(fCritico, 3)}`, showarrow: false,
                      font: { color: "#a78bff", size: 11 }, yshift: 26, xshift: 4,
                      xanchor: "left" as const,
                    }] : []),
                    ...(Number.isFinite(r.F) && r.F <= curvaF.limite ? [{
                      x: r.F, y: 0, text: `F = ${fmt(r.F, 3)}`, showarrow: false,
                      font: { color: "#ef4444", size: 11 }, yshift: -16,
                    }] : []),
                  ],
                }}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: "100%" }}
              />
              {(r.F === Infinity || (Number.isFinite(r.F) && r.F > curvaF.limite)) && (
                <p className="mt-2 text-[12px] text-[var(--muted-2)]">
                  La F calculada ({fmtF(r.F, 3)}) queda fuera del rango graficado.
                </p>
              )}
            </Card>
          </section>

          {/* ── Desarrollo paso a paso ─────────────────── */}
          <section className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow">Desarrollo</span>
                <h2 className="h-section mt-1.5">Cómo se obtiene cada suma</h2>
              </div>
              <p className="hidden md:block max-w-sm text-[13px] text-[var(--muted)] text-right leading-relaxed">
                Mismo procedimiento que a mano, con tus datos ya sustituidos.
              </p>
            </div>

            <Card pad="lg">
              <div className="space-y-5 text-[13.5px]">
                <div>
                  <div className="label mb-2">Hipótesis</div>
                  <BlockMath math={`H_0: ${
                    // Con pocos tratamientos se listan todos; los puntos suspensivos
                    // solo tienen sentido cuando de verdad hay términos que omitir.
                    r.k <= 3
                      ? Array.from({ length: r.k }, (_, i) => `\\mu_${i + 1}`).join(" = ")
                      : `\\mu_1 = \\mu_2 = \\cdots = \\mu_{${r.k}}`
                  } \\qquad H_1: \\text{al menos una } \\mu_i \\text{ es distinta}`} />
                </div>

                <div className="pt-1">
                  <div className="label mb-2">Medias</div>
                  <p className="text-[var(--muted)] leading-relaxed mb-2">
                    Primero la media de cada tratamiento y la media global:
                  </p>
                  <div className="space-y-1.5">
                    {r.grupos.map((g, i) => (
                      <div key={i} className="num text-[13px] text-white">
                        ȳ<sub>{i + 1}.</sub> = {fmt(g.suma)} / {g.n} = {fmt(g.media)}
                        <span className="text-[var(--muted-2)]"> ({g.nombre})</span>
                      </div>
                    ))}
                    <div className="num text-[13px] text-white pt-1">
                      ȳ.. = {fmt(r.total)} / {r.N} = {fmt(r.mediaGlobal)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border)]">
                  <div className="label mb-2 mt-3">Suma total de cuadrados (STC)</div>
                  <BlockMath math={`STC = \\sum_{i=1}^{k}\\sum_{j=1}^{n}(y_{ij} - \\bar{y}_{..})^2 = ${fmt(r.STC, 4)}`} />
                  <p className="text-[var(--muted)] leading-relaxed">
                    Mide qué tanto se alejan <em>todas</em> las observaciones del promedio general,
                    sin importar a qué tratamiento pertenecen.
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border)]">
                  <div className="label mb-2 mt-3">Suma de cuadrados del tratamiento (SCT)</div>
                  <BlockMath math={
                    r.balanceado
                      ? `SCT = n\\sum_{i=1}^{k}(\\bar{y}_{i.} - \\bar{y}_{..})^2`
                      : `SCT = \\sum_{i=1}^{k} n_i(\\bar{y}_{i.} - \\bar{y}_{..})^2`
                  } />
                  <div className="num text-[13px] text-white leading-relaxed break-words">
                    {r.balanceado ? (
                      <>
                        SCT = {r.nComun}[{r.grupos.map(g => `(${fmt(g.media)} − ${fmt(r.mediaGlobal)})²`).join(" + ")}]
                        <br />
                        SCT = {r.nComun}[{r.grupos.map(g => fmt(g.desviacion ** 2, 4)).join(" + ")}] = {fmt(r.SCT, 4)}
                      </>
                    ) : (
                      <>
                        SCT = {r.grupos.map(g => `${g.n}(${fmt(g.media)} − ${fmt(r.mediaGlobal)})²`).join(" + ")} = {fmt(r.SCT, 4)}
                      </>
                    )}
                  </div>
                  <p className="text-[var(--muted)] leading-relaxed mt-2">
                    Mide qué tan separadas están las medias de los tratamientos entre sí. Es la
                    variación que <span className="text-white">sí</span> explica el factor.
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border)]">
                  <div className="label mb-2 mt-3">Suma de cuadrados del error (SCE)</div>
                  <BlockMath math={`SCE = \\sum_{i=1}^{k}\\sum_{j=1}^{n}(y_{ij} - \\bar{y}_{i.})^2`} />
                  <div className="num text-[13px] text-white leading-relaxed break-words">
                    SCE = {r.grupos.map(g => fmt(g.aporteSCE, 4)).join(" + ")} = {fmt(r.SCE, 4)}
                  </div>
                  <p className="text-[var(--muted)] leading-relaxed mt-2">
                    Mide la dispersión <em>dentro</em> de cada tratamiento: lo que varían las
                    observaciones aunque reciban el mismo trato. Es la variación que{" "}
                    <span className="text-white">no</span> se explica.
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border)]">
                  <div className="label mb-2 mt-3">Cuadrados medios y estadístico F</div>
                  <BlockMath math={`CMT = \\frac{SCT}{k-1} = \\frac{${fmt(r.SCT, 4)}}{${r.glTratamiento}} = ${fmt(r.CMT, 4)}`} />
                  <BlockMath math={`CME = \\frac{SCE}{N-k} = \\frac{${fmt(r.SCE, 4)}}{${r.glError}} = ${fmt(r.CME, 4)}`} />
                  <BlockMath math={`F = \\frac{CMT}{CME} = \\frac{${fmt(r.CMT, 4)}}{${fmt(r.CME, 4)}} = ${fmtFTex(r.F, 4)}`} />
                  <p className="text-[var(--muted)] leading-relaxed">
                    F compara las dos variaciones. Si el tratamiento no influyera, ambas estimarían
                    lo mismo y F rondaría 1. Mientras más grande sea F, más difícil es explicar las
                    diferencias por azar.
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border)]">
                  <div className="label mb-2 mt-3">Regla de decisión</div>
                  <BlockMath math={`F_{${fmt(alpha, 2)}}(${r.glTratamiento},\\, ${r.glError}) = ${fmt(fCritico, 4)}`} />
                  <p className="text-[13.5px] text-white leading-relaxed">
                    Como <span className="num">{fmtF(r.F, 4)} {seRechaza ? ">" : "≤"} {fmt(fCritico, 4)}</span>,{" "}
                    {seRechaza ? "se rechaza" : "no se rechaza"} H₀ con un nivel de significancia de{" "}
                    {alphaPct}%.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* ── Resumen por tratamiento ────────────────── */}
          <section className="space-y-5">
            <div>
              <span className="eyebrow">Detalle</span>
              <h2 className="h-section mt-1.5">Resumen por tratamiento</h2>
            </div>

            <Card pad="md">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] border-collapse">
                  <thead>
                    <tr className="text-left">
                      <th className="label font-medium pb-2.5 pr-4">Tratamiento</th>
                      <th className="label font-medium pb-2.5 pr-4">n</th>
                      <th className="label font-medium pb-2.5 pr-4">T<sub>i</sub></th>
                      <th className="label font-medium pb-2.5 pr-4">ȳ<sub>i.</sub></th>
                      <th className="label font-medium pb-2.5 pr-4">ȳ<sub>i.</sub> − ȳ..</th>
                      <th className="label font-medium pb-2.5 pr-4">Aporte a SCT</th>
                      <th className="label font-medium pb-2.5">Aporte a SCE</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    {r.grupos.map((g, i) => (
                      <tr key={i} className="border-t border-[var(--border)]">
                        <td className="py-2.5 pr-4">
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ background: COLORES[i % COLORES.length] }} />
                            {g.nombre}
                          </span>
                        </td>
                        <td className="num py-2.5 pr-4">{g.n}</td>
                        <td className="num py-2.5 pr-4">{fmt(g.suma)}</td>
                        <td className="num py-2.5 pr-4">{fmt(g.media)}</td>
                        <td className="num py-2.5 pr-4 text-[var(--muted)]">{fmt(g.desviacion)}</td>
                        <td className="num py-2.5 pr-4 text-[var(--accent-2)]">{fmt(g.aporteSCT, 4)}</td>
                        <td className="num py-2.5">{fmt(g.aporteSCE, 4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card pad="lg" tone="quiet">
              <div className="space-y-3 text-[13.5px]">
                <div className="label">Qué supone el ANOVA</div>
                <p className="text-[var(--muted)] leading-relaxed">
                  Para que la prueba sea válida se asume que las observaciones de cada tratamiento
                  provienen de poblaciones <span className="text-white">normales</span>, con{" "}
                  <span className="text-white">varianzas parecidas</span> entre grupos, y que las
                  observaciones son <span className="text-white">independientes</span>.
                </p>
                <p className="text-[var(--muted)] leading-relaxed">
                  Un detalle importante para la exposición: rechazar H₀ dice que{" "}
                  <span className="text-white">al menos una</span> media difiere, pero no cuál. Para
                  identificar qué pares son distintos se usan pruebas de comparación múltiple como
                  Tukey o LSD, que son el paso siguiente al ANOVA.
                </p>
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
