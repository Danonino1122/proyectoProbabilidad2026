"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, ListChecks } from "lucide-react";
import { BlockMath } from "react-katex";

interface Problema {
  n: number;
  titulo: string;
  enunciado: string;
  /** Lo que hay que entrar en el módulo Normal para verificarlo */
  verificar: string;
  /** Resultado en lenguaje natural */
  respuesta: string;
  /** Desarrollo en LaTeX (1-3 líneas) */
  desarrolloTex: string[];
  /** Etiqueta del tipo de problema */
  tipo: "Directo" | "Inverso";
}

const problemas: Problema[] = [
  {
    n: 1,
    titulo: "Área a la izquierda",
    enunciado:
      "Dada una distribución normal estándar, calcule el área bajo la curva que se localiza a la izquierda de z = −1.39.",
    verificar: "Modo: P(Z < a) · a = −1.39",
    respuesta: "P(Z < −1.39) ≈ 0.0823",
    desarrolloTex: [
      "P(Z < -1.39) = \\Phi(-1.39) \\approx 0.0823",
    ],
    tipo: "Directo",
  },
  {
    n: 2,
    titulo: "Área a la derecha",
    enunciado:
      "Dada una distribución normal estándar, calcule el área bajo la curva que se localiza a la derecha de z = 1.84.",
    verificar: "Modo: P(Z > a) · a = 1.84",
    respuesta: "P(Z > 1.84) ≈ 0.0329",
    desarrolloTex: [
      "P(Z > 1.84) = 1 - \\Phi(1.84) = 1 - 0.9671 \\approx 0.0329",
    ],
    tipo: "Directo",
  },
  {
    n: 3,
    titulo: "Área entre dos valores negativos",
    enunciado:
      "Dada una distribución normal estándar, calcule el área bajo la curva que se localiza entre z = −2.16 y z = −0.65.",
    verificar: "Modo: P(a < Z < b) · a = −2.16, b = −0.65",
    respuesta: "P(−2.16 < Z < −0.65) ≈ 0.2424",
    desarrolloTex: [
      "P(-2.16 < Z < -0.65) = \\Phi(-0.65) - \\Phi(-2.16)",
      "= 0.2578 - 0.0154 \\approx 0.2424",
    ],
    tipo: "Directo",
  },
  {
    n: 4,
    titulo: "Área entre dos valores positivos",
    enunciado:
      "Dada una distribución normal estándar, calcule el área bajo la curva que se localiza entre z = 0.50 y z = 1.50.",
    verificar: "Modo: P(a < Z < b) · a = 0.50, b = 1.50",
    respuesta: "P(0.50 < Z < 1.50) ≈ 0.2417",
    desarrolloTex: [
      "P(0.50 < Z < 1.50) = \\Phi(1.50) - \\Phi(0.50)",
      "= 0.9332 - 0.6915 \\approx 0.2417",
    ],
    tipo: "Directo",
  },
  {
    n: 5,
    titulo: "Área a la derecha de un valor negativo",
    enunciado:
      "Dada una distribución normal estándar, calcule el área bajo la curva que se localiza a la derecha de z = −0.70.",
    verificar: "Modo: P(Z > a) · a = −0.70",
    respuesta: "P(Z > −0.70) ≈ 0.7580",
    desarrolloTex: [
      "P(Z > -0.70) = 1 - \\Phi(-0.70) = 1 - 0.2420 \\approx 0.7580",
    ],
    tipo: "Directo",
  },
  {
    n: 6,
    titulo: "Área a la izquierda de un valor positivo",
    enunciado:
      "Dada una distribución normal estándar, calcule el área bajo la curva que se localiza a la izquierda de z = 2.05.",
    verificar: "Modo: P(Z < a) · a = 2.05",
    respuesta: "P(Z < 2.05) ≈ 0.9798",
    desarrolloTex: [
      "P(Z < 2.05) = \\Phi(2.05) \\approx 0.9798",
    ],
    tipo: "Directo",
  },
  {
    n: 7,
    titulo: "Área entre un valor negativo y uno positivo",
    enunciado:
      "Dada una distribución normal estándar, calcule el área bajo la curva que se localiza entre z = −1.50 y z = 2.00.",
    verificar: "Modo: P(a < Z < b) · a = −1.50, b = 2.00",
    respuesta: "P(−1.50 < Z < 2.00) ≈ 0.9104",
    desarrolloTex: [
      "P(-1.50 < Z < 2.00) = \\Phi(2.00) - \\Phi(-1.50)",
      "= 0.9772 - 0.0668 \\approx 0.9104",
    ],
    tipo: "Directo",
  },
  {
    n: 8,
    titulo: "Área en las dos colas",
    enunciado:
      "Dada una distribución normal estándar, calcule el área bajo la curva que se localiza a la izquierda de z = −1.96 o a la derecha de z = 1.96.",
    verificar: "Modo: P(Z < a ∪ Z > b) · a = −1.96, b = 1.96",
    respuesta: "P(Z < −1.96 ∪ Z > 1.96) ≈ 0.0500",
    desarrolloTex: [
      "P(Z < -1.96) + P(Z > 1.96)",
      "= \\Phi(-1.96) + \\bigl(1 - \\Phi(1.96)\\bigr)",
      "= 0.0250 + 0.0250 \\approx 0.0500",
    ],
    tipo: "Directo",
  },
  {
    n: 9,
    titulo: "Valor crítico K dado un área a la derecha",
    enunciado:
      "Calcule el valor de K tal que P(Z > K) = 0.2946.",
    verificar: "Modo: P(Z > K) = p · p = 0.2946",
    respuesta: "K ≈ 0.54",
    desarrolloTex: [
      "P(Z > K) = 0.2946",
      "\\Rightarrow\\; P(Z < K) = 1 - 0.2946 = 0.7054",
      "K = \\Phi^{-1}(0.7054) \\approx 0.54",
    ],
    tipo: "Inverso",
  },
  {
    n: 10,
    titulo: "Control de calidad en fábrica de tornillos",
    enunciado:
      "Una fábrica de piezas mecánicas produce tornillos cuyo peso sigue una distribución normal con media μ = 50 g y desviación estándar σ = 4 g. Para cumplir con los estándares de calidad, un tornillo se considera defectuoso si pesa menos de 44 g y se descarta como desperdicio. ¿Qué porcentaje del lote se desperdicia?",
    verificar: "Modo: P(Z < a) · a = −1.50 (estandarizar X = 44)",
    respuesta: "≈ 6.68 % del lote (P(Z < −1.50) ≈ 0.0668)",
    desarrolloTex: [
      "Z = \\dfrac{X - \\mu}{\\sigma} = \\dfrac{44 - 50}{4} = -1.50",
      "P(X < 44) = P(Z < -1.50) = \\Phi(-1.50) \\approx 0.0668",
      "\\Rightarrow\\; 6.68\\%\\text{ del lote es desperdicio}",
    ],
    tipo: "Directo",
  },
];

export default function ProblemasPage() {
  const [visible, setVisible] = useState<Record<number, boolean>>({});
  const toggle = (n: number) => setVisible(v => ({ ...v, [n]: !v[n] }));

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-3 max-w-2xl">
        <span className="eyebrow eyebrow--accent">04 · Práctica</span>
        <h1 className="h-page">Colección de problemas</h1>
        <p className="text-[14.5px] text-[var(--muted)] leading-relaxed">
          Diez problemas con la distribución normal. Nueve son de cálculo{" "}
          <strong className="text-white font-medium">directo</strong> (área dado z, incluyendo un caso{" "}
          <strong className="text-white font-medium">aplicado</strong> con contexto real) y uno de cálculo{" "}
          <strong className="text-white font-medium">inverso</strong> (valor crítico K dado un área).
          Haz clic en <strong className="text-white font-medium">Ver respuesta</strong> para revelar
          el desarrollo y el resultado.
        </p>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-[12.5px] text-[var(--muted-2)]">
          <span className="inline-flex items-center gap-2">
            <ListChecks className="h-3.5 w-3.5" />
            <span className="num text-white">10</span> / {problemas.length} resueltos
          </span>
          <span className="h-3 w-px bg-[var(--border)]" />
          <span><span className="num text-white">9</span> directos · <span className="num text-white">1</span> inverso</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {problemas.map(p => (
          <Card key={p.n} pad="md">
            {/* head: number + tipo + title */}
            <div className="flex items-start gap-3.5">
              <div className={
                "shrink-0 grid place-items-center h-9 w-9 rounded-[8px] border num text-[13px] font-semibold " +
                (p.tipo === "Directo"
                  ? "bg-[var(--accent)]/12 border-[var(--accent)]/35 text-[var(--accent)]"
                  : "bg-[var(--accent-2)]/12 border-[var(--accent-2)]/40 text-[var(--accent-2)]")
              }>
                {String(p.n).padStart(2, "0")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={
                    "text-[10.5px] uppercase tracking-[0.16em] font-medium " +
                    (p.tipo === "Directo" ? "text-[var(--accent)]" : "text-[var(--accent-2)]")
                  }>
                    {p.tipo}
                  </span>
                </div>
                <h3 className="h-card text-white leading-snug">{p.titulo}</h3>
              </div>
            </div>

            {/* enunciado */}
            <p className="mt-4 text-[13.5px] text-[var(--muted)] leading-relaxed">{p.enunciado}</p>

            {/* cómo verificar (siempre visible) */}
            <div className="mt-4 px-3.5 py-2.5 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)]/50">
              <div className="text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted-2)] mb-1">
                Verificar en módulo Normal
              </div>
              <div className="num text-[12.5px] text-white">{p.verificar}</div>
            </div>

            {/* botón respuesta */}
            <div className="mt-4">
              <Button variant="secondary" size="sm" onClick={() => toggle(p.n)}>
                {visible[p.n]
                  ? <><EyeOff className="h-3.5 w-3.5" /> Ocultar</>
                  : <><Eye className="h-3.5 w-3.5" /> Ver respuesta</>}
              </Button>

              {visible[p.n] && (
                <div className="mt-4 p-4 rounded-[var(--r-md)] border border-[var(--accent)]/30 bg-[var(--accent)]/8 space-y-3">
                  <div className="text-[10.5px] uppercase tracking-[0.16em] text-[var(--accent)] font-medium">
                    Desarrollo
                  </div>
                  <div className="space-y-1.5">
                    {p.desarrolloTex.map((tex, i) => (
                      <BlockMath key={i} math={tex} />
                    ))}
                  </div>
                  <div className="pt-3 border-t border-[var(--accent)]/20">
                    <div className="text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)] mb-1">
                      Respuesta
                    </div>
                    <div className="num text-[14px] text-white font-medium">{p.respuesta}</div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
