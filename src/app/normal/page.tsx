"use client";

import { useMemo, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import PlotClient, { darkLayout } from "@/components/PlotClient";
import { pdfNormal, cdfNormal, invNormal } from "@/lib/normal";
import { fmt } from "@/lib/utils";

type DirectMode = "lt" | "gt" | "between" | "outside";
type InverseMode = "inv-lt" | "inv-gt" | "inv-sym";
type Mode = DirectMode | InverseMode;

const isInverseMode = (m: Mode): m is InverseMode => m.startsWith("inv-");

export default function NormalPage() {
  const [mode, setMode] = useState<Mode>("lt");
  const [a, setA] = useState("-1");
  const [b, setB] = useState("1");
  const [pInput, setPInput] = useState("0.95");

  const va = Number(a);
  const vb = Number(b);
  const vp = Number(pInput);

  const isInverse = isInverseMode(mode);

  // ── Compute K for inverse modes ─────────────────────
  const K = useMemo(() => {
    if (!isInverse) return NaN;
    if (vp <= 0 || vp >= 1) return NaN;
    if (mode === "inv-lt") return invNormal(vp);
    if (mode === "inv-gt") return invNormal(1 - vp);
    return invNormal((1 + vp) / 2); // inv-sym
  }, [mode, vp, isInverse]);

  // ── Effective z values (used for shading + plot markers)
  const ea = isInverse ? (mode === "inv-sym" ? -K : K) : va;
  const eb = isInverse && mode === "inv-sym" ? K : vb;

  // ── Type of region (shading shape): collapses to 4 cases ──
  const region: DirectMode =
    mode === "lt" || mode === "inv-lt" ? "lt" :
    mode === "gt" || mode === "inv-gt" ? "gt" :
    mode === "between" || mode === "inv-sym" ? "between" :
    "outside";

  const needsTwo = region === "between" || region === "outside";

  // ── Probability (always shown, computed from effective z) ─
  const prob = useMemo(() => {
    if (region === "lt") return cdfNormal(ea);
    if (region === "gt") return 1 - cdfNormal(ea);
    if (region === "between") return cdfNormal(Math.max(ea, eb)) - cdfNormal(Math.min(ea, eb));
    return cdfNormal(Math.min(ea, eb)) + (1 - cdfNormal(Math.max(ea, eb)));
  }, [region, ea, eb]);

  // ── Curve and shading ────────────────────────────────
  const curve = useMemo(() => {
    const xs: number[] = []; const ys: number[] = [];
    for (let z = -4; z <= 4; z += 0.05) { xs.push(z); ys.push(pdfNormal(z)); }
    return { xs, ys };
  }, []);

  const shadeTraces = useMemo(() => {
    const make = (lo: number, hi: number) => {
      const xs: number[] = [], ys: number[] = [];
      for (let z = Math.max(lo, -4); z <= Math.min(hi, 4); z += 0.03) {
        xs.push(z); ys.push(pdfNormal(z));
      }
      return { xs, ys };
    };
    const traceFill = (xs: number[], ys: number[], showLegend = false) => ({
      x: xs, y: ys, type: "scatter" as const, mode: "lines" as const, fill: "tozeroy" as const,
      fillcolor: "rgba(124,92,255,0.32)",
      line: { color: "#7c5cff", width: 2 },
      showlegend: showLegend,
      name: "Área",
    });

    if (region === "lt")  { const s = make(-4, ea); return [traceFill(s.xs, s.ys, true)]; }
    if (region === "gt")  { const s = make(ea, 4);  return [traceFill(s.xs, s.ys, true)]; }
    if (region === "between") {
      const s = make(Math.min(ea, eb), Math.max(ea, eb));
      return [traceFill(s.xs, s.ys, true)];
    }
    // outside
    const lo = Math.min(ea, eb), hi = Math.max(ea, eb);
    const left = make(-4, lo), right = make(hi, 4);
    return [traceFill(left.xs, left.ys, true), traceFill(right.xs, right.ys)];
  }, [region, ea, eb]);

  const directModes: { k: DirectMode; label: string; sub: string }[] = [
    { k: "lt", label: "P(Z < a)", sub: "Cola izquierda" },
    { k: "gt", label: "P(Z > a)", sub: "Cola derecha" },
    { k: "between", label: "P(a < Z < b)", sub: "Entre a y b" },
    { k: "outside", label: "P(Z<a ∪ Z>b)", sub: "Fuera de [a,b]" },
  ];

  const inverseModes: { k: InverseMode; label: string; sub: string }[] = [
    { k: "inv-lt", label: "P(Z < K) = p", sub: "K dado área izquierda" },
    { k: "inv-gt", label: "P(Z > K) = p", sub: "K dado área derecha" },
    { k: "inv-sym", label: "P(−K < Z < K) = p", sub: "K simétrico (IC)" },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-3 max-w-2xl">
        <span className="eyebrow eyebrow--accent">03 · Distribución continua</span>
        <h1 className="h-page">Distribución normal estándar</h1>
        <p className="text-[14.5px] text-[var(--muted)] leading-relaxed">
          La variable <InlineMath math="Z \sim N(0,1)" /> con función de densidad{" "}
          <InlineMath math="\varphi(z)=\dfrac{1}{\sqrt{2\pi}}e^{-z^2/2}" />. Calcula{" "}
          <span className="text-white">probabilidades dado z</span> (modo directo) o el{" "}
          <span className="text-white">valor crítico K</span> dado una probabilidad (modo inverso).
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Controls */}
        <Card className="lg:col-span-2" pad="md">
          <CardHeader>
            <CardTitle>Parámetros</CardTitle>
            <CardDescription>Elige la dirección del cálculo y el tipo de probabilidad.</CardDescription>
          </CardHeader>

          {/* Direct modes */}
          <div className="mb-4">
            <div className="label mb-2">Directo · <span className="text-[var(--muted)] normal-case tracking-normal">dado z, calcula la probabilidad</span></div>
            <div className="grid grid-cols-1 gap-1.5">
              {directModes.map(m => {
                const active = mode === m.k;
                return (
                  <button
                    key={m.k}
                    onClick={() => setMode(m.k)}
                    className={
                      "flex items-center justify-between gap-3 px-3.5 py-2 rounded-[var(--r-sm)] border text-left transition-colors " +
                      (active
                        ? "bg-[var(--accent)]/12 border-[var(--accent)]/45 text-white"
                        : "bg-[var(--surface-2)]/50 border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-[var(--border-strong)]")
                    }
                  >
                    <span className="num text-[13px]">{m.label}</span>
                    <span className={"text-[11px] " + (active ? "text-[var(--accent-2)]" : "text-[var(--muted-2)]")}>{m.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inverse modes */}
          <div className="mb-5">
            <div className="label mb-2">Inverso · <span className="text-[var(--muted)] normal-case tracking-normal">dado p, calcula K</span></div>
            <div className="grid grid-cols-1 gap-1.5">
              {inverseModes.map(m => {
                const active = mode === m.k;
                return (
                  <button
                    key={m.k}
                    onClick={() => setMode(m.k)}
                    className={
                      "flex items-center justify-between gap-3 px-3.5 py-2 rounded-[var(--r-sm)] border text-left transition-colors " +
                      (active
                        ? "bg-[var(--accent-2)]/12 border-[var(--accent-2)]/45 text-white"
                        : "bg-[var(--surface-2)]/50 border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-[var(--border-strong)]")
                    }
                  >
                    <span className="num text-[13px]">{m.label}</span>
                    <span className={"text-[11px] " + (active ? "text-[var(--accent-2)]" : "text-[var(--muted-2)]")}>{m.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-3 pt-3 border-t border-[var(--border)]">
            {!isInverse && (
              <>
                <div>
                  <label className="label mb-1.5 block">
                    Valor a {needsTwo && <span className="text-[var(--muted-2)]">(inferior)</span>}
                  </label>
                  <Input type="number" step="0.01" value={a} onChange={e => setA(e.target.value)} />
                </div>
                {needsTwo && (
                  <div>
                    <label className="label mb-1.5 block">Valor b <span className="text-[var(--muted-2)]">(superior)</span></label>
                    <Input type="number" step="0.01" value={b} onChange={e => setB(e.target.value)} />
                  </div>
                )}
              </>
            )}
            {isInverse && (
              <div>
                <label className="label mb-1.5 block">
                  Probabilidad p <span className="text-[var(--muted-2)]">(0 a 1)</span>
                </label>
                <Input type="number" step="0.0001" min="0" max="1" value={pInput} onChange={e => setPInput(e.target.value)} />
              </div>
            )}
          </div>
        </Card>

        {/* Result + plot */}
        <div className="lg:col-span-3 space-y-5">
          <Card tone="elevated" pad="md" className="flex flex-col md:flex-row md:items-stretch gap-5">
            <div className="flex-1">
              <div className="label">{isInverse ? "Valor crítico K" : "Probabilidad"}</div>
              <div className="num font-semibold text-white text-[44px] leading-none mt-2">
                {isInverse ? (Number.isFinite(K) ? fmt(K) : "—") : fmt(prob)}
              </div>
              <div className="text-[12.5px] text-[var(--muted)] mt-2">
                {isInverse
                  ? <>Verificación: probabilidad asociada <span className="num text-white">{fmt(prob)}</span></>
                  : <>Equivalente a <span className="num text-white">{fmt(prob * 100, 2)}%</span> del área total</>}
              </div>
            </div>
            <div className="hidden md:block w-px bg-[var(--border)]" />
            <div className="md:flex-1 flex items-center">
              <div className="w-full">
                <div className="label mb-2">Cálculo</div>
                <div className="num text-[13px] text-white leading-relaxed break-all">
                  {/* Direct */}
                  {mode === "lt" && <>Φ({fmt(va)}) = {fmt(prob)}</>}
                  {mode === "gt" && <>1 − Φ({fmt(va)}) = {fmt(prob)}</>}
                  {mode === "between" && <>Φ({fmt(Math.max(va, vb))}) − Φ({fmt(Math.min(va, vb))}) = {fmt(prob)}</>}
                  {mode === "outside" && <>Φ({fmt(Math.min(va, vb))}) + (1 − Φ({fmt(Math.max(va, vb))})) = {fmt(prob)}</>}
                  {/* Inverse */}
                  {mode === "inv-lt" && <>K = Φ⁻¹({fmt(vp)}) = {fmt(K)}</>}
                  {mode === "inv-gt" && <>K = Φ⁻¹(1 − {fmt(vp)}) = Φ⁻¹({fmt(1 - vp)}) = {fmt(K)}</>}
                  {mode === "inv-sym" && <>K = Φ⁻¹((1+{fmt(vp)})/2) = Φ⁻¹({fmt((1 + vp) / 2)}) = {fmt(K)}</>}
                </div>
              </div>
            </div>
          </Card>

          <Card pad="md">
            <CardHeader>
              <CardTitle>Curva N(0,1) con área sombreada</CardTitle>
              <CardDescription>
                {isInverse
                  ? "El área sombreada es la probabilidad p; la línea roja marca el valor K."
                  : "El área bajo la curva representa la probabilidad solicitada."}
              </CardDescription>
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
                  { type: "line", x0: ea, x1: ea, y0: 0, y1: pdfNormal(ea),
                    line: { color: "#ef4444", width: 1.5, dash: "dot" } },
                  ...(needsTwo ? [{
                    type: "line" as const, x0: eb, x1: eb, y0: 0, y1: pdfNormal(eb),
                    line: { color: "#ef4444", width: 1.5, dash: "dot" as const },
                  }] : []),
                ],
                annotations: isInverse ? [
                  { x: ea, y: pdfNormal(ea), showarrow: false,
                    text: `K = ${fmt(ea)}`, font: { color: "#ef4444", size: 12 },
                    yshift: 14, xshift: needsTwo ? -6 : 6 },
                  ...(needsTwo ? [{
                    x: eb, y: pdfNormal(eb), showarrow: false,
                    text: `K = ${fmt(eb)}`, font: { color: "#ef4444", size: 12 },
                    yshift: 14, xshift: 6,
                  }] : []),
                ] : undefined,
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%" }}
            />
          </Card>
        </div>
      </div>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Desarrollo</span>
            <h2 className="h-section mt-1.5">{isInverse ? "Cómo se obtiene K" : "Cómo se calcula la probabilidad"}</h2>
          </div>
          <p className="hidden md:block max-w-sm text-[13px] text-[var(--muted)] text-right leading-relaxed">
            {isInverse
              ? "Φ⁻¹ es la función inversa de la cumulativa normal estándar."
              : "Φ es la función de distribución acumulada de la normal estándar."}
          </p>
        </div>

        <Card pad="lg">
          <div className="space-y-4 text-[13.5px]">
            {!isInverse && (
              <>
                <p className="text-[var(--muted)] leading-relaxed">
                  Φ(z) representa el área a la izquierda de z bajo la curva normal estándar:
                </p>
                <BlockMath math={`\\Phi(z) = P(Z \\leq z) = \\int_{-\\infty}^{z} \\frac{1}{\\sqrt{2\\pi}} e^{-t^2/2}\\, dt`} />
                <div className="pt-2">
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
              </>
            )}

            {isInverse && (
              <>
                <p className="text-[var(--muted)] leading-relaxed">
                  Buscamos K tal que el área bajo la curva cumpla la condición. Despejamos usando la
                  inversa Φ⁻¹:
                </p>
                {mode === "inv-lt" && (
                  <>
                    <BlockMath math={`P(Z < K) = ${fmt(vp)} \\;\\Longrightarrow\\; K = \\Phi^{-1}(${fmt(vp)}) = ${fmt(K)}`} />
                  </>
                )}
                {mode === "inv-gt" && (
                  <>
                    <BlockMath math={`P(Z > K) = ${fmt(vp)} \\;\\Longleftrightarrow\\; P(Z < K) = 1 - ${fmt(vp)} = ${fmt(1 - vp)}`} />
                    <BlockMath math={`K = \\Phi^{-1}(${fmt(1 - vp)}) = ${fmt(K)}`} />
                  </>
                )}
                {mode === "inv-sym" && (
                  <>
                    <BlockMath math={`P(-K < Z < K) = ${fmt(vp)} \\;\\Longleftrightarrow\\; P(Z < K) = \\dfrac{1 + ${fmt(vp)}}{2} = ${fmt((1 + vp) / 2)}`} />
                    <BlockMath math={`K = \\Phi^{-1}(${fmt((1 + vp) / 2)}) = ${fmt(K)}`} />
                  </>
                )}
              </>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
