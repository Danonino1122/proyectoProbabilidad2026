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
│   │   ├── anova/page.tsx      ← módulo de ANOVA      "/anova"
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
│       ├── special.ts          ← lnGamma y beta incompleta (las usan la t y la F)
│       ├── fisher.ts           ← distribución F, valores críticos
│       ├── anova.ts            ← sumas de cuadrados y tabla ANOVA
│       ├── lsd.ts              ← LSD de Fisher, comparaciones por pares
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

## 🧪 El módulo de ANOVA

Archivos: `src/app/anova/page.tsx`, con la lógica repartida en `src/lib/anova.ts`
(las sumas de cuadrados), `src/lib/fisher.ts` (la distribución F) y
`src/lib/special.ts` (las funciones matemáticas compartidas).

### La idea en una frase
ANOVA responde **"¿estas medias son realmente distintas, o la diferencia es casualidad?"**
comparando varios grupos a la vez. Y lo hace **partiendo la variación total en dos pedazos**.

### Las tres sumas (notación de clase)

| Sigla | Nombre | Fórmula | Qué mide |
|---|---|---|---|
| **STC** | Suma total de cuadrados | $\sum\sum(y_{ij} - \bar{y}_{..})^2$ | Cuánto se alejan **todas** las observaciones del promedio general |
| **SCT** | Suma de cuadrados del tratamiento | $n\sum(\bar{y}_{i.} - \bar{y}_{..})^2$ | Qué tan separadas están las medias de los grupos — variación **explicada** |
| **SCE** | Suma de cuadrados del error | $\sum\sum(y_{ij} - \bar{y}_{i.})^2$ | Dispersión **dentro** de cada grupo — variación **no explicada** |

> ⚠️ **Ojo con las siglas.** Muchos libros usan SCT para la suma *total*. Nosotros seguimos la
> notación del profesor, donde **STC es la total** y **SCT es la del tratamiento**. Si consultas
> otra fuente, revisa primero qué significa cada letra ahí.

La relación clave, que el módulo muestra como verificación:

$$STC = SCT + SCE$$

Los grados de libertad se reparten igual: $(N-1) = (k-1) + (N-k)$.

### De las sumas al estadístico F
Dividiendo cada suma entre sus grados de libertad se obtienen los **cuadrados medios**, y su
cociente es el estadístico de prueba:

$$CMT = \frac{SCT}{k-1}, \qquad CME = \frac{SCE}{N-k}, \qquad F = \frac{CMT}{CME}$$

**Por qué funciona:** si el tratamiento no influyera, ambos cuadrados medios estarían estimando
lo mismo y F rondaría 1. Mientras más grande sea F, más difícil es explicar las diferencias por
puro azar. Si F supera el valor crítico, se rechaza $H_0$.

### El detalle técnico que vale la pena contar
La F se calcula con la **misma función beta incompleta regularizada** que ya usaba la t de Student:

$$P(F \leq x) = I_{\frac{d_1 x}{d_1 x + d_2}}\left(\frac{d_1}{2}, \frac{d_2}{2}\right)$$

Por eso al agregar ANOVA se movió esa función (junto con `lnGamma`) de `tstudent.ts` a un archivo
nuevo, **`special.ts`**, y ahora la comparten la t y la F. No hubo que programar matemática nueva:
solo conectar la que ya estaba probada. Es un buen ejemplo de *reutilizar en vez de duplicar*.

> **Precisión comprobada:** los valores críticos coinciden con la tabla F impresa
> (F₀.₀₅(2,12) = 3.885, F₀.₀₁(3,20) = 4.938, etc.), y el ejemplo de clase de los automóviles
> reproduce exactamente SCT = 70, SCE = 24, STC = 94 y F = 17.5.

### Lo que muestra la página
- **Captura dinámica de tratamientos**: agregar, quitar y renombrar grupos. Acepta **tamaños
  desiguales** (cuando no están balanceados, la fórmula del SCT cambia sola a $\sum n_i(\cdots)^2$).
- **El ejemplo de clase precargado** (Malibu / Altima / Passat) para comparar contra el cuaderno.
- **Tabla ANOVA** con las tres filas de siempre y la verificación STC = SCT + SCE.
- **Valor p**, que a mano es imposible: con la tabla solo puedes decir "cae en la región de
  rechazo", aquí sale el número exacto.
- **Gráfica de los grupos** con sus medias (rombos) y la media global — hace *visible* por qué se
  rechaza o no.
- **Curva F con la región de rechazo sombreada**, y **α de captura libre**: acepta cualquier valor
  entre 0 y 1 (0.04, 0.025, 0.005…), con botones rápidos para 0.10, 0.05 y 0.01. Debajo del campo
  se muestra el nivel de confianza equivalente. Esto importa porque las tablas impresas solo traen
  unas pocas columnas de α, mientras que aquí el valor crítico se calcula para el que pidan.
- **Desarrollo paso a paso** con tus números ya sustituidos, igual que se hace en el pizarrón.

### Casos límite que el módulo maneja
- Si un grupo queda vacío, **se ignora** y se calcula con los demás.
- Con menos de 2 tratamientos, o sin grados de libertad para el error, avisa en vez de mostrar
  números sin sentido.
- Si no hay ninguna variación dentro de los grupos, CME = 0 y **F se va a infinito**. No es un
  error: es evidencia máxima, y la página lo muestra como ∞ y rechaza $H_0$.

### Lo que ANOVA **no** dice — y el LSD sí
Rechazar $H_0$ significa que **al menos una** media difiere, pero **no cuál**. Eso lo responde el
**procedimiento LSD de Fisher**, incluido en la misma página (`src/lib/lsd.ts`).

El LSD calcula un umbral y compara las medias **de dos en dos**:

$$LSD = t_{\alpha/2,\;N-k}\sqrt{CME\left(\frac{1}{n_i} + \frac{1}{n_j}\right)}$$

$$\text{Se rechaza } H_0 \text{ del par si } |\bar{x}_i - \bar{x}_j| \geq LSD$$

Para cada par se muestran sus hipótesis ($H_0: \mu_i = \mu_j$ contra $H_a: \mu_i \neq \mu_j$), la
sustitución numérica y la conclusión en palabras, igual que se escribe a mano.

**Dos cosas que vale la pena poder explicar:**

1. **Por qué usa el CME y no la varianza de cada par.** Esa es justo la ventaja del LSD: el CME
   estima el error con **todas** las observaciones, así que tiene $N-k$ grados de libertad en vez
   de los pocos que daría una t aplicada a dos grupos sueltos. Es una prueba más precisa.
2. **Por qué solo se aplica si el ANOVA rechazó $H_0$.** Comparar todos los pares sin ese filtro
   infla la probabilidad de encontrar diferencias que en realidad son azar. Si el ANOVA no rechazó,
   la página calcula igual pero muestra una advertencia.

> **Verificado contra los ejercicios de clase (Actividad 3.2):** el programa reproduce ambos.
> En el de los tres tratamientos: SCT = 570, SCE = 66, STC = 636, F = 51.8182 y LSD = 3.232.
> En el de las cuatro máquinas: SCT = 57.765, SCE = 19.26, STC = 77.025, F = 19.9948, LSD = 1.182,
> y de las 6 comparaciones la única que no se rechaza es M₂ vs M₃ (|9.1 − 9.9| = 0.8 < LSD),
> exactamente como salió a mano.

### Conclusiones dinámicas
Hay un campo **"¿Qué se compara en el problema?"** donde se escribe el sustantivo del enunciado
(máquinas, automóviles, fertilizantes…). La decisión y las conclusiones se redactan con esa
palabra: *"hay evidencia de que al menos una media de entre las 4 **máquinas** es distinta"*. Si se
deja vacío, usa "tratamientos". Los nombres de cada grupo también son editables, así que las
comparaciones salen como "M₁ vs M₂" o "Malibu vs Passat" según se capturen.

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
