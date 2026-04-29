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
    <div className="space-y-10">
      {/* Page header */}
      <header className="flex flex-col gap-3 max-w-2xl">
        <span className="eyebrow eyebrow--accent">01 · Dispersión</span>
        <h1 className="h-page">Varianza de un conjunto de datos</h1>
        <p className="text-[14.5px] text-[var(--muted)] leading-relaxed">
          Ingresa una lista de valores. La aplicación calcula media, varianza y desviación estándar
          con el desarrollo paso a paso.
        </p>
      </header>

      {/* Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Input panel */}
        <Card className="lg:col-span-2" pad="md">
          <CardHeader>
            <CardTitle>Datos de entrada</CardTitle>
            <CardDescription>Separa los valores con coma, espacio o nueva línea.</CardDescription>
          </CardHeader>

          <Textarea
            rows={7}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="12, 15, 14, 10, 18, 20"
          />

          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="secondary" size="sm" onClick={() => setRaw(EXAMPLE)}>
              <Sparkles className="h-3.5 w-3.5" /> Ejemplo
            </Button>
            <Button variant="secondary" size="sm" onClick={randomize}>
              <Shuffle className="h-3.5 w-3.5" /> Aleatorio
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRaw("")}>Limpiar</Button>
          </div>

          <div className="mt-6">
            <div className="label mb-2">Tipo de varianza</div>
            <div className="grid grid-cols-2 gap-1 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-1">
              {([
                { k: "sample", label: "Muestral", hint: "÷ (n−1)" },
                { k: "pop", label: "Poblacional", hint: "÷ n" },
              ] as const).map(o => (
                <button
                  key={o.k}
                  onClick={() => setType(o.k)}
                  className={
                    "flex items-baseline justify-center gap-1.5 px-3 py-2 text-sm rounded-[6px] transition-colors " +
                    (type === o.k
                      ? "bg-[var(--surface-3)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      : "text-[var(--muted)] hover:text-white")
                  }
                >
                  {o.label}
                  <span className="num text-[11px] text-[var(--muted-2)]">{o.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Output panel */}
        <div className="lg:col-span-3 space-y-5">
          {/* Hero stat — the answer they came for */}
          <Card tone="elevated" pad="md" className="flex flex-col md:flex-row md:items-stretch gap-5">
            <div className="flex-1">
              <div className="label">{type === "sample" ? "Varianza muestral · s²" : "Varianza poblacional · σ²"}</div>
              <div className="num font-semibold text-white text-[44px] leading-none mt-2">
                {n ? fmt(currentVar) : "—"}
              </div>
              <div className="text-[12.5px] text-[var(--muted)] mt-2">
                Desv. estándar <span className="num text-white">{n ? fmt(currentStd) : "—"}</span>
              </div>
            </div>
            <div className="hidden md:block w-px bg-[var(--border)]" />
            <div className="grid grid-cols-3 gap-3 md:gap-4 md:flex-1 min-w-0">
              <Stat size="sm" label="n" value={n || "—"} />
              <Stat size="sm" label="Media x̄" value={n ? fmt(m, 2) : "—"} />
              <Stat size="sm" label="Σx" value={n ? fmt(sumX, 2) : "—"} />
            </div>
          </Card>

          <Card pad="md">
            <CardHeader>
              <CardTitle>Distribución de los datos</CardTitle>
              <CardDescription>
                {n > 0
                  ? <>Rango <span className="num text-white">[{fmt(mn)}, {fmt(mx)}]</span> · línea cian = media</>
                  : "Ingresa datos para ver la gráfica"}
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

      {/* Step by step */}
      {n > 0 && (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="eyebrow">Desarrollo</span>
              <h2 className="h-section mt-1.5">Cómo se llega al resultado</h2>
            </div>
            <p className="hidden md:block max-w-sm text-[13px] text-[var(--muted)] text-right leading-relaxed">
              {type === "sample"
                ? "Varianza muestral — dividimos entre n − 1 (corrección de Bessel)."
                : "Varianza poblacional — dividimos entre n cuando los datos representan toda la población."}
            </p>
          </div>

          <Card pad="lg">
            <ol className="space-y-7">
              <li className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-[13.5px] text-white">
                  <span className="step-num">1</span>
                  Calculamos la media
                </div>
                <BlockMath math={`\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i = \\frac{${fmt(sumX)}}{${n}} = ${fmt(m)}`} />
              </li>

              <li className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-[13.5px] text-white">
                  <span className="step-num">2</span>
                  Calculamos las desviaciones al cuadrado
                </div>
                <div className="overflow-x-auto rounded-[var(--r-md)] border border-[var(--border)]">
                  <table className="num-table w-full text-[13px]">
                    <thead className="bg-[var(--surface-2)] text-[var(--muted)]">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium">i</th>
                        <th className="px-4 py-2.5 font-medium">xᵢ</th>
                        <th className="px-4 py-2.5 font-medium">xᵢ − x̄</th>
                        <th className="px-4 py-2.5 font-medium">(xᵢ − x̄)²</th>
                      </tr>
                    </thead>
                    <tbody className="num">
                      {data.map((x, i) => (
                        <tr key={i} className="border-t border-[var(--border)] odd:bg-white/[.012]">
                          <td className="text-left px-4 py-2 text-[var(--muted-2)]">{i + 1}</td>
                          <td className="px-4 py-2">{fmt(x)}</td>
                          <td className="px-4 py-2 text-[var(--muted)]">{fmt(x - m)}</td>
                          <td className="px-4 py-2">{fmt((x - m) ** 2)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-[var(--border-strong)] bg-[var(--surface-2)]/70 font-semibold">
                        <td className="text-left px-4 py-2.5" colSpan={3}>Σ</td>
                        <td className="px-4 py-2.5 text-[var(--accent-2)]">{fmt(sumSq)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </li>

              <li className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-[13.5px] text-white">
                  <span className="step-num">3</span>
                  Aplicamos la fórmula de la varianza
                </div>
                {type === "sample" ? (
                  <BlockMath math={`s^2 = \\frac{1}{n-1}\\sum (x_i - \\bar{x})^2 = \\frac{${fmt(sumSq)}}{${divisor}} = ${fmt(currentVar)}`} />
                ) : (
                  <BlockMath math={`\\sigma^2 = \\frac{1}{n}\\sum (x_i - \\bar{x})^2 = \\frac{${fmt(sumSq)}}{${divisor}} = ${fmt(currentVar)}`} />
                )}
              </li>

              <li className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-[13.5px] text-white">
                  <span className="step-num">4</span>
                  Desviación estándar
                </div>
                {type === "sample" ? (
                  <BlockMath math={`s = \\sqrt{s^2} = \\sqrt{${fmt(currentVar)}} = ${fmt(currentStd)}`} />
                ) : (
                  <BlockMath math={`\\sigma = \\sqrt{\\sigma^2} = \\sqrt{${fmt(currentVar)}} = ${fmt(currentStd)}`} />
                )}
              </li>
            </ol>

            <div className="mt-7 pt-5 border-t border-[var(--border)] flex items-start gap-3">
              <span className="step-num bg-[var(--accent-2)]/15 text-[var(--accent-2)]">i</span>
              <p className="text-[13.5px] text-[var(--muted)] leading-relaxed">
                <span className="text-white font-medium">Interpretación.</span>{" "}
                En promedio, los valores se alejan de la media{" "}
                <InlineMath math={`\\bar{x} = ${fmt(m)}`} /> en{" "}
                <InlineMath math={`${fmt(currentStd)}`} /> unidades.
              </p>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
