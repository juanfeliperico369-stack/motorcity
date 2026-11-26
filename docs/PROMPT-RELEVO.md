# Prompt de relevo · El mundo 3D cenital con una sola cámara (fases B–E) y las muestras (26‑nov‑2026)

> **Cópialo entero a la IA que siga** (Claude Code, Codex, Gemini CLI, Antigravity o Cursor). Si es un chat sin terminal, lee el § 9.
> El relevo anterior, el del «renacimiento cenital» con sus 5 fases, ya está hecho y publicado. Quedó como historial en `docs/relevos/PROMPT-RELEVO-2026-11-25-renacimiento-cenital.md`.

---

Eres la IA que sigue con **Motor City y sus juegos** sobre Medellín y el Valle de Aburrá. El autor pide **precisión**. Antes de cambiar nada:
- lee todo lo del § 2;
- resume en 5 líneas qué entendiste;
- haz **solo** lo que te toca.

Habla y escribe en **español de Colombia**.

## 1. La misión y la visión (no se distorsionan; solo el autor las cambia)
- **Un solo universo** de juegos sobre lugares reales, en un solo HTML, sin internet, para celulares modestos.
  - **De familia:** Juega EnCicla, El Metro y Run Scooter.
  - **Para adultos (18+):** Turno Cero, que vive solo en `motorcity`.
  - **Los motores:** Motor City (el motor) y el Motor del Valle (el mapa real que comparten EnCicla y El Metro).
- **El pedido vigente** (25 y 26‑nov), palabra por palabra en `docs/PEDIDO-DEL-AUTOR-2026-11-25.md`:
  - un mundo **enteramente 3D** en vista cenital, con **una sola cámara** centrada que se mueve, se acerca y se aleja hasta «casi tercera persona»;
  - **nada pintado en el suelo**;
  - el 2D y el pixel solo en los modos ya establecidos;
  - una carga sin huecos, con la fluidez de EnCicla como vara;
  - los controles a gusto.
- **Las muestras.** El autor va a mostrar los juegos **en dos días** (hacia el 28‑nov‑2026). Lo primero es que se vean **funcionales y profesionales**: nada que rompa lo que ya funciona.

## 2. Lee primero, en este orden
1. `CLAUDE.md` (o `AGENTS.md`/`GEMINI.md`) de cada repositorio.
2. `docs/PEDIDO-DEL-AUTOR-2026-11-25.md`: los pedidos P1–P13, lo hecho, el plan por fases y su **tabla de estado**.
3. `docs/VISION-Y-MISION.md`.
4. `CONTEXTO-RELEVO.md`: las últimas 3 entradas.
5. Las bitácoras:
   - `BicicletasUno/docs/BITACORA.md`;
   - `MetroZero/docs/BITACORA.md`;
   - `BITACORA.md` del motor.
6. `docs/propiedad-intelectual/README.md`: lo que es del autor y lo que no. Respeta el `AVISO-LEGAL.md`.

## 3. Los repositorios, las versiones y los enlaces (26‑nov‑2026)

| Juego | Repositorio | Versión publicada | Página | APK |
|---|---|---|---|---|
| Juega EnCicla | `BicicletasUno` | **3.11.0** (versionCode 31100) | https://juanfeliperico369-stack.github.io/BicicletasUno/ | https://juanfeliperico369-stack.github.io/BicicletasUno/descargas/JuegaEnCicla.apk |
| El Metro | `MetroZero` | **3.12.0** (versionCode 43) | https://juanfeliperico369-stack.github.io/MetroZero/ | https://juanfeliperico369-stack.github.io/MetroZero/el-metro.apk |
| Turno Cero (18+) | `motorcity` | **Motor City 5.5.1** | https://juanfeliperico369-stack.github.io/motorcity/dist/juegos/getaway.html | release `v5.5.1` de `motorcity` |
| Run Scooter | `RunRunZero` | con la copia del motor 5.5.1 | https://juanfeliperico369-stack.github.io/RunRunZero/ | https://juanfeliperico369-stack.github.io/RunRunZero/RunScooter.apk |

- **La rama de trabajo** en los cuatro es `ccr-4f6eeea5-yulqk1`. Si su PR ya se unió, arráncala de nuevo desde `main`. **Nunca** uses `push --force`.
- **Publicar:**
  - **EnCicla:** un PR a `main`, y `publicar.yml` publica solo si todo está en verde (build, K‑1, `tests/run.js` y la compuerta de 2 km). La APK sale con `android.yml` (`workflow_dispatch`), y después se copia a `gh-pages:descargas/JuegaEnCicla.apk`.
  - **El Metro:**
    - un PR a `main`, y después `apk.yml` (`workflow_dispatch`, release `v<versión>`);
    - luego, a mano, a `gh-pages`: copia los archivos de `dist/` (index, sw, manifest, íconos, TODO), los de `arte/` y la APK como `el-metro.apk`;
    - al final, comprueba con `node tools/verify-pages.mjs`.
  - **Motor City:** un PR a `main` con `motor-city-qa.yml` en verde, y después `apk-juegos.yml` (`workflow_dispatch`, release `v<VERSION>`).

## 4. Lo que está hecho (no lo repitas)
- **P2, la cámara única** en los tres juegos: cuatro acercamientos, con «casi tercera persona» detrás del rumbo. Sin GPU, el acercamiento máximo se limita.
- **P8, el guardián del sonido:** al salir de la app todo calla. En la APK lo avisa `MainActivity`.
- **P9, la portada viva** de EnCicla.
- **P11, 🏆 Escalafón** en la portada de EnCicla.
- **P6, la fase A:**
  - en EnCicla, la cola por prioridad con boceto;
  - en El Metro, la ventana por partes (3.11.1) y lo lejano por partes (3.11.2, el cambio en ~70 ms).
- **P13, 🧭 Turismo por el valle** en EnCicla 3.11.0 y en El Metro 3.12.0: 12 sitios con la estación más cercana, el minimapa y un botón para ir ahí.

## 5. Lo que sigue, en orden

### 5.0 Antes de las muestras (hasta el 28‑nov): pulir, no inventar
1. **Juega cada juego de principio a fin** en `412 × 860` con la skill `motor-city-qa-playwright`. Revisa:
   - la portada;
   - el menú;
   - el modo libre;
   - el modo turismo, con los botones «Ir ahí» e «Ir en bici»;
   - un turno o una misión;
   - pausar y volver;
   - salir de la app y volver: la música debe callar.

   Arregla **solo** lo que se rompa o se vea mal: textos cortados, botones encimados o pantallas en blanco.
2. **Las APK:** instálalas en un Android 7 o en un emulador. Comprueba que abren sin internet, que el sonido calla al salir y que el guardado se conserva.
3. **Nada de fases grandes antes de la muestra,** salvo que el autor lo pida.

### 5.1 Fase B · La fluidez (P7). Ya empezó en El Metro
- **Paso fijo con interpolación del dibujo** en El Metro y Turno Cero: la física a 60 Hz y el dibujo interpolado. Usa la sensación de EnCicla como vara.
- **Turno Cero:**
  - medir con `?medir` y llegar a p95 ≤ 20 ms en el celular;
  - quitar los picos del arranque: la cola por prioridad de la fase A para sus casillas, como en EnCicla.
- **Los resortes de la cámara** y menos latencia de entrada.
- **Dónde mirar:**
  - Turno Cero: `juegos/getaway/68-medir.js`;
  - El Metro: `src/js/96d-rendimiento.js` y `src/js/97e-ventana-por-partes.js`;
  - EnCicla: `src/js/99w-chunks-progresivos.js`.

### 5.2 Fase C · Los controles a tu gusto (P10)
- Sensibilidad y curva, y varios esquemas:
  - palanca fija o flotante;
  - botones;
  - deslizar;
  - inclinar el celular;
  - zurdo o diestro.
- Tamaño y opacidad de los botones.
- **Una recomendación al girar el celular:**
  - en vertical, una mano con la palanca abajo;
  - en horizontal, dos manos.
- Todo en el guardado, **sumando campos sin borrar ninguno**.

### 5.3 Fase D · Nada pintado en el suelo (P3, P5)
- Árboles, carros, postes, señales, bancas y estaciones como objetos 3D livianos, con instancias y niveles de detalle.
- Fachadas y techos con textura por zona, y sombras de contacto.
- El suelo lleva solo lo plano: vías, andenes, pasto y agua.

### 5.4 Fase E · Un solo mundo 3D en EnCicla (P1)
- Pasa el lienzo 2.5D de EnCicla a WebGL, como El Metro y Motor City, con el 2D solo de respaldo.
- Es la fase más grande. **Su orden lo decide el autor: pregúntale antes de empezarla.**

### 5.5 Fase F · «Un día en EnCicla» ⏸ SOLO PLAN
- **No la programes.** El autor dijo «hasta que no te diga que lo agreguemos lo dejamos ahí pendiente».
- El plan completo está en el § 4 del pedido.
- Además, la lámina parece material de EnCicla: necesita el permiso de su titular.

## 6. Reglas que no se negocian
- Un solo HTML, sin internet ni librerías nuevas; celulares modestos (Android 7 con WebView 119, iPhone 8 con iOS 16).
- **No romper los guardados:** `elmetro.v1` y los de EnCicla y Motor City.
- **No vuelvas a poner un selector de cámaras** ni cámaras de maqueta, panorámica, tercera o primera persona en el mundo. Los modos propios siguen:
  - Conduce el Metro y La Red;
  - las Carreras retro y el garaje de Turno Cero;
  - los minijuegos;
  - los miradores.
- **El mapa** solo se cambia en `BicicletasUno/motor-valle/`.
- **Turno Cero (18+)** solo en `motorcity`; nunca entra a los juegos de familia.
- **EnCicla:**
  - no cambies ni saltes la compuerta (`tests/benchmark-2km-gpt6.mjs`) sin el autor;
  - nunca publiques en rojo;
  - `gh-pages` conserva `/metro/` y `/descargas/`.
- **El Metro:** el HTML pesa 9,5 MB como máximo; el arte nuevo siempre va con respaldo procedural; la compilación quita los comentarios de línea completa.
- **Motor City:** los comentarios en `js/NN` van con `/* */`.
- **Seguridad y privacidad:**
  - nunca subas llaves;
  - no pongas datos personales del autor en los repositorios;
  - no pongas identificadores de modelos de IA en los commits.
- **Marcas ajenas** (EnCicla, Metro de Medellín…): no las registres, no las vendas y no agregues logos.

## 7. Las pruebas de cada repositorio (todas en verde antes de publicar)

| Repositorio | Comandos |
|---|---|
| **EnCicla** | `node tools/build.js`; `node tests/run.js` (sin correr pruebas pesadas al tiempo); `node tests/benchmark-2km-gpt6.mjs` (la compuerta) |
| **El Metro** | `node tools/build.mjs`; `node tools/test.mjs 100` (0 errores); `node tools/todo.mjs` |
| **Motor City** | `node motor.mjs construir`; `node motor.mjs prueba --navegador`; `node pruebas/medir.mjs` (en la CI lenta puede necesitar un segundo intento) |
| **Run Scooter** | `node tools/build.mjs`; `node tools/sim.mjs 100 240` |

## 8. Al terminar cada trabajo (obligatorio)
- **Escribe la bitácora** del repositorio: qué cambió, qué se probó y qué falta.
- **Deja tu entrada** en `CONTEXTO-RELEVO.md` del motor.
- **Pon al día la tabla de estado** del § 4 del pedido.
- **El informe al autor**, en 5–10 líneas: qué hiciste, cómo lo probaste, qué aprendiste y qué falta, con los enlaces y las APK.

## 9. Si eres un chat sin terminal (ChatGPT o Gemini en la web)
- No puedes compilar ni probar. Ayuda con lo que te toca en `docs/PEDIDOS-CHATGPT-5.0.md` o `docs/PEDIDOS-GEMINI-5.0.md`: textos, arte o diseño de controles.
- Entrega en un solo documento, con los nombres de archivo exactos.
- Un agente con terminal lo integra y lo prueba.
