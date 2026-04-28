"use client";

import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";
import { BlockMath, InlineMath } from "react-katex";

interface Problema {
  n: number;
  titulo: string;
  enunciado: string;
  datos?: string;
  respuesta: string;
  respuestaTex?: string;
}

// TODO: reemplazar por los 10 problemas oficiales elegidos por el alumno
const problemas: Problema[] = [
  {
    n: 1,
    titulo: "Calificaciones de un examen",
    enunciado:
      "Las calificaciones de un examen siguen una distribución normal con media 70 y desviación estándar 10. ¿Cuál es la probabilidad de que un estudiante tenga una calificación menor a 85?",
    datos: "μ = 70, σ = 10, x = 85",
    respuesta: "P(X < 85) ≈ 0.9332",
    respuestaTex: "P(X<85)=P\\!\\left(Z<\\tfrac{85-70}{10}\\right)=\\Phi(1.5)\\approx 0.9332",
  },
  // Placeholders 2-10
  ...Array.from({ length: 9 }, (_, i) => ({
    n: i + 2,
    titulo: `Problema ${i + 2} (pendiente)`,
    enunciado: "Este problema se completará próximamente.",
    respuesta: "—",
  })),
];

export default function ProblemasPage() {
  const [visible, setVisible] = useState<Record<number, boolean>>({});

  const toggle = (n: number) => setVisible(v => ({ ...v, [n]: !v[n] }));

  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs uppercase tracking-wider text-[var(--accent)] mb-2">Módulo 4</div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Colección de problemas</h1>
        <p className="text-[var(--muted)] mt-2 max-w-2xl">
          10 problemas resueltos usando la distribución normal estándar. Haz clic en{" "}
          <strong className="text-white">Ver respuesta</strong> para revelar el resultado.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {problemas.map(p => (
          <Card key={p.n}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[var(--accent)]/20 border border-[var(--accent)]/30 grid place-items-center text-sm font-semibold text-[var(--accent)]">
                  {p.n}
                </div>
                <CardTitle className="text-base">{p.titulo}</CardTitle>
              </div>
              <CardDescription className="mt-3">{p.enunciado}</CardDescription>
              {p.datos && (
                <div className="mt-2 text-xs font-mono text-[var(--accent-2)]">{p.datos}</div>
              )}
            </CardHeader>

            <Button variant="secondary" onClick={() => toggle(p.n)}>
              {visible[p.n] ? <><EyeOff className="h-4 w-4" /> Ocultar</> : <><Eye className="h-4 w-4" /> Ver respuesta</>}
            </Button>

            {visible[p.n] && (
              <div className="mt-4 p-4 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10">
                {p.respuestaTex && <BlockMath math={p.respuestaTex} />}
                <div className="text-sm"><strong>Respuesta:</strong> {p.respuesta}</div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-sm text-yellow-200">
        <strong>Nota:</strong> Los problemas 2 a 10 son placeholders. Los reemplazaremos con
        enunciados definitivos en la siguiente iteración.
      </div>
    </div>
  );
}
