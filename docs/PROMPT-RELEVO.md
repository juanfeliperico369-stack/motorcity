# Prompt de relevo · «Renacimiento cenital», fases 1 a 5 (24‑nov‑2026)

> **Cópialo entero a la IA que siga:** otra sesión de Claude, ChatGPT/Codex, Gemini/Antigravity, Cursor o cualquier otra.
> Lo escribió Claude al cerrar la Fase 0. El detalle está en:
> - `docs/AUDITORIA-FASE0-CENITAL.md` (la auditoría y el plan por archivo);
> - `reportes/2026-11-24-claude-fase0-cenital.md` (la evidencia);
> - `CONTEXTO-RELEVO.md` (§ 5, fila 18, y § 8).
>
> El prompt anterior (5.3.0) queda en la historia de git.

---

Vas a continuar **Motor City**: un motor de juegos en un solo HTML, sin internet, con mapas reales de Medellín, el Valle de Aburrá, Guatapé y Nueva York, y sus juegos.

**Tu trabajo nuevo es el «renacimiento cenital» que pidió el autor:**
- sanear el mapa del Valle (que ningún edificio quede encima de una calle);
- un cenital 2.5D/3D bello y legible en El Metro y en Juega EnCicla;
- un modo de carreras retro pseudo‑3D en Turno Cero.

La Fase 0 (auditoría y línea base) ya está hecha. Siguen las fases 1 a 5. **Cada fase termina con pruebas en verde y se detiene a pedir el OK del autor.** Nada de lo que ya funciona se puede romper.

## 0. Dónde está el trabajo
- **La Fase 0 está en la rama `ccr-408a25e1-xz3rl6` de `motorcity`.** Si `main` todavía no tiene `docs/AUDITORIA-FASE0-CENITAL.md`, parte de esa rama:

  `git fetch origin ccr-408a25e1-xz3rl6 && git checkout -b <tu-rama> origin/ccr-408a25e1-xz3rl6`
- **Trabaja en tu rama** en cada repositorio que toques: `ia/<tu-agente>/renacimiento-faseN`, o la que te asigne tu entorno.
  - A `main`, solo en avance rápido, con las pruebas en verde **y con el OK del autor**.
  - Nunca `push --force`.
  - No abras un pull request si el autor no lo pide.
- **Si no tienes los repositorios:** `git clone https://github.com/juanfeliperico369-stack/<repo>`. Los cuatro de la tabla son de la misma cuenta.

## 1. Los repositorios

| Repositorio | Qué es | Versión | Compilar | Probar |
|---|---|---|---|---|
| `motorcity` | El motor y **Turno Cero** (`juegos/getaway/`, 18+). Sus mundos MC4 salen de `geo/territorio.py`. | 5.3.1 | `node herramientas/construir.mjs` | `node pruebas/prueba.mjs --navegador` y la lista de `.github/workflows/motor-city-qa.yml` |
| `BicicletasUno` | **Juega EnCicla** (familia) y la **fuente de verdad del Motor del Valle** (`motor-valle/`, la tubería de datos del mapa, 1.2.0) | 3.7.0 | `node tools/build.js` | `node tests/run.js`, `node tests/regresion-encicla.js` y la compuerta `node tests/benchmark-2km-gpt6.mjs --cpu=4 --assert` |
| `MetroZero` | **El Metro** (familia), con una copia del Motor del Valle y capas propias en `tools/` | 3.8.0 | `node tools/build.mjs` | `node tools/test.mjs 100` (0 errores); al terminar, `node tools/todo.mjs` |
| `RunRunZero` | Run Scooter (familia). **No entra en este trabajo.** | — | `node tools/build.mjs` | `node tools/sim.mjs 100 240` |

**Comandos del Motor del Valle** (desde la raíz de BicicletasUno; la copia de MetroZero funciona igual):

| Comando | Qué hace |
|---|---|
| `node motor-valle/motor.mjs fuentes` | Baja las fuentes: Overture `2026-10-21.0`, las capas oficiales y el relieve SRTM. Ocupan unos 190 MB en `motor-valle/geo/cache/` y **no se suben**. |
| `node motor-valle/motor.mjs encicla [RUTA_ELMETRO]` | Datos de EnCicla, en casillas de 10 m |
| `node motor-valle/motor.mjs elmetro ../MetroZero` | Datos de El Metro, en casillas de 20 m |
| `… --prueba` | Deja la salida en `motor-valle/salida/` sin tocar los juegos |
| `node motor-valle/sincronizar.mjs ../MetroZero [--verificar]` | Copia el motor al otro juego, o solo compara las dos copias |

- **Requisitos:** `pip install duckdb shapely numpy pillow pyarrow` y Node 22.
- **Detrás de un proxy:** `env -u AWS_ACCESS_KEY_ID -u AWS_SECRET_ACCESS_KEY python3 …`

## 2. Lee primero, en este orden
1. `CONTEXTO-RELEVO.md` del motor: el § 0, el § 5 (fila 18), el § 7 y las últimas entradas del § 8.
2. **`docs/AUDITORIA-FASE0-CENITAL.md`, entero.** Tiene:
   - qué dibuja el mapa en cada juego;
   - cómo se generan los datos y cómo se compila cada HTML;
   - los modos protegidos;
   - lo que los documentos suponían y no era así;
   - el plan por archivo de la Fase 1 y las decisiones del autor.
3. **El pedido:** `docs/referencias/renacimiento-cenital-2026/MASTER-PROMPT-VALLE-CITY-TURNO-CERO.md`, con su especificación en `docs/investigacion_tecnica_motor_valle.md`. Como apoyo, el `INFORME-MAESTRO-…` y el `PROMPT-MAESTRO-…` de GPT‑6, en la misma carpeta.
4. `reportes/2026-11-24-claude-fase0-cenital.md`: la línea base y cómo se midió.
5. `BicicletasUno/motor-valle/MOTOR.md`, el contrato del Motor del Valle. Su regla 1: «el mapa solo se cambia aquí».
6. El `CLAUDE.md`, `AGENTS.md` o `GEMINI.md` de cada repositorio que toques, y sus skills:
   - `motor-city-territorio`, `motor-city-desarrollo` y `motor-city-qa-playwright`;
   - en El Metro, `el-metro-desarrollo`, `medellin-fiel` y `el-metro-calidad-movil`.
7. **Integra las skills antes de trabajar,** con `docs/PROMPT-SKILLS.md`:
   - en el motor, `node motor.mjs skills --integrar --agente <tu-agente>`;
   - en un juego hermano, `node motor-city/motor.mjs skills --integrar …`.

   Deja la línea «4) Verificación» en tu informe.

## 3. Primero: las decisiones del autor (bloquean la Fase 1)
- **Hazle las seis preguntas en un solo mensaje.**
- Si ya respondió, sus respuestas están en `CONTEXTO-RELEVO.md` § 8 o en `coord/buzon/`.
- Si dice «lo recomendado», usa la última columna.
- **Anota las respuestas en el § 8 antes de programar.**

| # | Decisión | Opciones | Lo recomendado |
|---|---|---|---|
| 1 | Ancho de los corredores viales (lo que se le recorta a cada casa) | **A**, real + andén (lo de hoy): toca al 18,8 % de las casas · **B**, «jugable» del prompt: 23,7 %, y borra 24.983 casas · **C**, híbrida por bioma | **C**: en laderas, real + 0,5 m; en la ciudad plana, la A; en avenidas y autopistas, la B |
| 2 | Tamaño de los trozos | 160 m · 250 m | **160 m**: es el de los tres cachés (El Metro, EnCicla y Motor City); 250 no es múltiplo de la casilla de 20 m |
| 3 | EnCicla: ¿dónde va el render nuevo? | Solo en el modo libre · también en los cinco oficios cenitales (Usuario, Apoyo, Técnico, Balance y Supervisor) | **Solo en el modo libre, con bandera.** Los oficios, cuando pase la compuerta y el autor lo vea. |
| 4 | El Metro: ¿dónde va el render nuevo? | Solo en Ciudad Libre y Bus · también en los modos protegidos que dibujan la ciudad | **Solo en Ciudad Libre y Bus, con bandera** |
| 5 | Fuente de la Fase 1 | Rehacer desde Overture · sanear lo ya exportado | **Rehacer desde Overture:** recorta los polígonos originales y no los rectángulos guardados |
| 6 | ¿Turno Cero solo en `motorcity`? | — | **Sí, es regla:** es 18+ y no se mezcla con los juegos de familia |

## 4. Lo que debes hacer, fase por fase
**En cada fase:**
1. corre la batería;
2. deja el informe con el formato de lote (§ 8);
3. **detente a pedir el OK** antes de seguir.

### Fase 1 · Saneamiento GIS en `motor-valle/` (solo datos; no se toca ningún render)
- **Dónde:** en `BicicletasUno/motor-valle/` y, con `sincronizar.mjs`, en `MetroZero/motor-valle/`.
- **Versión:** del Motor del Valle 1.2.0 a la 1.3.0.
- **Antes de tocar `motor-valle/`, `MetroZero/tools/edificios_datos.py` o `MetroZero/src/data/`, avisa en `coord/buzon/`.**

**Archivos nuevos:**

| # | Archivo | Qué hace |
|---|---|---|
| 1 | `motor-valle/geo/anchos.json` | Las reglas A, B y C por tipo de vía y por bioma. Tipos: 1 calle, 2 avenida, 3 autopista, 4 carrera, 5 ciclorruta, 6 peatonal y 7 escalas.<ul><li>**A:** la vía real + 1,3 m en las de carros, y + 0,3 m en peatonales y escalas.</li><li>**B** (ancho + andén): autopista 22 + 3, avenida 15 + 2,5, carrera 11 + 2, calle 8,5 + 1,5, ciclorruta 3,5 + 0,8, viaducto 10 + 2. Nunca más angosta que la real.</li><li>**C:** la decisión 1.</li></ul>Se ajusta sin tocar código. |
| 2 | `motor-valle/geo/sanear.py` | La ley de soberanía vial, en pasos:<ol><li>`M_vial`: la unión de buffers de extremos redondos (`w/2 + andén`), **solo de capa 0** (los túneles y los puentes no recortan lo de otro nivel);</li><li>`M_agua`: el río Medellín y las quebradas;</li><li>el recorte: `B_limpio = B \ (M_vial ∪ M_agua)`, con `shapely` 2 y `STRtree`;</li><li>quita los pedazos de menos de 16 m² y simplifica con Douglas‑Peucker a ε = 0,6 m;</li><li>si lo recortado sigue siendo un rectángulo (IoU ≥ 0,92), lo guarda otra vez como rectángulo, para no inflar el peso;</li><li>saca `zMin` y `zMax` bajo los vértices y `zBase = zMin − 6 m`;</li><li>asigna el bioma por celda (`centro`, `ladera_ladrillo`, `residencial_verde`, `industrial_rio` y `rural_montana`; en Turno Cero, también `costa`), con la tabla de zonas de El Metro (`VC.ZC` y `VC.ZM`), el uso del suelo y la altura;</li><li>indexa por trozos (decisión 2) con la clave `"cx,cy"`;</li><li>escribe **`geometry-conflicts.geojson`**: cuando una casa confiable (un polígono de OSM o del Catastro) choca con una calle menor, **no la recorta: la marca para revisar**, con su fuente y su severidad (< 0,3, de 0,3 a 2 o > 2 m²; si tapa una vía crítica o la entrada de una estación, es crítica).</li></ol> |
| 3 | `motor-valle/geo/rasante.py` | La cota de las vías:<ol><li>muestrea el relieve cada 5 m;</li><li>lo suaviza a lo largo de cada vía (gaussiano, σ ≈ 25 m);</li><li>pone una sola cota en cada nodo (el promedio de las vías que llegan) y vuelve a suavizar con los nodos fijos;</li><li>calcula la pendiente `g` de cada tramo, con un tope por clase;</li><li>toma la capa (−1, 0, 1 o 2) y las rampas de `alturas.py` y `pasos.py`, que ya existen.</li></ol> |
| 4 | `motor-valle/pruebas/geometria.mjs` | Prueba en Node, sin dependencias. Parte de `motorcity/reportes/fase0-cenital/medir-conflictos-elmetro.mjs`, que ya decodifica los datos como el juego. Comprueba:<ul><li>0 edificios de capa 0 que pisen un corredor de capa 0 (> 0,05 m²);</li><li>0 fragmentos de menos de 16 m²;</li><li>0 casas en el agua;</li><li>el peso: `edificios.js` ≤ 4,6 MB y el HTML de El Metro ≤ 9,5 MB.</li></ul> |
| 5 | `motor-valle/pruebas/geometria.py` | La misma prueba, exacta con polígonos (`shapely`) |

**Archivos que cambian:**

| # | Archivo | Qué cambia |
|---|---|---|
| 6 | `motor-valle/motor.mjs` | El subcomando `sanear` y su paso dentro de `encicla` y `elmetro` (con `--prueba`, a `salida/`) |
| 7 | `motor-valle/MOTOR.md`, `capas/index.mjs` y `VERSION.json` | La 1.3.0, con su historial |
| 8 | `MetroZero/tools/edificios_datos.py` | Lee las huellas saneadas y escribe un `edificios.js` **compatible**: los flujos nuevos (zócalo `zb`) van **al final** del binario, porque el lector de `11-edificios.js` solo usa los seis primeros de `len`; el bit 128 del byte de uso marca «recortado», porque hoy se leen los bits 1 a 64; y `v: 2`. |
| 9 | `MetroZero/src/data/edificios.js` y `vias.js` | Regenerados. La cota y la pendiente de las vías van en un flujo aparte al final, que el lector actual no lee. |
| 10 | EnCicla | `src/data/edificios.bin` (huellas saneadas en la escala de 10 m) y la cota de `vias.bin`, **sin conectarlos** (eso es la Fase 3) |
| 11 | Las dos copias | `node motor-valle/sincronizar.mjs ../MetroZero` y luego `--verificar` |

**Hecho cuando…**
- `geometria.mjs` da 0 solapes y el peso queda dentro del presupuesto;
- `medir-conflictos-elmetro.mjs` pasa de 120.187 edificios a casi 0 con la regla elegida;
- `node tools/build.mjs && node tools/test.mjs 100` da 0 errores en El Metro, y `node tools/build.js && node tests/run.js` queda en verde en EnCicla;
- una prueba con Playwright (que no cambia el juego) muestra que `VC.recorta` **corta 0 edificios** en 50 regiones de muestra (tras `VC.region`, cuenta los `b.cut === 1` y los `b.rec === false`);
- las dos copias del Motor del Valle quedan iguales;
- hay un informe antes y después, con las mismas cifras de la Fase 0.

### Fase 2 · Render cenital (El Metro y EnCicla con bandera por modo; Motor City)
⚠️ **En El Metro, el render compartido también dibuja modos protegidos:**
- `MAP.drawTop` lo usan Conducir (vista superior), Volante, Carrera, el mapa y el álbum;
- `G3.draw` lo usan Conducir, Volante, Carrera y el viaje en Metrocable.

En EnCicla, el cenital de `75-graficos.js` es el de cinco oficios. **Todo va detrás de una bandera que se enciende solo en los modos decididos (decisiones 3 y 4)**, en archivos aditivos que envuelven las funciones (el patrón de los dos juegos). Por ejemplo, `MetroZero/src/js/97d-cenital.js` y `BicicletasUno/src/js/99y-cenital.js`; esos nombres hoy están libres.

**En El Metro y en EnCicla:**
1. ***Occluder fade*.** En las capturas de la Fase 0 (Acevedo y San Antonio), el techo de la estación tapa por completo al jugador. Lo que lo tape baja a una opacidad de 0,30, o se dibuja su silueta encima.
   - Nunca se esconde el tablero entero de un puente o del viaducto: se conserva con su sombra y se ve al jugador debajo.
   - Prueba: el jugador siempre visible a 412 × 860.
2. **El anillo lejano de El Metro** (de 700 a 1.100 m, `22-gl.js` · `buildNear`, línea 177): las cajas de relleno por casilla se cambian por los edificios reales simplificados, cuando hay datos.
3. **Zócalos:** los muros bajan hasta `zBase`, para que ninguna casa flote en una ladera.
4. **Terreno facetado** con sombreado plano por bandas de cota, en las laderas altas y en lo rural.
5. **Sombra de contacto** (elipse oscura) bajo todo vehículo, bici y persona, en 2D y en 3D.
6. **Bruma o *tilt-shift*** en el 12 % de arriba de la pantalla.
7. **Cámara:** cambiar `min(1, dt·k)` por `1 − e^(−k·dt)`, para que no dependa de los cuadros por segundo. El adelanto y el zoom por velocidad ya existen: ajústalos jugando. Norte arriba por defecto.

**En Motor City:**
- el mismo saneamiento en `geo/territorio.py` (porta `sanear.py`) y regenerar los mundos MC4;
- con los datos limpios, quitar la tolerancia de 1 m de la colisión en `js/32-fisica.js` (línea 46);
- `node motor.mjs prueba --navegador` y la QA.

**Hecho cuando…**
- hay capturas antes y después en los mismos puntos;
- no queda ninguna caja de relleno sobre una vía;
- las pruebas están en verde;
- el p95 no empeora. En El Metro se mide con `96d-rendimiento.js`; en EnCicla, con la compuerta.

### Fase 3 · Integración y regresión
1. **Encender la bandera:**
   - en El Metro, en Ciudad Libre y Bus;
   - en EnCicla, en el modo libre (y en los oficios, si el autor lo decidió).
2. **EnCicla:** cambiar los lotes inventados por las huellas reales **solo si la compuerta no empeora** (mide A/B con `tests/benchmark-2km-gpt6.mjs --cpu=4`). Si empeora, los lotes se quedan detrás de la bandera.
   - Hoy da p95 de 103,7 ms en la Carrera 43A y 61,2 ms en Las Palmas; la meta es menos de 50. **No cambies ni saltes la compuerta sin el autor.**
3. **Regresión:**

   | Juego | Qué se prueba |
   |---|---|
   | El Metro | `node tools/test.mjs 100` (0 errores) y capturas con `--shots` de la cabina, la vista lateral, el Metrocable, la guía y la historia de Rosalba |
   | EnCicla | `node tests/run.js` (los 9 oficios por los turnos, más los minijuegos) y `node tests/regresion-encicla.js` |
   | Rutas | **Una prueba nueva: las rutas A\* (`rutas_calles.js`) no cruzan ningún edificio saneado** |
4. **Versiones:**
   - El Metro: `src/js/00-core.js` y `android/gradle.properties` (`elmetro.versionName` y `elmetro.versionCode`, hoy 36);
   - EnCicla: `src/js/00-core.js` y `app/android/app/build.gradle` (`versionCode`, hoy 30700).
5. **Publicar:** solo con las pruebas en verde y con el OK del autor. La página de EnCicla se publica solo si `publicar.yml` pasa.

### Fase 4 · Carreras retro pseudo‑3D en Turno Cero (solo en `motorcity`)
`MC.Arcade` (`js/47-clasicos.js`) **se queda** para la calle real: proyecta su eje y pinta de lejos a cerca, y las lomas ya tapan bien. Lo nuevo es **`js/47b-pista.js` (`MC.Pista`)**, con la técnica clásica, escrita desde cero (sala limpia: el código abierto de otros sirve de lectura, no se copia).

**La pista:**
- `segments[]` de 200 de largo, con `p1` y `p2` (`world`, `camera` y `screen`), `curve`, colores por bandas que alternan cada 3 segmentos (asfalto, pianos, berma y líneas), `sprites[]`, `cars[]` y `clip`;
- colinas cosenoidales: `y = y0 + (y1 − y0)·(1 − cos πt)/2`;
- curvas acumuladas: `x += dx; dx += seg.curve`;
- fuerza centrífuga: `playerX −= dt·(v/vmax)·curve·C`.

**La proyección:** `d = 1/tan(FOV/2)`, `s = d/(z − camZ)`, `X = W/2 + (W/2)·s·(x − camX)` e `Y = H/2 − (H/2)·s·(y − camY)`. Se ven de 250 a 300 segmentos.

**Las dos pasadas:**
1. **De cerca a lejos, con `maxY`:**
   - descarta lo que está detrás de la cámara o de una cresta;
   - guarda `seg.clip = maxY`;
   - pone niebla en los últimos 45 segmentos.

   Pinta menos que `MC.Arcade`, que dibuja unas mil figuras por cuadro.
2. **De lejos a cerca:** los rivales y los objetos, recortados abajo contra `seg.clip`.

**Más allá de Free Gear:**
- parallax de 3 capas (cielo, montañas del Valle y horizonte urbano), que se mueve con `curve·velocidad` y con `camY`;
- el carro del jugador con 6 estados (recto, giro suave y giro brusco, en plano y en subida), vibración en la berma y chispas y humo al derrapar;
- rebufo a menos de 15 segmentos detrás de un rival en el mismo carril (menos arrastre y carga el nitro);
- nitro con FOV de 100° a 116°, líneas de velocidad y una sacudida corta;
  - hoy `MC.Arcade` tiene entre 58 y 71°, y por eso se siente lento;
- rivales con IA de carril y adelantamiento suave, sin saltos;
- HUD con posición, vuelta, tiempo, nitro y el minimapa del circuito, y controles táctiles a 412 × 860 y 860 × 412, fuera de la zona libre del centro;
- todo el arte procedural (o con respaldo procedural).

**Dos circuitos:**
- **Subida a Las Palmas:** subida larga, curvas encadenadas y lomas;
- **Autopista Regional nocturna:** alta velocidad, puentes y arcos encima de la vía, y la silueta de la ciudad.

**Turno Cero:**
- un archivo aditivo, `juegos/getaway/70-retro.js`, que suma «🏎️ Carreras retro» a `G.Modos.DEF` (`60-modos.js`);
- reusa `carroAtras` y `cieloRetro`, con récords y premio, y al salir vuelve al mismo punto del mundo abierto.

**La prueba (`pruebas/pista-retro.mjs`, sumada a `motor-city-qa.yml`):**
1. un carro detrás de una cresta queda recortado (prueba por píxeles);
2. la curva acumulada es continua;
3. el bot completa los dos circuitos, con vueltas y posiciones;
4. el p95 baja de 16,7 ms en Chromium de escritorio;
5. 0 errores de consola.

**Al cerrar:** sube a la 5.4.0 (`VERSION.json` y `js/00-nucleo.js`) y genera la APK con `apk-juegos.yml`.

### Fase 5 · Turno Cero en cápsulas y en el celular
- **El selector de cápsulas ya existe:** `G.Modos.DEF` (carrera, extremo, mandados, encicla, tren, run, trucos y lab). Comprueba que el paso entre el mundo abierto cenital y las Carreras retro conserve el estado.
- **La cápsula 3, solo la interfaz:**
  - garaje y colección en 2D pixel, con las fichas de `MC.Taller`;
  - el perfil de moto en `MC.Dinamica` (las motos ya se inclinan desde la 5.2);
  - los ganchos de la capa aérea (`layer = 2`, que ya tiene el jetpack y la avioneta);

  todo sin cargar el núcleo.
- **Controles táctiles para el WebView de Android:** medir 60 cuadros por segundo con 📏 (`68-medir.js`) y la telemetría. El módulo retro no debe pesar más de unos 150 KB (hoy `getaway.html` pesa 28.839 KB).

### Si trabajan varias IA al tiempo
Repartan por zonas y reclámenlas en `coord/agentes/<tu-id>.json`:

| Quién | Qué |
|---|---|
| Claude o Codex | Las fases 1 y 2 (datos y núcleo del render) y la Fase 4 (`MC.Pista`) |
| Gemini/Antigravity | El *occluder fade* y la cámara (prueba visual), el HUD y los controles del modo retro, y las capturas a 412 × 860 |
| ChatGPT (imágenes) | Los 6 estados del carro y las capas de parallax del Valle, siempre con respaldo procedural |

## 5. Lo que seguía de antes (más abajo en prioridad)
1. **La Fase 4 del plan 5.0:**
   - misiones con pasos, fallas y reintentos;
   - repeticiones exactas (grabar la entrada y repetirla con la misma simulación);
   - un bot que gana cada misión.
2. **Un barrio a nivel GTA en el Centro:** `MC.Sitios`, gente en escenas (`MC.CiudadViva`) y cinco misiones pulidas.
3. **Pendientes de ChatGPT/Codex:** R8 (SSAO, faroles y agua), C5‑05 (policía con tácticas), C5‑06 (multitudes), C5‑02 (modelos más finos de los sitios) y R6‑b (medir en un celular).
4. **Pendientes de Gemini:** G5‑09 a G5‑15.

## 6. Datos para comparar (línea base del 24‑nov)

| Qué | Hoy |
|---|---|
| Motor City | `prueba.mjs --navegador`: **158 bien** |
| El Metro | **100 partidas, 0 errores**; HTML de 8.749 KB |
| EnCicla | **170 bien**; HTML de 5.641 KB |
| Turno Cero | `getaway.html`: 28.839 KB |
| Compuerta de EnCicla (CPU ×4) | p95 de **103,7 ms** (Carrera 43A) y **61,2 ms** (Las Palmas); meta < 50 |
| Edificios de El Metro que pisan la vía | Regla A: **120.187 de 638.303** (18,8 %), 12.267 con el centro en la vía · Regla B: **151.055** (23,7 %), 24.983 con el centro en la vía |
| Cajas de relleno del anillo lejano sobre vías | **76.585 de 515.666** |
| Origen de las huellas | Google 52,6 %, OSM 26,8 % y Microsoft 20,6 %; solo 30.088 polígonos (el resto, rectángulos) |

**Herramientas y trucos:**
- **Medir los conflictos:** `node reportes/fase0-cenital/medir-conflictos-elmetro.mjs ../MetroZero` (34 s, desde `motorcity`).
- **Capturas:** en El Metro, `node tools/test.mjs 2 --shots <carpeta>`; en EnCicla, `node tests/run.js --shots --n=4` (quedan en `tests/out/`).
- **La compuerta de EnCicla** importa `playwright` como módulo ES. Si no lo encuentra, haz como la CI: `npm install --no-save --no-package-lock playwright`.
- **Al compilar EnCicla** se reescribe `dist/ENCICLA-TODO.md` con la fecha. Restáuralo si no publicas.
- **En `js/NN-*.js` de Motor City,** un comentario `//` en una sola línea rompe el código: usa `/* */`.

## 7. Reglas que no se negocian
- **El juego:**
  - un solo HTML, sin internet ni librerías nuevas (en Motor City, three.js ya está aprobado);
  - español de Colombia;
  - no romper los guardados: `elmetro.v1`, `juegaencicla.v1` y `motorcity.turnocero-v1`. Los campos nuevos van con su valor por defecto.
- **Turno Cero es 18+ y vive solo en `motorcity`.** EnCicla, El Metro y Run son de familia y van sin violencia.
- **Saneamiento en los datos, no parches en el render:** no escondas casas al dibujar ni quites colisiones para «arreglar» una calle.
- **Modos protegidos intactos:**
  - en El Metro, la vista lateral, la maqueta, Conducir, el tranvía, la cabina, Volante, Despacho, Metroplús, Carrera, la ciclovía, Operación, el Metrocable, la guía y la historia de Rosalba;
  - en EnCicla, los 9 oficios, los 27 turnos, los minijuegos y la interfaz de revista.
- **Cada cambio de render, con bandera por modo.**
- **Git:**
  - tu rama;
  - `main` solo con pruebas en verde y con el OK del autor;
  - sin `push --force`;
  - sin pull request si el autor no lo pide;
  - en `gh-pages` de EnCicla se conservan `/metro/` y `/descargas/`;
  - `publicar.yml` no se salta.
- **Datos:**
  - nunca subas llaves;
  - el correo del autor es privado;
  - atribuye a Overture/OSM (ODbL), Google Open Buildings (CC BY 4.0 / ODbL), Microsoft (ODbL), las capas oficiales de Medellín y SRTM;
  - **la licencia del catastro nuevo (R3) y el MDT LiDAR CC BY‑SA (R5) esperan al autor: no los integres.**
- **Sala limpia:** las ideas de otros juegos sí; su código, su arte, sus nombres o su mapa, no.
- **Si otra IA dejó una rama:** compréndela, pruébala, mejórala y únela. Si algo suyo no funciona, dilo con números en vez de borrarlo.

## 8. Al terminar cada fase (obligatorio)
1. **Corre la batería** de lo que tocaste e informa con este formato de lote:

       LOTE · REPO/RAMA/COMMIT · ESTADO · QUÉ LEÍ · QUÉ FALLABA · CAUSA RAÍZ · CAMBIO · PRUEBAS (comando, código de salida, resultado)
       DATOS (fuente y licencia) · RENDIMIENTO (antes y ahora) · REGRESIONES · CÓMO REVERTIR · PENDIENTES

   Si una prueba no se pudo correr, escribe «NO EJECUTADA», con la causa.
2. **Sube las versiones** que correspondan: Motor del Valle, motor, El Metro o EnCicla (§ 4).
3. **Escribe:**
   - la `BITACORA.md` del motor y la `docs/BITACORA.md` de cada juego que tocaste;
   - tu entrada en el § 8 de `CONTEXTO-RELEVO.md` (y en el § 5, fila 18);
   - un mensaje en `coord/buzon/AAAAMMDD-HHMM-<tu-id>-<tema>.md`;
   - tu ficha en `coord/agentes/<tu-id>.json`;
   - en El Metro, corre `node tools/todo.mjs`.
4. **Publica** las APK (`apk-juegos.yml`, `apk.yml` y `android.yml`) y las páginas solo con las pruebas en verde y el OK del autor.
5. **Detente y pide el OK de la fase siguiente.** Entrégale al autor los enlaces, el HTML y la APK, y **escribe tú también un prompt de relevo como este** para la IA que venga después.

## 9. Si eres un chat sin terminal (ChatGPT o Gemini en la web)
No puedes correr las fases. Lee en GitHub `docs/AUDITORIA-FASE0-CENITAL.md` y el *master prompt*. Puedes ayudar:
- a decidir las seis preguntas del § 3;
- con el arte del modo retro y del parallax, siguiendo `motor-city-arte` y `el-metro-arte`;
- con revisiones.

Dile al autor qué hiciste.
