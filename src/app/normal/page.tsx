"use client";

import { useMemo, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Stat } from "@/components/ui/Stat";
import PlotClient, { darkLayout } from "@/components/PlotClient";
import { pdfNormal, cdfNormal } from "@/lib/normal";
import { fmt } from "@/lib/utils";

type Mode = "lt" | "gt" | "between" | "outside";

export default function NormalPage() {
  const [mode, setMode] = useState<Mode>("lt");
  const [a, setA] = useState("-1");
  const [b, setB] = useState("1");

  const va = Number(a);
  const vb = Number(b);

  // Generar curva
  const curve = useMemo(() => {
    const xs: number[] = []; const ys: number[] = [];
    for (let z = -4; z <= 4; z += 0.05) {
      xs.push(z); ys.push(pdfNormal(z));
    }
    return { xs, ys };
  }, []);

  // Área sombreada
  const shade = useMemo(() => {
    const xs: number[] = []; const ys: number[] = [];
    const push = (lo: number, hi: number) => {
      for (let z = Math.max(lo, -4); z <= Math.min(hi, 4); z += 0.03) {
        xs.push(z); ys.push(pdfNormal(z));
      }
    };
    if (mode === "lt") push(-4, va);
    else if (mode === "gt") push(va, 4);
    else if (mode === "between") push(Math.min(va, vb), Math.max(va, vb));
    else if (mode === "outside") {
      const lo = Math.min(va, vb), hi = Math.max(va, vb);
      return { left: { xs: [] as number[], ys: [] as number[] }, right: { xs: [] as number[], ys: [] as number[] }, lo, hi };
    }
    return { xs, ys };
  }, [mode, va, vb]);

  const prob = useMemo(() => {
    if (mode === "lt") return cdfNormal(va);
    if (mode === "gt") return 1 - cdfNormal(va);
    if (mode === "between") return cdfNormal(Math.max(va, vb)) - cdfNormal(Math.min(va, vb));
    return cdfNormal(Math.min(va, vb)) + (1 - cdfNormal(Math.max(va, vb)));
  }, [mode, va, vb]);

  const shadeTraces = useMemo(() => {
    if (mode !== "outside") {
      return [{
        x: (shade as { xs: number[] }).xs,
        y: (shade as { ys: number[] }).ys,
        type: "scatter" as const, mode: "lines" as const, fill: "tozeroy" as const,
        fillcolor: "rgba(124,92,255,0.35)",
        line: { color: "#7c5cff", width: 2 }, name: "Área P",
      }];
    }
    const lo = Math.min(va, vb), hi = Math.max(va, vb);
    const leftXs: number[] = [], leftYs: number[] = [];
    const rightXs: number[] = [], rightYs: number[] = [];
    for (let z = -4; z <= lo; z += 0.03) { leftXs.push(z); leftYs.push(pdfNormal(z)); }
    for (let z = hi; z <= 4; z += 0.03) { rightXs.push(z); rightYs.push(pdfNormal(z)); }
    return [
      { x: leftXs, y: leftYs, type: "scatter" as const, mode: "lines" as const, fill: "tozeroy" as const,
        fillcolor: "rgba(124,92,255,0.35)", line: { color: "#7c5cff", width: 2 }, name: "Área izq." },
      { x: rightXs, y: rightYs, type: "scatter" as const, mode: "lines" as const, fill: "tozeroy" as const,
        fillcolor: "rgba(124,92,255,0.35)", line: { color: "#7c5cff", width: 2 }, showlegend: false },
    ];
  }, [mode, va, vb, shade]);

  const modes: { k: Mode; label: string; tex: string }[] = [
    { k: "lt", label: "P(Z < z)", tex: "P(Z < a)" },
    { k: "gt", label: "P(Z > z)", tex: "P(Z > a)" },
    { k: "between", label: "P(a < Z < b)", tex: "P(a < Z < b)" },
    { k: "outside", label: "P(Z<a o Z>b)", tex: "P(Z<a \\; \\text{o} \\; Z>b)" },
  ];

  const needsTwo = mode === "between" || mode === "outside";

  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs uppercase tracking-wider text-[var(--accent)] mb-2">Módulo 3</div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Distribución Normal Estándar</h1>
        <p className="text-[var(--muted)] mt-2 max-w-2xl">
          La variable <InlineMath math="Z \sim N(0,1)" /> con función de densidad{" "}
          <InlineMath math="\varphi(z)=\dfrac{1}{\sqrt{2\pi}}e^{-z^2/2}" />. Selecciona un tipo
          de probabilidad y ajusta los valores de <InlineMath math="a" /> y <InlineMath math="b" />.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Parámetros</CardTitle>
            <CardDescription>Elige el tipo de probabilidad.</CardDescription>
          </CardHeader>

          <div className="grid grid-cols-2 gap-2 mb-5">
            {modes.map(m => (
              <button
                key={m.k}
                onClick={() => setMode(m.k)}
                className={
                  "text-sm rounded-lg border px-3 py-2 transition text-left " +
                  (mode === m.k
                    ? "bg-[var(--accent)]/20 border-[var(--accent)]/50 text-white"
                    : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)] hover:text-white")
                }
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-[var(--muted)]">
                Valor a {needsTwo && "(inferior)"}
              </label>
              <Input type="number" step="0.01" value={a} onChange={e => setA(e.target.value)} />
            </div>
            {needsTwo && (
              <div>
                <label className="text-xs uppercase tracking-wider text-[var(--muted)]">Valor b (superior)</label>
                <Input type="number" step="0.01" value={b} onChange={e => setB(e.target.value)} />
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Stat label="Probabilidad" value={fmt(prob)} accent />
            <Stat label="Porcentaje" value={`${fmt(prob * 100, 2)}%`} />
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Curva N(0,1) con área sombreada</CardTitle>
            <CardDescription>El área bajo la curva representa la probabilidad.</CardDescription>
          </CardHeader>
          <PlotClient
            data={[
              {
                x: curve.xs, y: curve.ys, type: "scatter", mode: "lines",
                line: { color: "#22d3ee", width: 2.5 }, name: "φ(z)",
              },
              ...shadeTraces,
            ]}
            layout={{
              ...darkLayout, height: 360, showlegend: false,
              xaxis: { ...darkLayout.xaxis, title: { text: "z" }, range: [-4, 4], dtick: 1 },
              yaxis: { ...darkLayout.yaxis, title: { text: "φ(z)" } },
              shapes: [
                { type: "line", x0: va, x1: va, y0: 0, y1: pdfNormal(va),
                  line: { color: "#ef4444", width: 1.5, dash: "dot" } },
                ...(needsTwo ? [{
                  type: "line" as const, x0: vb, x1: vb, y0: 0, y1: pdfNormal(vb),
                  line: { color: "#ef4444", width: 1.5, dash: "dot" as const },
                }] : []),
              ],
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%" }}
          />
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Desarrollo</CardTitle>
          <CardDescription>Cálculo basado en la función de distribución acumulada Φ.</CardDescription>
        </CardHeader>

        <div className="space-y-4 text-sm">
          <p className="text-[var(--muted)]">
            Φ(z) representa el área a la izquierda de z bajo la curva normal estándar:
          </p>
          <BlockMath math={`\\Phi(z) = P(Z \\leq z) = \\int_{-\\infty}^{z} \\frac{1}{\\sqrt{2\\pi}} e^{-t^2/2} \\, dt`} />
          {mode === "lt" && (
            <BlockMath math={`P(Z < ${fmt(va)}) = \\Phi(${fmt(va)}) = ${fmt(prob)}`} />
          )}
          {mode === "gt" && (
            <BlockMath math={`P(Z > ${fmt(va)}) = 1 - \\Phi(${fmt(va)}) = 1 - ${fmt(cdfNormal(va))} = ${fmt(prob)}`} />
          )}
          {mode === "between" && (
            <BlockMath math={`P(${fmt(Math.min(va, vb))} < Z < ${fmt(Math.max(va, vb))}) = \\Phi(${fmt(Math.max(va, vb))}) - \\Phi(${fmt(Math.min(va, vb))}) = ${fmt(prob)}`} />
          )}
          {mode === "outside" && (
            <BlockMath math={`P(Z < ${fmt(Math.min(va, vb))}) + P(Z > ${fmt(Math.max(va, vb))}) = ${fmt(prob)}`} />
          )}
        </div>
      </Card>
    </div>
  );
}
