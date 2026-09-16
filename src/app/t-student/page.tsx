"use client";

import { useMemo, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Stat } from "@/components/ui/Stat";
import PlotClient, { darkLayout } from "@/components/PlotClient";
import { pdfT, cdfT, invT, varT } from "@/lib/tstudent";
import { pdfNormal, invNormal } from "@/lib/normal";
import { fmt } from "@/lib/utils";

type DirectMode = "lt" | "gt" | "between" | "outside";
type InverseMode = "inv-lt" | "inv-gt" | "inv-sym";
type Mode = DirectMode | InverseMode;

const isInverseMode = (m: Mode): m is InverseMode => m.startsWith("inv-");

const fmtT = (t: number) =>
  t === Infinity ? "+\\infty" : t === -Infinity ? "-\\infty" : fmt(t);
const fmtTPlain = (t: number) =>
  t === Infinity ? "+∞" : t === -Infinity ? "−∞" : fmt(t);

/** Grados de libertad de uso frecuente (ν = n − 1). */
const dfPresets = [1, 5, 10, 15, 20, 30, 60, 120];

/** Niveles de confianza habituales para la tabla de valores críticos. */
const confLevels = [0.8, 0.9, 0.95, 0.98, 0.99];

export default function TStudentPage() {
  const [mode, setMode] = useState<Mode>("inv-sym");
  const [df, setDf] = useState("10");
  const [a, setA] = useState("-2");
  const [b, setB] = useState("2");
  const [pInput, setPInput] = useState("0.95");
  const [aInf, setAInf] = useState(false);
  const [bInf, setBInf] = useState(false);

  const va = Number(a);
  const vb = Number(b);
  const vp = Number(pInput);
  const v = Number(df);
  const dfValid = Number.isFinite(v) && v > 0;

  const isInverse = isInverseMode(mode);
  const isDoubleDirect = !isInverse && (mode === "between" || mode === "outside");

  // ── Valor crítico K para los modos inversos ─────────
  const K = useMemo(() => {
    if (!isInverse || !dfValid) return NaN;
    if (vp <= 0 || vp >= 1) return NaN;
    if (mode === "inv-lt") return invT(vp, v);
    if (mode === "inv-gt") return invT(1 - vp, v);
    return invT((1 + vp) / 2, v); // inv-sym
  }, [mode, vp, v, isInverse, dfValid]);

  // ── Valores efectivos (sombreado + marcadores) ──────
  const ea = isInverse
    ? (mode === "inv-sym" ? -K : K)
    : (isDoubleDirect && aInf ? -Infinity : va);
  const eb = isInverse && mode === "inv-sym"
    ? K
    : (isDoubleDirect && bInf ? Infinity : vb);

  // ── Tipo de región (forma del sombreado): 4 casos ───
  const region: DirectMode =
    mode === "lt" || mode === "inv-lt" ? "lt" :
    mode === "gt" || mode === "inv-gt" ? "gt" :
    mode === "between" || mode === "inv-sym" ? "between" :
    "outside";

  const needsTwo = region === "between" || region === "outside";

  // ── Probabilidad (siempre visible) ──────────────────
  const prob = useMemo(() => {
    if (!dfValid) return NaN;
    if (region === "lt") return cdfT(ea, v);
    if (region === "gt") return 1 - cdfT(ea, v);
    if (region === "between") return cdfT(Math.max(ea, eb), v) - cdfT(Math.min(ea, eb), v);
    return cdfT(Math.min(ea, eb), v) + (1 - cdfT(Math.max(ea, eb), v));
  }, [region, ea, eb, v, dfValid]);

  // ── Rango del eje: se adapta a las colas pesadas de ν pequeño ──
  const L = useMemo(() => {
    const marks = [ea, eb].filter(Number.isFinite).map(Math.abs);
    return Math.min(50, Math.max(4.5, ...marks.map(m => m + 1)));
  }, [ea, eb]);

  const step = L / 260;

  // ── Curvas: t y la normal de referencia ─────────────
  const curve = useMemo(() => {
    const xs: number[] = []; const ys: number[] = []; const zs: number[] = [];
    if (!dfValid) return { xs, ys, zs };
    for (let t = -L; t <= L; t += step) {
      xs.push(t); ys.push(pdfT(t, v)); zs.push(pdfNormal(t));
    }
    return { xs, ys, zs };
  }, [v, dfValid, L, step]);

  const shadeTraces = useMemo(() => {
    if (!dfValid) return [];
    const make = (lo: number, hi: number) => {
      const xs: number[] = [], ys: number[] = [];
      const from = Math.max(lo, -L), to = Math.min(hi, L);
      for (let t = from; t <= to; t += step / 1.5) { xs.push(t); ys.push(pdfT(t, v)); }
      return { xs, ys };
    };
    const traceFill = (xs: number[], ys: number[]) => ({
      x: xs, y: ys, type: "scatter" as const, mode: "lines" as const, fill: "tozeroy" as const,
      fillcolor: "rgba(124,92,255,0.32)",
      line: { color: "#7c5cff", width: 2 },
      showlegend: false,
      name: "Área",
    });

    if (region === "lt") { const s = make(-L, ea); return [traceFill(s.xs, s.ys)]; }
    if (region === "gt") { const s = make(ea, L); return [traceFill(s.xs, s.ys)]; }
    if (region === "between") {
      const s = make(Math.min(ea, eb), Math.max(ea, eb));
      return [traceFill(s.xs, s.ys)];
    }
    // outside
    const lo = Math.min(ea, eb), hi = Math.max(ea, eb);
    const left = make(-L, lo), right = make(hi, L);
    return [traceFill(left.xs, left.ys), traceFill(right.xs, right.ys)];
  }, [region, ea, eb, v, dfValid, L, step]);

  // ── Valor z equivalente, para comparar con la normal ──
  const zEquiv = useMemo(() => {
    if (!isInverse || !Number.isFinite(K)) return NaN;
    if (mode === "inv-lt") return invNormal(vp);
    if (mode === "inv-gt") return invNormal(1 - vp);
    return invNormal((1 + vp) / 2);
  }, [mode, vp, K, isInverse]);

  const varianza = dfValid ? varT(v) : NaN;

  const criticalRows = useMemo(() => {
    if (!dfValid) return [];
    return confLevels.map(c => ({ c, two: invT((1 + c) / 2, v), one: invT(c, v) }));
  }, [v, dfValid]);

  const directModes: { k: DirectMode; label: string; sub: string }[] = [
    { k: "lt", label: "P(T < a)", sub: "Cola izquierda" },
    { k: "gt", label: "P(T > a)", sub: "Cola derecha" },
    { k: "between", label: "P(a < T < b)", sub: "Entre a y b" },
    { k: "outside", label: "P(T<a ∪ T>b)", sub: "Fuera de [a,b]" },
  ];

  const inverseModes: { k: InverseMode; label: string; sub: string }[] = [
    { k: "inv-lt", label: "P(T < K) = p", sub: "K dado área izquierda" },
    { k: "inv-gt", label: "P(T > K) = p", sub: "K dado área derecha" },
    { k: "inv-sym", label: "P(−K < T < K) = p", sub: "K simétrico (IC)" },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-3 max-w-2xl">
        <span className="eyebrow eyebrow--accent">04 · Distribución continua</span>
        <h1 className="h-page">Distribución t de Student</h1>
        <p className="text-[14.5px] text-[var(--muted)] leading-relaxed">
          La variable <InlineMath math="T \sim t_{\nu}" /> aparece al estimar la media de una
          población normal con <span className="text-white">σ desconocida</span>: se sustituye σ por
          la desviación muestral <InlineMath math="s" /> y el estadístico deja de ser normal. Su
          forma es acampanada y simétrica, pero con{" "}
          <span className="text-white">colas más pesadas</span>, y depende de un único parámetro:
          los grados de libertad <InlineMath math="\nu" />.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Controls */}
        <Card className="lg:col-span-2" pad="md">
          <CardHeader>
            <CardTitle>Parámetros</CardTitle>
            <CardDescription>Fija los grados de libertad y elige la dirección del cálculo.</CardDescription>
          </CardHeader>

          {/* Grados de libertad */}
          <div className="mb-5">
            <label className="label mb-1.5 block">
              Grados de libertad ν <span className="text-[var(--muted-2)] normal-case tracking-normal">(ν = n − 1)</span>
            </label>
            <Input
              type="number"
              min="1"
              step="1"
              value={df}
              onChange={e => setDf(e.target.value)}
              className={!dfValid ? "border-[#ef4444]/60" : ""}
            />
            {!dfValid && (
              <p className="mt-1.5 text-[12px] text-[#ef4444]">ν debe ser un número mayor que 0.</p>
            )}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {dfPresets.map(d => {
                const active = Number(df) === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDf(String(d))}
                    className={
                      "num px-2.5 py-1 rounded-[var(--r-sm)] border text-[12px] transition-colors " +
                      (active
                        ? "bg-[var(--accent)]/12 border-[var(--accent)]/45 text-white"
                        : "bg-[var(--surface-2)]/50 border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-[var(--border-strong)]")
                    }
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct modes */}
          <div className="mb-4 pt-4 border-t border-[var(--border)]">
            <div className="label mb-2">Directo · <span className="text-[var(--muted)] normal-case tracking-normal">dado t, calcula la probabilidad</span></div>
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
                  <Input
                    type="number"
                    step="0.01"
                    value={a}
                    onChange={e => setA(e.target.value)}
                    disabled={isDoubleDirect && aInf}
                    className={isDoubleDirect && aInf ? "opacity-40 cursor-not-allowed" : ""}
                  />
                  {isDoubleDirect && (
                    <label className="mt-2 inline-flex items-center gap-2 text-[12px] text-[var(--muted)] cursor-pointer hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={aInf}
                        onChange={e => setAInf(e.target.checked)}
                        className="w-3.5 h-3.5 accent-[var(--accent)] cursor-pointer"
                      />
                      <span>Sin límite inferior <span className="num text-[var(--muted-2)]">(a = −∞)</span></span>
                    </label>
                  )}
                </div>
                {needsTwo && (
                  <div>
                    <label className="label mb-1.5 block">Valor b <span className="text-[var(--muted-2)]">(superior)</span></label>
                    <Input
                      type="number"
                      step="0.01"
                      value={b}
                      onChange={e => setB(e.target.value)}
                      disabled={isDoubleDirect && bInf}
                      className={isDoubleDirect && bInf ? "opacity-40 cursor-not-allowed" : ""}
                    />
                    {isDoubleDirect && (
                      <label className="mt-2 inline-flex items-center gap-2 text-[12px] text-[var(--muted)] cursor-pointer hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={bInf}
                          onChange={e => setBInf(e.target.checked)}
                          className="w-3.5 h-3.5 accent-[var(--accent)] cursor-pointer"
                        />
                        <span>Sin límite superior <span className="num text-[var(--muted-2)]">(b = +∞)</span></span>
                      </label>
                    )}
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
                  {/* Directo */}
                  {mode === "lt" && <>F({fmt(va)}; ν={fmt(v, 0)}) = {fmt(prob)}</>}
                  {mode === "gt" && <>1 − F({fmt(va)}; ν={fmt(v, 0)}) = {fmt(prob)}</>}
                  {mode === "between" && <>F({fmtTPlain(Math.max(ea, eb))}) − F({fmtTPlain(Math.min(ea, eb))}) = {fmt(prob)}</>}
                  {mode === "outside" && <>F({fmtTPlain(Math.min(ea, eb))}) + (1 − F({fmtTPlain(Math.max(ea, eb))})) = {fmt(prob)}</>}
                  {/* Inverso */}
                  {mode === "inv-lt" && <>K = F⁻¹({fmt(vp)}) = {fmt(K)}</>}
                  {mode === "inv-gt" && <>K = F⁻¹(1 − {fmt(vp)}) = F⁻¹({fmt(1 - vp)}) = {fmt(K)}</>}
                  {mode === "inv-sym" && <>K = F⁻¹((1+{fmt(vp)})/2) = F⁻¹({fmt((1 + vp) / 2)}) = {fmt(K)}</>}
                </div>
              </div>
            </div>
          </Card>

          <Card pad="md">
            <CardHeader>
              <CardTitle>Curva t con área sombreada</CardTitle>
              <CardDescription>
                La línea punteada gris es la normal estándar N(0,1). Observa cómo la t queda más
                baja en el centro y más alta en las colas, y cómo ambas se confunden al crecer ν.
              </CardDescription>
            </CardHeader>
            <PlotClient
              data={[
                {
                  x: curve.xs, y: curve.zs, type: "scatter", mode: "lines",
                  line: { color: "#6b7280", width: 1.5, dash: "dot" }, name: "N(0,1)",
                },
                {
                  x: curve.xs, y: curve.ys, type: "scatter", mode: "lines",
                  line: { color: "#22d3ee", width: 2.5 }, name: `t (ν = ${fmt(v, 0)})`,
                },
                ...shadeTraces,
              ]}
              layout={{
                ...darkLayout, height: 360, showlegend: true,
                legend: {
                  orientation: "h", x: 0, y: 1.14,
                  font: { color: "#a1a1aa", size: 11 },
                  bgcolor: "rgba(0,0,0,0)",
                },
                xaxis: { ...darkLayout.xaxis, title: { text: "t" }, range: [-L, L] },
                yaxis: { ...darkLayout.yaxis, title: { text: "f(t)" } },
                shapes: [
                  ...(dfValid && Number.isFinite(ea) ? [{
                    type: "line" as const, x0: ea, x1: ea, y0: 0, y1: pdfT(ea, v),
                    line: { color: "#ef4444", width: 1.5, dash: "dot" as const },
                  }] : []),
                  ...(dfValid && needsTwo && Number.isFinite(eb) ? [{
                    type: "line" as const, x0: eb, x1: eb, y0: 0, y1: pdfT(eb, v),
                    line: { color: "#ef4444", width: 1.5, dash: "dot" as const },
                  }] : []),
                ],
                annotations: isInverse && dfValid && Number.isFinite(K) ? [
                  { x: ea, y: pdfT(ea, v), showarrow: false,
                    text: `K = ${fmt(ea)}`, font: { color: "#ef4444", size: 12 },
                    yshift: 14, xshift: needsTwo ? -6 : 6 },
                  ...(needsTwo ? [{
                    x: eb, y: pdfT(eb, v), showarrow: false,
                    text: `K = ${fmt(eb)}`, font: { color: "#ef4444", size: 12 },
                    yshift: 14, xshift: 6,
                  }] : []),
                ] : undefined,
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%" }}
            />
          </Card>

          {/* Propiedades */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Stat
              label="Media E(T)"
              value={dfValid ? (v > 1 ? "0" : "No existe") : "—"}
              hint={dfValid && v > 1 ? "Simétrica respecto a 0" : "Requiere ν > 1"}
              size="sm"
            />
            <Stat
              label="Varianza Var(T)"
              value={
                !dfValid ? "—"
                  : varianza === Infinity ? "∞"
                  : Number.isFinite(varianza) ? fmt(varianza)
                  : "No existe"
              }
              hint={dfValid && v > 2 ? "ν / (ν − 2), siempre > 1" : "Requiere ν > 2"}
              size="sm"
            />
            <Stat
              label={isInverse ? "Con z sería" : "Grados de libertad"}
              value={isInverse ? (Number.isFinite(zEquiv) ? fmt(zEquiv) : "—") : (dfValid ? fmt(v, 0) : "—")}
              hint={
                isInverse && Number.isFinite(zEquiv) && Number.isFinite(K)
                  ? `t excede a z en ${fmt(Math.abs(K) - Math.abs(zEquiv), 3)}`
                  : "ν = n − 1 para una muestra de tamaño n"
              }
              size="sm"
              accent={isInverse}
            />
          </div>
        </div>
      </div>

      {/* ── Desarrollo ─────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Desarrollo</span>
            <h2 className="h-section mt-1.5">{isInverse ? "Cómo se obtiene K" : "Cómo se calcula la probabilidad"}</h2>
          </div>
          <p className="hidden md:block max-w-sm text-[13px] text-[var(--muted)] text-right leading-relaxed">
            {isInverse
              ? "F⁻¹ es la inversa de la acumulada de la t con ν grados de libertad."
              : "F es la función de distribución acumulada de la t con ν grados de libertad."}
          </p>
        </div>

        <Card pad="lg">
          <div className="space-y-4 text-[13.5px]">
            <p className="text-[var(--muted)] leading-relaxed">
              Función de densidad de la t de Student con ν grados de libertad:
            </p>
            <BlockMath math={`f(t;\\nu) = \\frac{\\Gamma\\!\\left(\\frac{\\nu+1}{2}\\right)}{\\sqrt{\\nu\\pi}\\;\\Gamma\\!\\left(\\frac{\\nu}{2}\\right)} \\left(1 + \\frac{t^{2}}{\\nu}\\right)^{-\\frac{\\nu+1}{2}}`} />

            {!isInverse && (
              <>
                <p className="text-[var(--muted)] leading-relaxed pt-2">
                  La acumulada es el área a la izquierda de t bajo esa curva:
                </p>
                <BlockMath math={`F(t;\\nu) = P(T \\leq t) = \\int_{-\\infty}^{t} f(u;\\nu)\\, du`} />
                <div className="pt-2">
                  {mode === "lt" && (
                    <BlockMath math={`P(T < ${fmt(va)}) = F(${fmt(va)};\\, \\nu=${fmt(v, 0)}) = ${fmt(prob)}`} />
                  )}
                  {mode === "gt" && (
                    <BlockMath math={`P(T > ${fmt(va)}) = 1 - F(${fmt(va)};\\, \\nu=${fmt(v, 0)}) = 1 - ${fmt(cdfT(va, v))} = ${fmt(prob)}`} />
                  )}
                  {mode === "between" && (
                    <BlockMath math={`P(${fmtT(Math.min(ea, eb))} < T < ${fmtT(Math.max(ea, eb))}) = F(${fmtT(Math.max(ea, eb))}) - F(${fmtT(Math.min(ea, eb))}) = ${fmt(prob)}`} />
                  )}
                  {mode === "outside" && (
                    <BlockMath math={`P(T < ${fmtT(Math.min(ea, eb))}) + P(T > ${fmtT(Math.max(ea, eb))}) = ${fmt(prob)}`} />
                  )}
                </div>
              </>
            )}

            {isInverse && (
              <>
                <p className="text-[var(--muted)] leading-relaxed pt-2">
                  Buscamos el valor crítico K que deja el área pedida, con los mismos ν ={" "}
                  {fmt(v, 0)} grados de libertad. Se despeja con la inversa F⁻¹:
                </p>
                {mode === "inv-lt" && (
                  <BlockMath math={`P(T < K) = ${fmt(vp)} \\;\\Longrightarrow\\; K = F^{-1}(${fmt(vp)};\\, ${fmt(v, 0)}) = ${fmt(K)}`} />
                )}
                {mode === "inv-gt" && (
                  <>
                    <BlockMath math={`P(T > K) = ${fmt(vp)} \\;\\Longleftrightarrow\\; P(T < K) = 1 - ${fmt(vp)} = ${fmt(1 - vp)}`} />
                    <BlockMath math={`K = F^{-1}(${fmt(1 - vp)};\\, ${fmt(v, 0)}) = ${fmt(K)}`} />
                  </>
                )}
                {mode === "inv-sym" && (
                  <>
                    <BlockMath math={`P(-K < T < K) = ${fmt(vp)} \\;\\Longleftrightarrow\\; P(T < K) = \\dfrac{1 + ${fmt(vp)}}{2} = ${fmt((1 + vp) / 2)}`} />
                    <BlockMath math={`K = F^{-1}(${fmt((1 + vp) / 2)};\\, ${fmt(v, 0)}) = ${fmt(K)}`} />
                    <p className="text-[var(--muted)] leading-relaxed pt-1">
                      Este es el valor <InlineMath math="t_{\alpha/2,\,\nu}" /> que se usa en el
                      intervalo de confianza para la media con σ desconocida:
                    </p>
                    <BlockMath math={`\\bar{x} \\pm t_{\\alpha/2,\\,\\nu}\\,\\dfrac{s}{\\sqrt{n}} \\qquad t_{\\alpha/2,\\,${fmt(v, 0)}} = ${fmt(K)}`} />
                  </>
                )}
              </>
            )}
          </div>
        </Card>
      </section>

      {/* ── Tabla de valores críticos ──────────────────── */}
      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Referencia</span>
            <h2 className="h-section mt-1.5">Valores críticos para ν = {dfValid ? fmt(v, 0) : "—"}</h2>
          </div>
          <p className="hidden md:block max-w-sm text-[13px] text-[var(--muted)] text-right leading-relaxed">
            Equivale al renglón de la tabla t impresa, generado aquí para los grados de libertad elegidos.
          </p>
        </div>

        <Card pad="md">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="label font-medium pb-2.5 pr-4">Confianza</th>
                  <th className="label font-medium pb-2.5 pr-4">α</th>
                  <th className="label font-medium pb-2.5 pr-4">t (dos colas)</th>
                  <th className="label font-medium pb-2.5">t (una cola)</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {criticalRows.map(({ c, two, one }) => (
                  <tr key={c} className="border-t border-[var(--border)]">
                    <td className="num py-2.5 pr-4">{fmt(c * 100, 0)}%</td>
                    <td className="num py-2.5 pr-4 text-[var(--muted)]">{fmt(1 - c, 2)}</td>
                    <td className="num py-2.5 pr-4 text-[var(--accent-2)]">{fmt(two, 3)}</td>
                    <td className="num py-2.5">{fmt(one, 3)}</td>
                  </tr>
                ))}
                {!dfValid && (
                  <tr><td colSpan={4} className="py-4 text-[var(--muted)]">Introduce un valor de ν válido.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card pad="lg" tone="quiet">
          <div className="space-y-3 text-[13.5px]">
            <div className="label">¿Cuándo t y cuándo z?</div>
            <p className="text-[var(--muted)] leading-relaxed">
              Se usa la <span className="text-white">t de Student</span> cuando la desviación
              estándar poblacional σ es desconocida y se estima con la muestral{" "}
              <InlineMath math="s" />. Se usa la <span className="text-white">normal estándar</span>{" "}
              cuando σ es conocida. Como la t tiene colas más pesadas, sus valores críticos son{" "}
              <span className="text-white">siempre mayores</span> que los de z: el intervalo sale
              más ancho, que es el precio de no conocer σ.
            </p>
            <p className="text-[var(--muted)] leading-relaxed">
              Al crecer ν la diferencia se desvanece —{" "}
              <InlineMath math="t_{\nu} \to N(0,1)" /> cuando{" "}
              <InlineMath math="\nu \to \infty" />. Por eso a partir de ν ≈ 30 muchas tablas
              permiten usar z como aproximación: pruébalo cambiando los grados de libertad arriba y
              mira cómo la curva se pega a la punteada.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
