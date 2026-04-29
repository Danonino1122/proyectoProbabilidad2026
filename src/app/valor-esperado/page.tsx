"use client";

import { useMemo, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Stat } from "@/components/ui/Stat";
import PlotClient, { darkLayout } from "@/components/PlotClient";
import { expectedValue, varianceRV } from "@/lib/stats";
import { fmt, parseNumberList } from "@/lib/utils";
import { Plus, Trash2, Sparkles, Check, AlertTriangle, FunctionSquare, Table, BarChart3 } from "lucide-react";

interface Row { x: string; p: string; }
interface FreqRow { x: string; f: string; }
type InputMode = "function" | "table" | "frequency";

const EXAMPLE_TABLE: Row[] = [
  { x: "0", p: "0.1" },
  { x: "1", p: "0.2" },
  { x: "2", p: "0.3" },
  { x: "3", p: "0.25" },
  { x: "4", p: "0.15" },
];

const EXAMPLE_FREQ: FreqRow[] = [
  { x: "0", f: "4" },
  { x: "1", f: "7" },
  { x: "2", f: "5" },
];

interface FormulaResult {
  rows: Row[];
  error: string | null;
}

function evalFormulaOverRange(formula: string, rangeRaw: string): FormulaResult {
  const xs = parseNumberList(rangeRaw);
  if (formula.trim() === "") return { rows: [], error: "Ingresa una fórmula." };
  if (xs.length === 0) return { rows: [], error: "Ingresa al menos un valor de x." };
  const cleaned = formula.replace(/\^/g, "**");
  let fn: (x: number) => number;
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const built = new Function("x", `
      "use strict";
      const { PI, E, sqrt, abs, exp, log, log2, log10, sin, cos, tan, pow, max, min, floor, ceil, round } = Math;
      return (${cleaned});
    `);
    fn = built as (x: number) => number;
  } catch {
    return { rows: [], error: "Fórmula inválida (sintaxis)." };
  }

  const rows: Row[] = [];
  for (const x of xs) {
    let p: number;
    try { p = Number(fn(x)); } catch { return { rows: [], error: `Error evaluando en x = ${x}.` }; }
    if (!Number.isFinite(p)) return { rows: [], error: `f(${x}) no es un número finito.` };
    rows.push({ x: String(x), p: String(p) });
  }
  return { rows, error: null };
}

export default function ValorEsperadoPage() {
  const [inputMode, setInputMode] = useState<InputMode>("function");

  // Table mode
  const [tableRows, setTableRows] = useState<Row[]>(EXAMPLE_TABLE);

  // Function mode
  const [formula, setFormula] = useState("x/3");
  const [rangeRaw, setRangeRaw] = useState("0, 1, 2");

  // Frequency mode
  const [freqRows, setFreqRows] = useState<FreqRow[]>(EXAMPLE_FREQ);

  // ── Derived: function evaluation ────────────────────
  const fnResult = useMemo(
    () => evalFormulaOverRange(formula, rangeRaw),
    [formula, rangeRaw]
  );

  // ── Derived: total N for frequency mode ─────────────
  const totalN = useMemo(() => freqRows.reduce((sum, r) => {
    const f = Number(r.f);
    return sum + (Number.isFinite(f) && f >= 0 ? f : 0);
  }, 0), [freqRows]);

  const freqError = useMemo<string | null>(() => {
    if (inputMode !== "frequency") return null;
    if (freqRows.length === 0) return "Agrega al menos una fila.";
    if (freqRows.some(r => r.f !== "" && Number(r.f) < 0)) return "Las frecuencias no pueden ser negativas.";
    if (totalN === 0) return "El total N debe ser mayor a 0.";
    return null;
  }, [inputMode, freqRows, totalN]);

  // ── Derived: rows used by all calculations ──────────
  const effectiveRows: Row[] = useMemo(() => {
    if (inputMode === "function") return fnResult.rows;
    if (inputMode === "frequency") {
      if (totalN === 0) return [];
      return freqRows
        .filter(r => r.x !== "" && r.f !== "" && Number.isFinite(Number(r.f)))
        .map(r => ({ x: r.x, p: String(Number(r.f) / totalN) }));
    }
    return tableRows;
  }, [inputMode, fnResult.rows, tableRows, freqRows, totalN]);

  const formulaError = inputMode === "function" ? fnResult.error : null;

  const parsed = useMemo(() => {
    const xs: number[] = []; const ps: number[] = [];
    for (const r of effectiveRows) {
      const x = Number(r.x); const p = Number(r.p);
      if (Number.isFinite(x) && Number.isFinite(p)) { xs.push(x); ps.push(p); }
    }
    return { xs, ps };
  }, [effectiveRows]);

  const { xs, ps } = parsed;
  const sumP = ps.reduce((a, b) => a + b, 0);
  const sumValid = xs.length > 0 && Math.abs(sumP - 1) < 1e-6 && ps.every(p => p >= 0);
  const isValid = sumValid && !formulaError && !freqError;

  const ex = useMemo(() => (isValid ? expectedValue(xs, ps) : NaN), [xs, ps, isValid]);
  const varx = useMemo(() => (isValid ? varianceRV(xs, ps) : NaN), [xs, ps, isValid]);
  const stdx = Math.sqrt(varx);

  // ── Setters ───────────────────────────────────────────
  const setRow = (i: number, key: "x" | "p", value: string) => {
    setTableRows(rs => rs.map((r, j) => j === i ? { ...r, [key]: value } : r));
  };
  const addRow = () => setTableRows(rs => [...rs, { x: "", p: "" }]);
  const removeRow = (i: number) => setTableRows(rs => rs.filter((_, j) => j !== i));

  const setFreq = (i: number, key: "x" | "f", value: string) => {
    setFreqRows(rs => rs.map((r, j) => j === i ? { ...r, [key]: value } : r));
  };
  const addFreq = () => setFreqRows(rs => [...rs, { x: "", f: "" }]);
  const removeFreq = (i: number) => setFreqRows(rs => rs.filter((_, j) => j !== i));

  // For step-by-step preview
  const sumXF = useMemo(() => freqRows.reduce((s, r) => {
    const x = Number(r.x), f = Number(r.f);
    return s + (Number.isFinite(x) && Number.isFinite(f) ? x * f : 0);
  }, 0), [freqRows]);

  const errorMsg = formulaError ?? freqError;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-3 max-w-2xl">
        <span className="eyebrow eyebrow--accent">02 · Variables aleatorias</span>
        <h1 className="h-page">Valor esperado de una variable aleatoria</h1>
        <p className="text-[14.5px] text-[var(--muted)] leading-relaxed">
          Define la distribución de probabilidad de una variable aleatoria discreta X
          (función, tabla o frecuencias observadas). La aplicación calcula{" "}
          <InlineMath math="E(X)" />, <InlineMath math="Var(X)" /> y{" "}
          <InlineMath math="\sigma_X" /> en tiempo real.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <Card className="lg:col-span-2" pad="md">
          <CardHeader>
            <CardTitle>Distribución de probabilidad</CardTitle>
            <CardDescription>Elige cómo definir P(X): a partir de una función, una tabla, o frecuencias observadas.</CardDescription>
          </CardHeader>

          {/* Mode toggle */}
          <div className="grid grid-cols-3 gap-1 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-1 mb-5">
            {([
              { k: "function", label: "Función", icon: FunctionSquare },
              { k: "table", label: "Tabla", icon: Table },
              { k: "frequency", label: "Frecuencias", icon: BarChart3 },
            ] as const).map(o => {
              const Icon = o.icon;
              const active = inputMode === o.k;
              return (
                <button
                  key={o.k}
                  onClick={() => setInputMode(o.k)}
                  className={
                    "flex items-center justify-center gap-1.5 px-2 py-2 text-[12.5px] rounded-[6px] transition-colors " +
                    (active
                      ? "bg-[var(--surface-3)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      : "text-[var(--muted)] hover:text-white")
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {o.label}
                </button>
              );
            })}
          </div>

          {/* === FUNCTION MODE === */}
          {inputMode === "function" && (
            <div className="space-y-3">
              <div>
                <label className="label mb-1.5 block">f(x) = </label>
                <Input
                  value={formula}
                  onChange={e => setFormula(e.target.value)}
                  placeholder="x/3"
                  className="font-mono"
                />
                <p className="mt-1.5 text-[11.5px] text-[var(--muted-2)] leading-relaxed">
                  Operadores: <span className="kbd">+</span> <span className="kbd">−</span>{" "}
                  <span className="kbd">*</span> <span className="kbd">/</span>{" "}
                  <span className="kbd">^</span> (potencia) ·{" "}
                  Funciones: sqrt, exp, log, abs…
                </p>
              </div>

              <div>
                <label className="label mb-1.5 block">Rango de x <span className="text-[var(--muted-2)]">(separado por comas)</span></label>
                <Input
                  value={rangeRaw}
                  onChange={e => setRangeRaw(e.target.value)}
                  placeholder="0, 1, 2"
                  className="font-mono"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="secondary" size="sm" onClick={() => { setFormula("x/3"); setRangeRaw("0, 1, 2"); }}>
                  <Sparkles className="h-3.5 w-3.5" /> Ejemplo: x/3
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setFormula("(x+1)/10"); setRangeRaw("0, 1, 2, 3"); }}>
                  Ejemplo: (x+1)/10
                </Button>
              </div>

              {fnResult.rows.length > 0 && (
                <div className="mt-4">
                  <div className="label mb-2">Tabla evaluada</div>
                  <div className="rounded-[var(--r-sm)] border border-[var(--border)] overflow-hidden">
                    <table className="num-table w-full text-[12.5px]">
                      <thead className="bg-[var(--surface-2)] text-[var(--muted)]">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">x</th>
                          <th className="px-3 py-2 font-medium">f(x) = P(X=x)</th>
                        </tr>
                      </thead>
                      <tbody className="num">
                        {fnResult.rows.map((r, i) => (
                          <tr key={i} className="border-t border-[var(--border)] odd:bg-white/[.012]">
                            <td className="text-left px-3 py-1.5">{r.x}</td>
                            <td className="px-3 py-1.5">{fmt(Number(r.p), 4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === TABLE MODE === */}
          {inputMode === "table" && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1 label">
                <div>X</div><div>P(X)</div><div className="w-9" />
              </div>
              {tableRows.map((r, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <Input value={r.x} onChange={e => setRow(i, "x", e.target.value)} placeholder="x" />
                  <Input value={r.p} onChange={e => setRow(i, "p", e.target.value)} placeholder="0.0" />
                  <Button variant="ghost" size="sm" onClick={() => removeRow(i)} aria-label="Eliminar fila" className="w-9 px-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button variant="secondary" size="sm" onClick={addRow}>
                  <Plus className="h-3.5 w-3.5" /> Agregar fila
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setTableRows(EXAMPLE_TABLE)}>
                  <Sparkles className="h-3.5 w-3.5" /> Ejemplo
                </Button>
              </div>
            </div>
          )}

          {/* === FREQUENCY MODE === */}
          {inputMode === "frequency" && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1 label">
                <div>X</div><div>f <span className="text-[var(--muted-2)] normal-case tracking-normal">(frecuencia)</span></div><div className="w-9" />
              </div>
              {freqRows.map((r, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <Input value={r.x} onChange={e => setFreq(i, "x", e.target.value)} placeholder="x" />
                  <Input value={r.f} onChange={e => setFreq(i, "f", e.target.value)} placeholder="0" />
                  <Button variant="ghost" size="sm" onClick={() => removeFreq(i)} aria-label="Eliminar fila" className="w-9 px-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button variant="secondary" size="sm" onClick={addFreq}>
                  <Plus className="h-3.5 w-3.5" /> Agregar fila
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setFreqRows(EXAMPLE_FREQ)}>
                  <Sparkles className="h-3.5 w-3.5" /> Ejemplo: 2 monedas, 16 lanzamientos
                </Button>
              </div>

              {/* Preview: f → P */}
              {totalN > 0 && (
                <div className="mt-4">
                  <div className="label mb-2">Probabilidades calculadas <span className="text-[var(--muted-2)] normal-case tracking-normal">P(X) = f / N</span></div>
                  <div className="rounded-[var(--r-sm)] border border-[var(--border)] overflow-hidden">
                    <table className="num-table w-full text-[12.5px]">
                      <thead className="bg-[var(--surface-2)] text-[var(--muted)]">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">x</th>
                          <th className="px-3 py-2 font-medium">f</th>
                          <th className="px-3 py-2 font-medium">P(X)</th>
                        </tr>
                      </thead>
                      <tbody className="num">
                        {freqRows.filter(r => r.x !== "" && r.f !== "" && Number.isFinite(Number(r.f))).map((r, i) => (
                          <tr key={i} className="border-t border-[var(--border)] odd:bg-white/[.012]">
                            <td className="text-left px-3 py-1.5">{r.x}</td>
                            <td className="px-3 py-1.5 text-[var(--muted)]">{r.f}</td>
                            <td className="px-3 py-1.5">{fmt(Number(r.f) / totalN, 4)}</td>
                          </tr>
                        ))}
                        <tr className="border-t border-[var(--border-strong)] bg-[var(--surface-2)]/70 font-semibold">
                          <td className="text-left px-3 py-2">Σ</td>
                          <td className="px-3 py-2 text-[var(--accent-2)]">{totalN}</td>
                          <td className="px-3 py-2 text-[var(--accent-2)]">1.0000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation strip */}
          <div className={
            "mt-5 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[var(--r-sm)] border text-[13px] " +
            (errorMsg
              ? "border-[var(--danger)]/35 bg-[var(--danger)]/8 text-white"
              : sumValid
                ? "border-[var(--success)]/30 bg-[var(--success)]/8 text-white"
                : "border-[var(--danger)]/35 bg-[var(--danger)]/8 text-white")
          }>
            <span className="flex items-center gap-2 min-w-0">
              {errorMsg
                ? <><AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[var(--danger)]" /> <span className="truncate">{errorMsg}</span></>
                : sumValid
                  ? <><Check className="h-3.5 w-3.5 shrink-0 text-[var(--success)]" /> Distribución válida</>
                  : <><AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[var(--danger)]" /> Σ debe sumar 1</>}
            </span>
            {!errorMsg && (
              inputMode === "frequency"
                ? <span className="num text-[var(--muted)] shrink-0">N = <span className="text-white">{totalN}</span></span>
                : <span className="num text-[var(--muted)] shrink-0">Σ = <span className="text-white">{fmt(sumP)}</span></span>
            )}
          </div>
        </Card>

        <div className="lg:col-span-3 space-y-5">
          <Card tone="elevated" pad="md" className="flex flex-col md:flex-row md:items-stretch gap-5">
            <div className="flex-1">
              <div className="label">E(X) · Valor esperado</div>
              <div className="num font-semibold text-white text-[44px] leading-none mt-2">
                {isValid ? fmt(ex) : "—"}
              </div>
              <div className="text-[12.5px] text-[var(--muted)] mt-2">
                Promedio teórico de la variable aleatoria
              </div>
            </div>
            <div className="hidden md:block w-px bg-[var(--border)]" />
            <div className="grid grid-cols-2 gap-3 md:flex-1 min-w-0">
              <Stat size="sm" label="Var(X)" value={isValid ? fmt(varx, 3) : "—"} />
              <Stat size="sm" label="σ(X)" value={isValid ? fmt(stdx, 3) : "—"} />
            </div>
          </Card>

          <Card pad="md">
            <CardHeader>
              <CardTitle>Distribución de probabilidad</CardTitle>
              <CardDescription>Barras: P(X = x) · línea cian: valor esperado E(X)</CardDescription>
            </CardHeader>
            {isValid && (
              <PlotClient
                data={[{
                  x: xs, y: ps, type: "bar",
                  marker: { color: "#7c5cff", line: { color: "#22d3ee", width: 1 } },
                  name: "P(X)",
                }]}
                layout={{
                  ...darkLayout,
                  height: 300,
                  xaxis: { ...darkLayout.xaxis, title: { text: "X" }, dtick: 1 },
                  yaxis: { ...darkLayout.yaxis, title: { text: "P(X)" } },
                  shapes: [{
                    type: "line", x0: ex, x1: ex, y0: 0, y1: 1, yref: "paper",
                    line: { color: "#22d3ee", dash: "dash", width: 2 },
                  }],
                  annotations: [{
                    x: ex, y: 1, yref: "paper", showarrow: false,
                    text: `E(X) = ${fmt(ex)}`, font: { color: "#22d3ee" }, yshift: 10,
                  }],
                }}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: "100%" }}
              />
            )}
          </Card>
        </div>
      </div>

      {isValid && (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="eyebrow">Desarrollo</span>
              <h2 className="h-section mt-1.5">Cómo se llega al resultado</h2>
            </div>
            <p className="hidden md:block max-w-sm text-[13px] text-[var(--muted)] text-right leading-relaxed">
              Cálculo de E(X), Var(X) y σ(X) a partir de la tabla de probabilidad.
            </p>
          </div>

          <Card pad="lg">
            <ol className="space-y-7">
              {inputMode === "function" && (
                <li className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-[13.5px] text-white">
                    <span className="step-num">0</span>
                    Evaluamos la función para construir la tabla
                  </div>
                  <BlockMath math={`f(x) = ${formula.replace(/\*\*/g, "^").replace(/\*/g, " \\cdot ")}, \\quad x \\in \\{${rangeRaw}\\}`} />
                </li>
              )}

              {inputMode === "frequency" && (
                <li className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-[13.5px] text-white">
                    <span className="step-num">0</span>
                    Convertimos frecuencias a probabilidades
                  </div>
                  <BlockMath math={`P(x_i) = \\frac{f_i}{N}, \\quad N = \\sum_i f_i = ${totalN}`} />
                  <p className="text-[12.5px] text-[var(--muted)] leading-relaxed">
                    Equivalentemente, podemos calcular directamente{" "}
                    <InlineMath math={`E(X) = \\frac{1}{N}\\sum x_i \\cdot f_i = \\frac{${fmt(sumXF)}}{${totalN}} = ${fmt(ex)}`} />.
                  </p>
                </li>
              )}

              <li className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-[13.5px] text-white">
                  <span className="step-num">1</span>
                  Fórmula del valor esperado
                </div>
                <BlockMath math={`E(X) = \\sum_{i} x_i \\cdot P(x_i)`} />
              </li>

              <li className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-[13.5px] text-white">
                  <span className="step-num">2</span>
                  Tabla de cálculo
                </div>
                <div className="overflow-x-auto rounded-[var(--r-md)] border border-[var(--border)]">
                  <table className="num-table w-full text-[13px]">
                    <thead className="bg-[var(--surface-2)] text-[var(--muted)]">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium">xᵢ</th>
                        <th className="px-4 py-2.5 font-medium">P(xᵢ)</th>
                        <th className="px-4 py-2.5 font-medium">xᵢ · P(xᵢ)</th>
                        <th className="px-4 py-2.5 font-medium">(xᵢ − μ)² · P(xᵢ)</th>
                      </tr>
                    </thead>
                    <tbody className="num">
                      {xs.map((x, i) => (
                        <tr key={i} className="border-t border-[var(--border)] odd:bg-white/[.012]">
                          <td className="text-left px-4 py-2">{fmt(x)}</td>
                          <td className="px-4 py-2 text-[var(--muted)]">{fmt(ps[i])}</td>
                          <td className="px-4 py-2">{fmt(x * ps[i])}</td>
                          <td className="px-4 py-2">{fmt((x - ex) ** 2 * ps[i])}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-[var(--border-strong)] bg-[var(--surface-2)]/70 font-semibold">
                        <td className="text-left px-4 py-2.5" colSpan={2}>Σ</td>
                        <td className="px-4 py-2.5 text-[var(--accent-2)]">{fmt(ex)}</td>
                        <td className="px-4 py-2.5 text-[var(--accent-2)]">{fmt(varx)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </li>

              <li className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-[13.5px] text-white">
                  <span className="step-num">3</span>
                  Resultados
                </div>
                <div className="space-y-3">
                  <BlockMath math={`E(X) = ${fmt(ex)}`} />
                  <BlockMath math={`Var(X) = \\sum (x_i - \\mu)^2 \\, P(x_i) = ${fmt(varx)}`} />
                  <BlockMath math={`\\sigma(X) = \\sqrt{Var(X)} = ${fmt(stdx)}`} />
                </div>
              </li>
            </ol>

            <div className="mt-7 pt-5 border-t border-[var(--border)] flex items-start gap-3">
              <span className="step-num bg-[var(--accent-2)]/15 text-[var(--accent-2)]">i</span>
              <p className="text-[13.5px] text-[var(--muted)] leading-relaxed">
                <span className="text-white font-medium">Interpretación.</span>{" "}
                Si el experimento se repitiera muchas veces, el valor promedio de X tendería a{" "}
                <InlineMath math={`E(X) = ${fmt(ex)}`} />, con una variabilidad típica de{" "}
                <InlineMath math={`\\sigma = ${fmt(stdx)}`} />.
              </p>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
