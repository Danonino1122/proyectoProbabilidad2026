import Link from "next/link";
import { Sigma, Calculator, BellRing, BookOpen, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";

const modules = [
  { href: "/varianza", title: "Varianza", desc: "Calcula la varianza y desviación estándar de un conjunto de datos.", icon: Sigma },
  { href: "/valor-esperado", title: "Valor Esperado", desc: "Obtén E(X) y Var(X) de una variable aleatoria discreta.", icon: Calculator },
  { href: "/normal", title: "Normal Estándar", desc: "Distribución N(0,1) con área sombreada interactiva.", icon: BellRing },
  { href: "/problemas", title: "Problemas", desc: "10 problemas resueltos con distribución normal estándar.", icon: BookOpen },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface-2)] to-[var(--surface)] p-10">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-[var(--accent)]/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[var(--accent-2)]/15 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--muted)] mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            Proyecto de clase · Probabilidad y Estadística
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            Calcula probabilidades y visualiza{" "}
            <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">
              distribuciones
            </span>{" "}
            de forma interactiva.
          </h1>
          <p className="mt-4 text-lg text-[var(--muted)]">
            Una herramienta dinámica para calcular varianza, valor esperado y graficar la
            distribución Normal estándar con pasos explicativos.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)] mb-4">Módulos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(({ href, title, desc, icon: Icon }) => (
            <Link key={href} href={href} className="group">
              <Card className="h-full transition-all group-hover:translate-y-[-2px] group-hover:glow">
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 grid place-items-center text-[var(--accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{title}</h3>
                      <ArrowRight className="h-4 w-4 text-[var(--muted)] group-hover:text-white group-hover:translate-x-0.5 transition" />
                    </div>
                    <p className="text-sm text-[var(--muted)] mt-1">{desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
