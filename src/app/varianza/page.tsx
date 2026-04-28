"use client";

import { useMemo, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Stat } from "@/components/ui/Stat";
import PlotClient, { darkLayout } from "@/components/PlotClient";
import { mean, variancePop, varianceSample, stdPop, stdSample, sum, minMax } from "@/lib/stats";
import { fmt, parseNumberList } from "@/lib/utils";
import { Sparkles, Shuffle } from "lucide-react";

const EXAMPLE = "12, 15, 14, 10, 18, 20, 16, 13, 17, 19";

export default function VarianzaPage() {
  const [raw, setRaw] = useState(EXAMPLE);
  const [type, setType] = useState<"sample" | "pop">("sample");

  const data = useMemo(() => parseNumberList(raw), [raw]);
  const n = data.length;
  const m = useMemo(() => mean(data), [data]);
  const varP = useMemo(() => variancePop(data), [data]);
  const varS = useMemo(() => varianceSample(data), [data]);
  const sP = useMemo(() => stdPop(data), [data]);
  const sS = useMemo(() => stdSample(data), [data]);
  const sumX = useMemo(() => sum(data), [data]);
  const sumSq = useMemo(() => data.reduce((a, x) => a + (x - m) ** 2, 0), [data, m]);

  const currentVar = type === "sample" ? varS : varP;
  const currentStd = type === "sample" ? sS : sP;
  const divisor = type === "sample" ? Math.max(n - 1, 1) : n;

  const randomize = () => {
    const k = 8 + Math.floor(Math.random() * 8);
    const arr = Array.from({ length: k }, () => Math.round((Math.random() * 30 + 5) * 10) / 10);
    setRaw(arr.join(", "));
  };

  // Datos para el histograma
  const histo = useMemo(() => {
    if (n === 0) return null;
    return {
      x: data,
      type: "histogram" as const,
      marker: { color: "#7c5cff", line: { color: "#22d3ee", width: 1 } },
      opacity: 0.85,
      nbinsx: Math.min(Math.max(5, Math.ceil(Math.sqrt(n))), 20),
    };
  }, [data, n]);

  const [mn, mx] = n > 0 ? minMax(data) : [0, 0];

  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs uppercase tracking-wider text-[var(--accent)] mb-2">Módulo 1</div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Varianza de un conjunto de datos</h1>
        <p className="text-[var(--muted)] mt-2 max-w-2xl">
          Ingresa una lista de valores separados por coma, espacio o saltos de línea.
          La aplicación calcula la media, varianza y desviación estándar con el desarrollo paso a paso.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Entrada */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Datos de entrada</CardTitle>
            <CardDescription>Separa los valores con coma, espacio o nueva línea.</CardDescription>
          </CardHeader>

          <Textarea
            rows={8}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Ej: 12, 15, 14, 10, 18, 20"
          />

          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="secondary" onClick={() => setRaw(EXAMPLE)}>
              <Sparkles className="h-4 w-4" /> Ejemplo
            </Button>
            <Button variant="secondary" onClick={randomize}>
              <Shuffle className="h-4 w-4" /> Aleatorio
            </Button>
            <Button variant="ghost" onClick={() => setRaw("")}>Limpiar</Button>
          </div>

          <div className="mt-6">
            <div className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">Tipo de varianza</div>
            <div className="inline-flex rounded-lg border border-[var(--border)] p-1 bg-[var(--surface-2)]">
              {([
                { k: "sample", label: "Muestral (n−1)" },
                { k: "pop", label: "Poblacional (n)" },
              ] as const).map(o => (
                <button
                  key={o.k}
                  onClick={() => setType(o.k)}
                  className={
                    "px-3 py-1.5 text-sm rounded-md transition " +
                    (type === o.k ? "bg-[var(--accent)]/20 text-white" : "text-[var(--muted)] hover:text-white")
                  }
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Resultados */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="n" value={n} />
            <Stat label="Media x̄" value={n ? fmt(m) : "—"} />
            <Stat label={type === "sample" ? "Varianza s²" : "Varianza σ²"} value={n ? fmt(currentVar) : "—"} accent />
            <Stat label={type === "sample" ? "Desv. s" : "Desv. σ"} value={n ? fmt(currentStd) : "—"} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribución de los datos</CardTitle>
              <CardDescription>
                {n > 0 ? <>Rango: [{fmt(mn)}, {fmt(mx)}] · Σx = {fmt(sumX)}</> : "Ingresa datos para ver la gráfica"}
              </CardDescription>
            </CardHeader>
            {n > 0 && histo && (
              <PlotClient
                data={[histo]}
                layout={{
                  ...darkLayout,
                  height: 280,
                  bargap: 0.05,
                  xaxis: { ...darkLayout.xaxis, title: { text: "Valor" } },
                  yaxis: { ...darkLayout.yaxis, title: { text: "Frecuencia" } },
                  shapes: [{
                    type: "line",
                    x0: m, x1: m, y0: 0, y1: 1, yref: "paper",
                    line: { color: "#22d3ee", dash: "dash", width: 2 },
                  }],
                  annotations: [{
                    x: m, y: 1, yref: "paper", showarrow: false,
                    text: `x̄ = ${fmt(m)}`,
                    font: { color: "#22d3ee" },
                    yshift: 10,
                  }],
                }}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: "100%" }}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Paso a paso */}
      {n > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Desarrollo paso a paso</CardTitle>
            <CardDescription>
              {type === "sample"
                ? "Varianza muestral — dividimos entre n − 1 (corrección de Bessel)."
                : "Varianza poblacional — dividimos entre n."}
            </CardDescription>
          </CardHeader>

          <ol className="space-y-6">
            <li>
              <div className="text-sm text-[var(--muted)] mb-2">1. Calculamos la media</div>
              <BlockMath math={`\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i = \\frac{${fmt(sumX)}}{${n}} = ${fmt(m)}`} />
            </li>
            <li>
              <div className="text-sm text-[var(--muted)] mb-2">2. Calculamos las desviaciones al cuadrado y las sumamos</div>
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--surface-2)] text-[var(--muted)]">
                    <tr>
                      <th className="text-left px-3 py-2">i</th>
                      <th className="text-left px-3 py-2">xᵢ</th>
                      <th className="text-left px-3 py-2">xᵢ − x̄</th>
                      <th className="text-left px-3 py-2">(xᵢ − x̄)²</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((x, i) => (
                      <tr key={i} className="border-t border-[var(--border)] font-mono">
                        <td className="px-3 py-1.5 text-[var(--muted)]">{i + 1}</td>
                        <td className="px-3 py-1.5">{fmt(x)}</td>
                        <td className="px-3 py-1.5">{fmt(x - m)}</td>
                        <td className="px-3 py-1.5">{fmt((x - m) ** 2)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-[var(--border)] bg-[var(--surface-2)]/60 font-mono font-semibold">
                      <td className="px-3 py-2" colSpan={3}>Σ</td>
                      <td className="px-3 py-2 text-[var(--accent-2)]">{fmt(sumSq)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </li>
            <li>
              <div className="text-sm text-[var(--muted)] mb-2">3. Aplicamos la fórmula de la varianza</div>
              {type === "sample" ? (
                <BlockMath math={`s^2 = \\frac{1}{n-1}\\sum (x_i - \\bar{x})^2 = \\frac{${fmt(sumSq)}}{${divisor}} = ${fmt(currentVar)}`} />
              ) : (
                <BlockMath math={`\\sigma^2 = \\frac{1}{n}\\sum (x_i - \\bar{x})^2 = \\frac{${fmt(sumSq)}}{${divisor}} = ${fmt(currentVar)}`} />
              )}
            </li>
            <li>
              <div className="text-sm text-[var(--muted)] mb-2">4. Desviación estándar (raíz cuadrada de la varianza)</div>
              {type === "sample" ? (
                <BlockMath math={`s = \\sqrt{s^2} = \\sqrt{${fmt(currentVar)}} = ${fmt(currentStd)}`} />
              ) : (
                <BlockMath math={`\\sigma = \\sqrt{\\sigma^2} = \\sqrt{${fmt(currentVar)}} = ${fmt(currentStd)}`} />
              )}
            </li>
          </ol>

          <div className="mt-6 p-4 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-sm">
            <strong className="text-white">Interpretación:</strong>{" "}
            <span className="text-[var(--muted)]">
              En promedio, los valores se alejan de la media{" "}
              <InlineMath math={`\\bar{x} = ${fmt(m)}`} /> en{" "}
              <InlineMath math={`${fmt(currentStd)}`} /> unidades.
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
