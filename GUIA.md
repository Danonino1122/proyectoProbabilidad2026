# 📚 Guía del Proyecto — ProbaLab

Esta guía explica **qué hace cada archivo** y **por qué está así**, pensada para que entiendas el código y puedas defenderlo en la exposición.

---

## 🏗️ ¿Qué es este proyecto?

Es una **aplicación web** hecha con **Next.js** (un framework de React). Funciona en el navegador, es rápida, se ve profesional y se puede desplegar gratis en internet si quieres.

### Stack (tecnologías usadas)

| Tecnología | ¿Para qué sirve? |
|---|---|
| **Next.js + React** | Estructura de la aplicación y componentes reutilizables |
| **TypeScript** | JavaScript con tipos — evita errores antes de ejecutar |
| **Tailwind CSS** | Estilos rápidos escritos directo en el HTML |
| **Plotly.js** | Librería de gráficas interactivas (se puede hacer zoom, hover, etc.) |
| **KaTeX** | Renderiza fórmulas matemáticas como LaTeX |
| **lucide-react** | Íconos |

---

## 📁 Estructura de carpetas

```
C:\ProyectoProbabilidad\
│
├── src/
│   ├── app/                    ← cada carpeta = una ruta/página
│   │   ├── layout.tsx          ← plantilla común a todas las páginas
│   │   ├── page.tsx            ← página de inicio "/"
│   │   ├── globals.css         ← estilos globales (colores, tema oscuro)
│   │   ├── varianza/page.tsx   ← módulo de varianza  "/varianza"
│   │   ├── valor-esperado/page.tsx
│   │   ├── normal/page.tsx
│   │   ├── t-student/page.tsx  ← módulo t de Student  "/t-student"
│   │   └── problemas/page.tsx
│   │
│   ├── components/             ← piezas de UI reutilizables
│   │   ├── Sidebar.tsx         ← menú lateral izquierdo
│   │   ├── PlotClient.tsx      ← wrapper de Plotly
│   │   └── ui/                 ← botones, cards, inputs
│   │
│   └── lib/                    ← lógica/matemáticas sin UI
│       ├── stats.ts            ← media, varianza, E(X)...
│       ├── normal.ts           ← Φ(z), inversa, densidad
│       ├── tstudent.ts         ← densidad, acumulada e inversa de la t
│       └── utils.ts            ← helpers (cn, parseNumberList, fmt)
│
├── package.json                ← lista de dependencias
└── GUIA.md                     ← este archivo
```

**Regla de oro:** Next.js convierte automáticamente las carpetas dentro de `src/app/` en URLs. Así que `src/app/varianza/page.tsx` es la página en `http://localhost:3000/varianza`.

---

## 🧠 Conceptos clave que vas a ver en el código

### 1. Componentes de React
Un **componente** es una función que devuelve HTML. Ejemplo:
```tsx
function Saludo() {
  return <h1>Hola mundo</h1>;
}
```

### 2. Hooks (useState, useMemo)
- `useState` — guarda un valor que puede cambiar (ej: lo que escribe el usuario).
- `useMemo` — recalcula algo solo cuando cambian sus dependencias (evita cálculos innecesarios).

```tsx
const [raw, setRaw] = useState("12, 15, 14");  // dato editable
const data = useMemo(() => parseNumberList(raw), [raw]);  // se recalcula cuando "raw" cambia
```

### 3. Renderizado reactivo
Cuando el usuario escribe algo, React **recalcula automáticamente** todo lo que depende de ese dato y actualiza la pantalla. **Por eso el proyecto es dinámico**: no hay que recargar ni apretar un botón "calcular".

---

## 📐 El módulo de Varianza — explicado línea por línea

Archivo: `src/app/varianza/page.tsx`

### Paso 1: El usuario escribe los datos
```tsx
const [raw, setRaw] = useState(EXAMPLE);  // texto tal cual escribe
const data = useMemo(() => parseNumberList(raw), [raw]);  // array de números
```
`parseNumberList` está en `src/lib/utils.ts` — toma el texto `"12, 15, 14"` y devuelve `[12, 15, 14]`.

### Paso 2: Calculamos todo
```tsx
const m    = mean(data);            // media
const varS = varianceSample(data);  // varianza muestral  (÷ n−1)
const varP = variancePop(data);     // varianza poblacional (÷ n)
const sS   = stdSample(data);       // desviación estándar muestral
```

Las fórmulas viven en `src/lib/stats.ts`:

```ts
export function varianceSample(data: number[]): number {
  const n = data.length;
  const m = mean(data);
  return data.reduce((acc, x) => acc + (x - m) ** 2, 0) / (n - 1);
}
```

**¿Qué hace?** Aplica literalmente la fórmula matemática:
$$s^2 = \frac{1}{n-1}\sum (x_i - \bar{x})^2$$

### Paso 3: Mostramos los resultados
Con los componentes `<Stat>` (las tarjetas con números grandes) y una tabla que muestra cada `xᵢ`, `xᵢ − x̄`, y `(xᵢ − x̄)²`.

### Paso 4: Graficamos con Plotly
```tsx
<PlotClient data={[histo]} layout={...} />
```
Un histograma con una línea vertical en la media.

### Paso 5: Fórmulas matemáticas bonitas con KaTeX
```tsx
<BlockMath math={`s^2 = \\frac{${sumSq}}{${n-1}} = ${varS}`} />
```
`BlockMath` convierte texto LaTeX en una fórmula matemática renderizada en pantalla.

---

## 🎲 El módulo de Valor Esperado

Archivo: `src/app/valor-esperado/page.tsx`

### Idea
El usuario mete una tabla de valores `X` y probabilidades `P(X)`. Calculamos:

$$E(X) = \sum x_i \cdot P(x_i)$$
$$Var(X) = \sum (x_i - \mu)^2 \cdot P(x_i)$$

### Validación importante
```tsx
const isValid = xs.length > 0 && Math.abs(sumP - 1) < 1e-6 && ps.every(p => p >= 0);
```
**Solo calculamos si las probabilidades suman 1** (regla fundamental de probabilidad). Si no, mostramos aviso rojo.

---

## 🔔 El módulo de Normal Estándar

Archivo: `src/app/normal/page.tsx` + lógica en `src/lib/normal.ts`

### El problema
La función de distribución acumulada Φ(z) no tiene fórmula cerrada:

$$\Phi(z) = \int_{-\infty}^{z} \frac{1}{\sqrt{2\pi}} e^{-t^2/2} \, dt$$

Así que se usa una **aproximación numérica** (Abramowitz & Stegun, error menor a 7.5×10⁻⁸):

```ts
export function cdfNormal(z: number): number {
  // ... usa la función de error erf con constantes pre-calculadas
}
```

Es la misma aproximación que usan las calculadoras y Excel. **Precisión: 7 decimales.**

### 4 tipos de probabilidad
| Tipo | Fórmula |
|---|---|
| `P(Z < a)` | Φ(a) |
| `P(Z > a)` | 1 − Φ(a) |
| `P(a < Z < b)` | Φ(b) − Φ(a) |
| `P(Z<a o Z>b)` | Φ(a) + 1 − Φ(b) |

### La gráfica
Plotly dibuja:
1. La curva de densidad (campana azul)
2. Un área sombreada morada según el modo elegido
3. Líneas verticales punteadas en `a` y `b`

Todo se **recalcula en vivo** cuando mueves los valores.

---

## 📈 El módulo de t de Student

Archivo: `src/app/t-student/page.tsx` + lógica en `src/lib/tstudent.ts`

### ¿Por qué existe esta distribución?
Para calcular probabilidades sobre la media usamos $Z = \frac{\bar{X} - \mu}{\sigma/\sqrt{n}}$, pero eso
exige **conocer σ**. En la práctica casi nunca se conoce: se estima con la desviación muestral `s`.
Al sustituirla, el estadístico deja de ser normal y pasa a seguir una **t de Student**:

$$T = \frac{\bar{X} - \mu}{s/\sqrt{n}} \sim t_{\nu}, \qquad \nu = n - 1$$

La `t` es acampanada y simétrica como la normal, pero con **colas más pesadas**: refleja la
incertidumbre extra de haber estimado σ. Por eso sus valores críticos son siempre **mayores** que
los de `z`, y el intervalo de confianza sale más ancho.

### Grados de libertad (ν)
Es el único parámetro de la distribución. Con una muestra de tamaño `n` se usa **ν = n − 1**
(se pierde un grado de libertad al estimar la media). Cuanto mayor es ν, más se parece la `t` a la
normal — de hecho $t_{\nu} \to N(0,1)$ cuando $\nu \to \infty$. Esto se ve en vivo en la gráfica:
la curva `t` (cian) está superpuesta a la N(0,1) (punteada gris), y al subir ν se van juntando.

### El problema técnico
La acumulada de la `t` tampoco tiene fórmula cerrada, y aquí ni siquiera basta una aproximación
tipo erf. Se resuelve con la **función beta incompleta regularizada**:

$$F(t;\nu) = 1 - \tfrac{1}{2} I_{x}\!\left(\tfrac{\nu}{2}, \tfrac{1}{2}\right), \qquad x = \frac{\nu}{\nu + t^2} \quad (t > 0)$$

En `src/lib/tstudent.ts` eso se implementa en tres piezas:

| Función | Qué hace |
|---|---|
| `lnGamma(x)` | ln Γ(x) por la aproximación de **Lanczos** (la fórmula de la densidad tiene dos gammas) |
| `regularizedIncompleteBeta(a,b,x)` | Iₓ(a,b) por **fracción continua** (método modificado de Lentz) |
| `invT(p, ν)` | El valor crítico K, por **bisección** sobre la acumulada |

La inversa se hace por bisección porque `F` es continua y estrictamente creciente: se parte el
intervalo a la mitad unas 300 veces hasta clavar el valor. Es lento en teoría e instantáneo en la
práctica, y sobre todo **es fácil de explicar y de verificar**.

> **Precisión comprobada:** los valores que produce coinciden con la tabla t impresa en los 3
> decimales que la tabla trae (ν = 1, 5, 10, 20, 30, 60, 120). Con ν = 100000 devuelve 1.9600,
> que es exactamente el `z` de la normal — justo lo que debe pasar.

### Lo que muestra la página
- **Modo directo** (dado t, calcula la probabilidad) e **inverso** (dado p, calcula K), igual que
  el módulo de la normal — los 7 modos son los mismos, para que se usen igual.
- **Comparación con z**: en modo inverso muestra cuánto excede el valor `t` al `z` equivalente.
  Con ν = 10 y 95%: t = 2.2281 contra z = 1.96, o sea 0.268 más ancho.
- **Media y varianza**: `E(T) = 0` solo si ν > 1, y `Var(T) = ν/(ν−2)` solo si ν > 2. Con ν = 1
  (que es la distribución de Cauchy) la página muestra **"No existe"** — no es un error, es un
  resultado real y vale la pena mencionarlo en la exposición.
- **Tabla de valores críticos** generada al vuelo para el ν elegido: es el renglón de la tabla t
  impresa, pero calculado en el momento.

---

## 📚 El módulo de Problemas

Archivo: `src/app/problemas/page.tsx`

### Estructura
Un array `problemas` con 10 objetos:
```ts
{
  n: 1,
  titulo: "Calificaciones de un examen",
  enunciado: "...",
  datos: "μ = 70, σ = 10, x = 85",
  respuesta: "P(X < 85) ≈ 0.9332",
  respuestaTex: "..." // opcional, fórmula en LaTeX
}
```

### Funcionalidad
- Botón **"Ver respuesta"** que esconde/muestra el resultado (usa `useState` con un objeto).
- El ícono cambia entre 👁️ y 👁️‍🗨️.

> Actualmente solo el problema 1 está listo. Los otros 9 son placeholders — los definiremos juntos.

---

## 🎨 Sobre el diseño

### Tema oscuro profesional
Todos los colores están centralizados en `globals.css` como **variables CSS**:

```css
--background: #0a0a0f;  /* fondo casi negro */
--surface: #111118;     /* tarjetas */
--border: #24242e;      /* bordes sutiles */
--accent: #7c5cff;      /* violeta — color principal */
--accent-2: #22d3ee;    /* cian — color secundario */
--muted: #8b8b97;       /* texto secundario */
```

Cambiar un color aquí lo cambia en TODA la app.

### Truco visual: bordes con gradiente
La clase `.card-gradient` usa dos backgrounds apilados para crear un borde con gradiente (morado → cian → transparente). Es lo que le da ese look "pro" a las tarjetas.

### Iconos
`lucide-react` — es la misma librería que usan Vercel, Linear y muchas apps modernas.

---

## 🚀 Cómo correr el proyecto

En la terminal (desde `C:\ProyectoProbabilidad`):

```bash
npm run dev       # modo desarrollo (con hot reload)
npm run build     # compila para producción
npm run start     # corre la versión compilada
``` 

Abre: `http://localhost:3000`

---

## 📝 Para la exposición — qué destacar

1. **Es dinámica**: cualquier valor que meta el profesor funciona en el momento.
2. **Muestra el paso a paso**: no es una caja negra, ves cada cuenta.
3. **Fórmulas matemáticamente correctas** (LaTeX vía KaTeX).
4. **Gráficas interactivas** (hover, zoom con Plotly).
5. **Aproximaciones numéricas probadas** (Φ con Abramowitz-Stegun, 7 decimales de precisión).
6. **Código limpio y separado**: matemáticas en `/lib`, interfaz en `/app`, componentes reutilizables en `/components`.

---

## ❓ Si algo no entiendes

Pregúntame en cualquier momento, especialmente antes de la exposición. Te puedo:
- Explicar cualquier función más a fondo
- Hacer un "ensayo" de la exposición donde yo hago de profesor
- Agregar comentarios línea por línea en el código que más te cueste
