"use client";

import { useMemo, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Stat } from "@/components/ui/Stat";
import PlotClient, { darkLayout } from "@/components/PlotClient";
import { expectedValue, varianceRV } from "@/lib/stats";
import { fmt } from "@/lib/utils";
import { Plus, Trash2, Sparkles } from "lucide-react";

interface Row { x: string; p: string; }

const EXAMPLE: Row[] = [
  { x: "0", p: "0.1" },
  { x: "1", p: "0.2" },
  { x: "2", p: "0.3" },
  { x: "3", p: "0.25" },
  { x: "4", p: "0.15" },
];

export default function ValorEsperadoPage() {
  const [rows, setRows] = useState<Row[]>(EXAMPLE);

  const parsed = useMemo(() => {
    const xs: number[] = []; const ps: number[] = [];
    for (const r of rows) {
      const x = Number(r.x); const p = Number(r.p);
      if (Number.isFinite(x) && Number.isFinite(p)) { xs.push(x); ps.push(p); }
    }
    return { xs, ps };
  }, [rows]);

  const { xs, ps } = parsed;
  const sumP = ps.reduce((a, b) => a + b, 0);
  const isValid = xs.length > 0 && Math.abs(sumP - 1) < 1e-6 && ps.every(p => p >= 0);

  const ex = useMemo(() => (isValid ? expectedValue(xs, ps) : NaN), [xs, ps, isValid]);
  const varx = useMemo(() => (isValid ? varianceRV(xs, ps) : NaN), [xs, ps, isValid]);
  const stdx = Math.sqrt(varx);

  const setRow = (i: number, key: "x" | "p", value: string) => {
    setRows(rs => rs.map((r, j) => j === i ? { ...r, [key]: value } : r));
  };
  const addRow = () => setRows(rs => [...rs, { x: "", p: "" }]);
  const removeRow = (i: number) => setRows(rs => rs.filter((_, j) => j !== i));

  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs uppercase tracking-wider text-[var(--accent)] mb-2">Módulo 2</div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Valor esperado de una variable aleatoria</h1>
        <p className="text-[var(--muted)] mt-2 max-w-2xl">
          Define la distribución de probabilidad de una variable aleatoria discreta X.
          La aplicación calcula <InlineMath math="E(X)" />, <InlineMath math="Var(X)" /> y{" "}
          <InlineMath math="\sigma_X" /> dinámicamente.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribución de probabilidad</CardTitle>
            <CardDescription>
              La suma de las probabilidades debe ser igual a 1.
            </CardDescription>
          </CardHeader>

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs uppercase tracking-wider text-[var(--muted)] px-1">
              <div>X</div><div>P(X)</div><div></div>
            </div>
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input value={r.x} onChange={e => setRow(i, "x", e.target.value)} placeholder="x" />
                <Input value={r.p} onChange={e => setRow(i, "p", e.target.value)} placeholder="0.0" />
                <Button variant="ghost" onClick={() => removeRow(i)} aria-label="Eliminar fila">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="secondary" onClick={addRow}>
              <Plus className="h-4 w-4" /> Agregar fila
            </Button>
            <Button variant="secondary" onClick={() => setRows(EXAMPLE)}>
              <Sparkles className="h-4 w-4" /> Ejemplo
            </Button>
          </div>

          <div className={
            "mt-4 p-3 rounded-lg border text-sm " +
            (Math.abs(sumP - 1) < 1e-6
              ? "border-[var(--accent)]/30 bg-[var(--accent)]/10"
              : "border-red-500/40 bg-red-500/10")
          }>
            Σ P(X) = <span className="font-mono">{fmt(sumP)}</span>{" "}
            {Math.abs(sumP - 1) < 1e-6 ? "✓ válido" : "⚠ debe sumar 1"}
          </div>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="E(X)" value={isValid ? fmt(ex) : "—"} accent />
            <Stat label="Var(X)" value={isValid ? fmt(varx) : "—"} />
            <Stat label="σ(X)" value={isValid ? fmt(stdx) : "—"} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribución de probabilidad</CardTitle>
              <CardDescription>Barras: P(X = x). Línea: valor esperado E(X).</CardDescription>
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
        <Card>
          <CardHeader>
            <CardTitle>Desarrollo paso a paso</CardTitle>
            <CardDescription>Cálculo de E(X), Var(X) y σ(X).</CardDescription>
          </CardHeader>

          <ol className="space-y-6">
            <li>
              <div className="text-sm text-[var(--muted)] mb-2">1. Fórmula del valor esperado</div>
              <BlockMath math={`E(X) = \\sum_{i} x_i \\cdot P(x_i)`} />
            </li>
            <li>
              <div className="text-sm text-[var(--muted)] mb-2">2. Tabla de cálculo</div>
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--surface-2)] text-[var(--muted)]">
                    <tr>
                      <th className="text-left px-3 py-2">xᵢ</th>
                      <th className="text-left px-3 py-2">P(xᵢ)</th>
                      <th className="text-left px-3 py-2">xᵢ · P(xᵢ)</th>
                      <th className="text-left px-3 py-2">(xᵢ − μ)² · P(xᵢ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {xs.map((x, i) => (
                      <tr key={i} className="border-t border-[var(--border)] font-mono">
                        <td className="px-3 py-1.5">{fmt(x)}</td>
                        <td className="px-3 py-1.5">{fmt(ps[i])}</td>
                        <td className="px-3 py-1.5">{fmt(x * ps[i])}</td>
                        <td className="px-3 py-1.5">{fmt((x - ex) ** 2 * ps[i])}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-[var(--border)] bg-[var(--surface-2)]/60 font-mono font-semibold">
                      <td className="px-3 py-2" colSpan={2}>Σ</td>
                      <td className="px-3 py-2 text-[var(--accent-2)]">{fmt(ex)}</td>
                      <td className="px-3 py-2 text-[var(--accent-2)]">{fmt(varx)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </li>
            <li>
              <div className="text-sm text-[var(--muted)] mb-2">3. Resultados</div>
              <BlockMath math={`E(X) = ${fmt(ex)}`} />
              <BlockMath math={`Var(X) = \\sum (x_i - \\mu)^2 \\, P(x_i) = ${fmt(varx)}`} />
              <BlockMath math={`\\sigma(X) = \\sqrt{Var(X)} = ${fmt(stdx)}`} />
            </li>
          </ol>

          <div className="mt-6 p-4 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-sm text-[var(--muted)]">
            <strong className="text-white">Interpretación:</strong>{" "}
            Si el experimento se repitiera muchas veces, el valor promedio de X tendería a{" "}
            <InlineMath math={`E(X) = ${fmt(ex)}`} />, con una variabilidad típica de{" "}
            <InlineMath math={`\\sigma = ${fmt(stdx)}`} />.
          </div>
        </Card>
      )}
    </div>
  );
}
