import Link from "next/link";
import { Sigma, Calculator, BellRing, BookOpen } from "lucide-react";
import { InlineMath } from "react-katex";

const modules = [
  {
    href: "/varianza",
    n: "01",
    title: "Varianza y desviación estándar",
    desc: "Medidas de dispersión para conjuntos de datos. Cálculo muestral, poblacional y desarrollo paso a paso con histograma.",
    formula: "s^2 = \\tfrac{1}{n-1}\\sum_{i=1}^{n}(x_i - \\bar{x})^2",
    icon: Sigma,
    tag: "Estadística descriptiva",
  },
  {
    href: "/valor-esperado",
    n: "02",
    title: "Valor esperado de una variable aleatoria",
    desc: "Promedio teórico de una variable aleatoria discreta. Tabla de distribución dinámica con cálculo de E(X), Var(X) y σ.",
    formula: "E(X) = \\sum_{i} x_i \\cdot P(x_i)",
    icon: Calculator,
    tag: "Variables aleatorias",
  },
  {
    href: "/normal",
    n: "03",
    title: "Distribución normal estándar",
    desc: "Curva N(0,1) interactiva con área sombreada. Cuatro modos de probabilidad sobre Φ(z).",
    formula: "\\varphi(z) = \\tfrac{1}{\\sqrt{2\\pi}}\\, e^{-z^2/2}",
    icon: BellRing,
    tag: "Distribución continua",
  },
  {
    href: "/problemas",
    n: "04",
    title: "Colección de problemas resueltos",
    desc: "Diez problemas aplicados sobre la distribución normal estándar, con respuesta oculta para autoevaluación.",
    formula: "P(Z \\leq z) = \\Phi(z)",
    icon: BookOpen,
    tag: "Aplicación práctica",
  },
];

export default function Home() {
  return (
    <div className="space-y-16">
      {/* ── Cover ─────────────────────────────────────────── */}
      <section aria-labelledby="cover-title" className="pt-2">
        {/* Top meta line — replaces the playful badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
          <div className="flex items-center gap-3 text-[12px] text-[var(--muted)]">
            <span className="num text-white">PB-2026</span>
            <span className="h-3 w-px bg-[var(--border)]" />
            <span>Probabilidad y Estadística</span>
            <span className="h-3 w-px bg-[var(--border)]" />
            <span>Proyecto académico</span>
          </div>
          <div className="flex items-center gap-2 text-[11.5px] text-[var(--muted-2)]">
            <span className="dot text-[var(--success)]" />
            Versión estable · 2026
          </div>
        </div>
        <div className="rule rule-marker" aria-hidden />

        {/* Title block */}
        <div className="pt-12 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-2">
            <div className="num text-[11px] tracking-[0.3em] text-[var(--muted-2)]">
              VOL. 01
            </div>
          </div>
          <div className="col-span-12 md:col-span-10 max-w-3xl">
            <h1 id="cover-title" className="h-display">
              Software de cálculo de{" "}
              <span className="bg-gradient-to-r from-[var(--accent)] via-[#a78bff] to-[var(--accent-2)] bg-clip-text text-transparent">
                probabilidades
              </span>
              {" "}y{" "}
              <span className="bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent)] bg-clip-text text-transparent">
                visualización
              </span>
              {" "}de distribuciones.
            </h1>
            <p className="mt-7 text-[15px] text-[var(--muted)] leading-[1.7] max-w-2xl">
              Una herramienta interactiva para{" "}
              <span className="text-white font-medium">resolver</span>,{" "}
              <span className="text-white font-medium">graficar</span> e{" "}
              <span className="text-white font-medium">interpretar</span> problemas de
              probabilidad y estadística. Cubre{" "}
              <span className="text-[var(--accent-2)]">medidas de dispersión</span>,{" "}
              <span className="text-[var(--accent-2)]">valor esperado</span> de variables
              aleatorias discretas y la{" "}
              <span className="text-[var(--accent-2)]">distribución normal estándar</span>,
              acompañada de una colección de problemas resueltos.
            </p>
          </div>
        </div>

        {/* Section break */}
        <div className="mt-12 rule-num" aria-hidden>
          <span className="rule-num__plate">RESUMEN</span>
        </div>

        {/* Abstract metadata grid */}
        <dl className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
          {[
            { k: "Módulos", v: "04" },
            { k: "Problemas", v: "10" },
            { k: "Fórmulas", v: "KaTeX" },
            { k: "Gráficas", v: "Plotly" },
          ].map(({ k, v }) => (
            <div key={k} className="flex flex-col gap-1.5">
              <dt className="label">{k}</dt>
              <dd className="num text-[22px] font-semibold text-white tracking-tight">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Index of modules ──────────────────────────────── */}
      <section aria-labelledby="index-title" className="space-y-7">
        <header className="space-y-5">
          <div className="rule-num" aria-hidden>
            <span className="rule-num__plate">ÍNDICE · 01—04</span>
          </div>
          <div className="flex items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="eyebrow">Índice</span>
              <h2 id="index-title" className="h-section">Contenido del software</h2>
            </div>
            <span className="num text-[11px] text-[var(--muted-2)] tracking-[0.25em] hidden md:inline">
              4 módulos
            </span>
          </div>
        </header>

        <ol className="divide-rule">
          {modules.map(({ href, n, title, desc, formula, icon: Icon, tag }) => (
            <li key={href}>
              <Link
                href={href}
                className="group block py-7 transition-colors duration-150 hover:bg-white/[.015] -mx-4 px-4 rounded-[var(--r-md)]"
              >
                <div className="grid grid-cols-12 gap-5 md:gap-6 items-start">
                  {/* Number + icon column */}
                  <div className="col-span-12 md:col-span-2 flex md:flex-col items-center md:items-start gap-3">
                    <span className="num text-[34px] md:text-[42px] font-light leading-none text-[var(--muted-2)] group-hover:text-[var(--accent)] transition-colors">
                      {n}
                    </span>
                    <span className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)]/60 text-[var(--muted)] group-hover:text-[var(--accent-2)] group-hover:border-[var(--border-strong)] transition-colors">
                      <Icon className="h-[15px] w-[15px]" />
                    </span>
                  </div>

                  {/* Title + description */}
                  <div className="col-span-12 md:col-span-7 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[18px] md:text-[19px] font-semibold tracking-tight text-white group-hover:text-white">
                        {title}
                      </h3>
                    </div>
                    <p className="text-[13.5px] text-[var(--muted)] leading-[1.65] max-w-xl">
                      {desc}
                    </p>
                    <div className="pt-2 text-[11px] text-[var(--muted-2)] uppercase tracking-[0.16em]">
                      {tag}
                    </div>
                  </div>

                  {/* Formula column */}
                  <div className="col-span-12 md:col-span-3 flex md:justify-end">
                    <div className="inline-flex items-center px-3.5 py-2.5 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)]/70 text-[13px] text-[var(--muted)] group-hover:border-[var(--border-strong)] group-hover:text-white transition-colors">
                      <InlineMath math={formula} />
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </section>

    </div>
  );
}
