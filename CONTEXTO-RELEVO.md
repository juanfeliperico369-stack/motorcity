# Documento de relevo · Motor City y *Turno Cero*

> **Para la IA que siga (Claude, Codex, Gemini o cualquier otra).** Este documento existe por pedido del autor:
> «siempre, pero siempre, un documento de contexto con todo el plan, lo que hiciste y lo que falta, para que si no lo logras se le pase el trabajo a otra IA».
>
> **Reglas de este documento:**
> 1. **Léelo entero antes de tocar nada.** Luego lee `CONTEXTO-IA.md`, `MOTOR.md`, `TAREAS-IA.md` (§ 4.0) y `docs/TURNO-CERO.md`.
> 2. **Al terminar tu turno (o si se te va a acabar el contexto), es OBLIGATORIO:**
>    - actualizar la sección **«Relevo de cada IA»** al final, con tu propia entrada (quién eres, qué hiciste, cómo lo probaste, qué falta y qué riesgo dejas);
>    - actualizar **«Estado»**, **«Hecho»** y **«Falta»** si cambiaron;
>    - dejar tu ficha en `coord/agentes/<tu-id>.json` y un mensaje nuevo en `coord/buzon/AAAAMMDD-HHMM-<tu-id>-<tema>.md`, según el protocolo de abajo.
> 3. **Nunca borres la entrada de otra IA.** Este documento es un relevo: se suma, no se reescribe.
> 4. A la IA que venga después de ti pásale la misma instrucción: **también debe hacer y dejar su documento de contexto** (su entrada aquí y su ficha en `coord/`).

**Última actualización:** 21‑nov‑2026, Gemini · Antigravity (sobre motor **4.0.2** de Claude + revisión del **PR #7** de ChatGPT/Codex). **Rama principal de trabajo:** `claude/motor-city-engine-xu7p4y` (entrega Gemini actualizada en `ia/antigravity/motorcity-4.0`). `main` de `motorcity` se avanza en rápido para GitHub Pages.

---

## 1. La misión
**Motor City** es un motor de mundo abierto en **un solo HTML, sin internet ni librerías**. Convierte lugares reales (datos abiertos) o inventados en mundos jugables con leyes reales:
- **Juegos encima:**
  - **Juega EnCicla** (`BicicletasUno`, todo público);
  - **El Metro** (`MetroZero`, todo público);
  - **Run Scooter** (`RunRunZero`);
  - **Mandados** (Guatapé, demo del motor);
  - **Turno Cero** (`juegos/getaway/`, 18+).
- **Lo que pidió el autor para la 4.0:** el juego grande y adulto («el monstruo»), sin limitarse. Juntar Nueva York (Manhattan), la mejor versión de Medellín y el Valle, y Guatapé **en un mismo planeta**, con caminos largos en medio de la nada para ir de una ciudad a otra.

## 2. Dónde está y cómo se prueba
| Qué | Dónde |
|---|---|
| **Jugar** | <https://juanfeliperico369-stack.github.io/motorcity/>. Juegos:<ul><li>Turno Cero: `dist/juegos/getaway.html`</li><li>misión 3D de Codex: `dist/juegos/turno-cero-accion-3d.html`</li><li>Mandados: `dist/juegos/mandados.html`</li></ul> |
| Código del motor | `js/NN-*.js`. Solo entran los que empiezan con dos dígitos y un guion, y se compilan a `dist/motor.js`. Ojo: un comentario `//` en una sola línea rompe el código; usa `/* */`. |
| Turno Cero | `juegos/getaway/`, con 10 contenido, 20 juego, 30 historia, 40 dibujo y 90 inicio. `juego.json` lleva `"mundos"`, `"modelos"` y `"extras"`. |
| Mundos | `datos/<id>/mundo.mc4`:<ul><li>`nueva_york`: 10 MB, Manhattan a 6 m;</li><li>`medellin`: 6,8 MB;</li><li>`guatape`: 0,4 MB.</li></ul>Reglas de ciudad en `ciudades/<id>.json`. |
| Modelos 3D | `arte/modelos/turno-cero/*.glb`: los 45 de Codex, 3 de ellos con esqueleto. CC0. |
| Compilar | `node motor.mjs construir` (o `node herramientas/construir.mjs`) |
| Probar | `node motor.mjs prueba --navegador`: **debe dar todo en verde**. La última vez dio 150 de 150. |
| Documento único | `docs/DOCUMENTO-UNICO.md`. Todo junto queda en `dist/MOTOR-CITY-TODO.md`, que se arma solo al compilar. |
| Juegos | `node motor.mjs sincronizar ../BicicletasUno` y `../MetroZero`. Después, en cada juego, sus pruebas:<ul><li>EnCicla: `node tools/build.js && node tests/run.js`;</li><li>El Metro: `node tools/build.mjs && node tools/test.mjs 100 && node tools/todo.mjs`;</li><li>Run: `node tools/build.mjs && node tools/sim.mjs 100 240`.</li></ul> |

## 3. Estado (20‑nov‑2026)
- **Motor 4.0.2**, 64 fragmentos y 152 pruebas en verde. Ya trae:
  - **`MC.Planeta`**: anillo de ciudades y carreteras generadas, globo y horizonte curvo;
  - **`MC.Busqueda`**: búsqueda de 0 a 5 con los umbrales de Codex y la última posición vista;
  - **`MC.Modelos`**: lector GLB, con piel y animación glTF, faros de noche y abolladuras por zona;
  - **juegos con varios mundos**;
  - **manejo con reversa y el piloto de la IA**, `MC.Manejo.pilotar`, con rutas que siguen la calle.
- **Turno Cero, jugable de punta a punta:**
  - cinco actos, siete misiones y finales A, B y C;
  - las tres ciudades y tres carreteras de 12 a 16 km;
  - metro, cables, EnCicla y lancha;
  - artefactos T01 a T11 y sigilo con conos de visión.
  - Un bot lo recorrió completo sin errores. **No se ha probado en un celular real con GPU.**
- **Juegos:**
  - EnCicla y El Metro tienen el motor 4.0 en `motor-city/` y sus pruebas en verde;
  - Turno Cero no se mezcla con ellos;
  - Antigravity y Codex trabajan en sus ramas de juego (ver § 6).

## 4. Hecho (por versión, lo esencial)
| Versión | Qué |
|---|---|
| 2.0–2.11 | El mundo MC4 y el craqueo de territorios (`geo/territorio.py`), física, vehículos, clima, tráfico, transporte con horario, vistas 2D, estilos, `MC.Vida`, telemetría y guardado por sectores. Ver `BITACORA.md`. |
| 3.0–3.1 | Mundo único 3D con cámaras aéreas, fachadas, árboles low-poly, `MC.Objetos`, mapa grande; `MC.Persecucion` (Codex) y sombras solares (Codex) |
| 4.0 | Todo lo de § 3, más Manhattan craqueado y `docs/TURNO-CERO.md` |
| 4.0.2 | Reversa y vuelta en tres puntos; `MC.Manejo.pilotar` (la IA sale de atascos); `rutaA` por la forma de la calle. En Turno Cero: Run en la ciclovía, carreras, guardias a pie y accesibilidad. |
| 4.0.1 | Relevo (este documento y `coord/`), luces y abolladuras de los GLB, motor y Doppler, dron policial 3D, reducción no letal, alejar hasta el planeta, eventos de carretera, contratos nuevos y arte de portada |

## 5. Falta (en orden de valor) y a quién le toca
| # | Qué | Quién | Detalle |
|---|---|---|---|
| 1 | **Probar Turno Cero en un celular real con GPU**: fluidez p95, carga de cada ciudad, cómo se ve el 3D | Autor / QA con teléfono físico (base VM + 12 capturas + carga/RAM listas por Gemini en `reportes/2026-11-21-gemini-turno-cero.md`) | En VM solo hay WebGL por software; ya quedaron medidas de carga y JS Heap (`nueva_york` 215,3 MB, `medellin` 66,3 MB, `guatape` 13,6 MB) y plantilla vacía para llenar en celular real |
| 2 | **La acción a pie de Codex dentro del motor**: su `turno-cero-accion-3d.html` pasado a `MC` y a las tres ciudades | Codex (C‑M32) | Ya están `MC.Modelos.posar` (sus rigs se animan), `MC.Busqueda` y los conos del sigilo |
| 3 | **Manhattan por sectores de 1 km** (memoria en celulares) | Codex (C‑M34) | **Urgente confirmado por `G‑H24` y revisión PR #7:** Manhattan sube a **201–215 MB** y viajar **NY → Medellín** sube a **258,9 MB (`316 MB` reservados)** si `MC.Planeta` no evacúa la ciudad previa |
| 4 | **Texturas PBR y portada pintada** | ChatGPT / Claude (C‑A16, C‑A17; **propuesta aditiva lista en `arte/gemini/turno-cero/`**) | Portada vertical `1080×1920`, 5 láminas `1280×720`, atlas PBR 3×3 + 9 losetas y `galeria.html` listos para integrar o contrastar con `arte/chatgpt/turno-cero/` |
| 5 | **LOD de los GLB y más actores con esqueleto** | Codex (C‑M33, avance en PR #7: 9 rigs / 51 GLB + LOD0/1/2) | Faltan LOD retopologizados y rebase del PR #7 sobre 4.0.2 |
| 6 | **Aplicar correcciones de lugares, filtro de lenguaje y revisión PR #7** | Claude (auditoría completa en `reportes/2026-11-21-gemini-turno-cero.md` y `2026-11-21-gemini-revision-pr7.md`) | `gu_finca` de PR #7 (`6.2301, -75.1648`) **aprobada** (`agua40m: true`, `≥ 263 m` de comercios); faltan 4 calles + `'coro'` en `20-juego.js` + mayúsculas/plurales de `LENGUAJE_SUAVE` + encuadre/etiquetas `MC.GloboGPU` |
| 7 | **Los pedidos adaptados a los juegos** | Codex | Bici a Guatapé (EnCicla), bus a Guatapé (El Metro) y Run por la carretera de la nada |
| 8 | **El globo en WebGL continuo**. Ya se llega al globo alejando la cámara, con animación; falta que sea la misma escena 3D. | Codex (C‑M31) | `Planeta.globo` |
| 9 | **Daño por piezas, segunda parte**: humo y fuego en 3D, puertas y capó que se sueltan. Las abolladuras por zona ya están. | Codex (C‑M35) | `js/45-glb.js` (`op.dano`) |
| 10 | **Combate a pie más allá de reducir**: cobertura, guardias que persiguen a pie, esquivar | Codex (C‑M32) | Ya están ✊ Reducir y los conos |

## 6. Protocolo entre IAs (sin mediador), adoptado de Antigravity y Codex
- **Una rama por agente:** `ia/<agente>/<tema>` o `<agente>/<tema>`. Nunca `push --force` sobre la rama de otro, ni sobre `main` ni sobre `gh-pages`.
- **Ficha propia:** `coord/agentes/<agente>.json`. Cada IA edita **solo la suya**.
- **Buzón donde solo se suma:** `coord/buzon/AAAAMMDD-HHMM-<agente>-<tema>.md`. Un archivo nuevo por mensaje; nunca se edita el de otro.
- **Antes de empezar y antes de cada push:**
  - `git fetch --all --prune` y revisar `git branch -r`;
  - leer las fichas y el buzón de las otras ramas (`git show origin/<rama>:coord/...`);
  - unir lo que ya esté verde.
- **Zonas actuales:**
  - **Claude:** el motor (`js/`, `herramientas/`, `pruebas/`) y Turno Cero (`juegos/getaway/`, salvo los archivos de Codex en `arte3d/` y `turno-cero-accion-3d.html`).
  - **Codex:** `juegos/getaway/arte3d/`, la escena 3D y, en EnCicla, lo que reclama en `coord/agentes/codex.json` de `BicicletasUno`.
  - **Antigravity (Gemini):** las zonas Z1–Z5 de El Metro (`MetroZero/.ai-coord/`) y los rangos `98a–98m` de EnCicla.
- **Si dos soluciones chocan,** gana la que pase las pruebas, pese menos en KB y dé menos ms por cuadro (`MC.Telemetria`). Las mejoras que no se excluyen se suman.

## 7. Reglas que no se negocian
- Un solo HTML, sin internet en el juego, y español de Colombia.
- No romper los guardados. El de Turno Cero es `motorcity.turnocero-v1`.
- Turno Cero es para adultos (18+) y **no se mezcla** con EnCicla, El Metro ni Run, que son para todo público.
- Todo es ficción en Turno Cero: personas, empresas, bandas y policía. Las calles son reales y no se acusa de nada a lugares reales.
- **Nunca subir llaves.** No poner el correo del autor en ningún lado. No poner identificadores de modelos de IA en los commits.
- No copiar arte con derechos: de las referencias se toman técnicas, no arte.
- Pruebas en verde antes de cada push. Actualizar `BITACORA.md` y este documento.

## 8. Relevo de cada IA (súmale tu entrada; no borres las anteriores)

### Claude · 20‑nov‑2026 · motor 4.0.0 → 4.0.x
- **Hecho:** ver § 3 y `BITACORA.md`. En este turno, además:
  - se unió lo último de Codex (escena 3D y rigs);
  - `MC.Modelos.posar` reproduce los esqueletos;
  - se creó este documento.
  - Las mejoras de la 4.0.x están en su propia sección de la bitácora.
- **Cómo lo probé:**
  - `node motor.mjs prueba --navegador`: 150 de 150;
  - bot de historia completa;
  - capturas en 412×860;
  - pruebas de EnCicla y El Metro (100 partidas) en verde.
- **Falta:** § 5.
- **Riesgo que dejo:**
  - el HTML de Turno Cero pesa unos 26 MB, por las tres ciudades;
  - la carga de Medellín tarda varios segundos;
  - no hay medición en celular;
  - los recorridos son largos a propósito (16 km de carretera ≈ 8–9 min).

### Claude · 20‑nov‑2026 · 4.0.1
- **Hecho:**
  - este documento y el protocolo `coord/` en el motor;
  - luces y abolladuras de los GLB;
  - sonido de motor y Doppler;
  - dron policial 3D;
  - ✊ reducción no letal a pie;
  - alejar la cámara hasta el planeta;
  - eventos de carretera en Calle libre y 3 contratos nuevos;
  - arte de portada (SVG);
  - versión 4.0.1.
- **Probé:**
  - la suite completa del motor;
  - el bot de la historia completa (final A, sin errores);
  - capturas de la portada, la noche en 3D, el carro abollado y el sigilo a pie;
  - EnCicla y El Metro con sus pruebas.
- **No toqué** el `src/` de los juegos: Antigravity y Codex trabajan allí en sus ramas (`ia/antigravity/…`, `codex/encicla-motorcity`). Al integrar, que fusionen sobre `claude/motor-city-engine-xu7p4y` siguiendo `coord/`.
- **A la IA que siga:** empieza por § 5. Al terminar, **escribe tu entrada aquí** y tu ficha en `coord/agentes/`, y pídele lo mismo a la siguiente.

### Claude · 21‑nov‑2026 · 4.0.2
- **Hecho:**
  - reversa y vuelta en tres puntos en el modelo de carro;
  - `MC.Manejo.pilotar`, el piloto de la IA que usan las patrullas, la banda, El Contador y los rivales;
  - `rutaA`, que sigue la forma de la calle (antes cortaba por encima de casas);
  - en Turno Cero: Run en la ciclovía, carreras callejeras, guardias que persiguen a pie y opciones de accesibilidad.
- **Probé:**
  - 152 de 152 en verde;
  - simulación del piloto en Medellín (1,7 km en unos 60 s) y en Guatapé (3 de 4);
  - en Chromium, Run y la carrera;
  - el bot de la historia completa.
- **Riesgo:**
  - en Guatapé hay calles que los datos marcan como edificio o como muy empinadas, y la IA se puede trabar allí;
  - el jugador ahora retrocede al frenar estando quieto, el comportamiento normal de los juegos, pero hay que confirmarlo en un celular.
- **Sigue:** § 5, sin cambios en el orden. Para Codex: la acción a pie ya tiene la base (guardias que persiguen y ✊); falta la cobertura y esquivar.
- **A la IA que siga:** al terminar, **escribe tu entrada aquí** y tu ficha en `coord/agentes/`, y pídele lo mismo a la siguiente.

### Gemini · Antigravity («hydrogen») · 21‑nov‑2026 · auditoría y datos sobre 4.0.1 (`ia/antigravity/motorcity-4.0`)
- **Hecho (todas las tareas de Gemini en `TAREAS-IA.md` § 4.0, cero ediciones en `js/`, `herramientas/`, `pruebas/` ni `juegos/getaway/`):**
  - **`G‑H22`:** creado `contenido/paradas-carretera.json` con **28 paradas originales** (4 por cada uno de los 7 biomas de `MC.Planeta.BIOMAS`: `costa`, `llanura`, `desierto`, `bosque`, `montana`, `nieve`, `lagos`), bilingüe `nombre_es` / `nombre_en`, `tipo` compatible con `PARADAS_RUTA`, `rutas` y frase de `ambiente`.
  - **`G‑H12`, `G‑H13` y `G‑H6`:** reporte `reportes/2026-11-21-gemini-herramientas-4.0.md` con:
    - instalación verificada de las 4 skills externas (`node motor.mjs skills --instalar --agente antigravity`: `hallmark`, `modern-web-guidance`, `find-skills`, `hyperframes`);
    - auditoría de `node motor.mjs publico` (Sofía 8 años `mal` / 5 s atascada; Mark turista `revisar` / 35 % atascado; Don Gilberto y Valentina `bien`);
    - auditoría de `npx -y modern-web-guidance@latest legacy-scan js --json`: **6 hallazgos (`js/structured-clone`)**, todos clasificados `dropWhen` (no aplicar) porque `pruebas/prueba.mjs` corre en `node:vm` sin `structuredClone` y `00-nucleo.js`/`49-hogar.js`/`92-guardado.js` dependen de normalización JSON.
  - **`G‑H20`, `G‑H21`, `G‑H23` y `G‑H24`:** reporte integral `reportes/2026-11-21-gemini-turno-cero.md` + **12 capturas móviles WebP** (`reportes/img/turno-cero-4.0/`, 907 KB total, revisadas una por una):
    - **`G‑H24` (carga y memoria):** `nueva_york` tarda `2.850 ms` y sube el JS Heap a **215,3 MB** (`262,4 MB` reservados); `medellin` `1.746 ms` / **66,3 MB**; `guatape` `985 ms` / **13,6 MB**. Confirma la urgencia de `C‑M34` (Manhattan por sectores de 1 km).
    - **`G‑H21` (19 lugares):** `gu_finca` apunta al hotel real **`La valentina finca hotel`** como refugio del villano (ALTO — propuesta neutra verificada en MC4: `6.23636, -75.18186`, a 495 m del negocio más cercano); además 4 calles desfasadas (`ny_noah`, `ny_oeste`, `md_centro`, `md_envigado`) y 3 ajustes menores, todos con coordenadas exactas sobre vía en MC4.
    - **`G‑H23` (lenguaje suave + bug real):** hallado bug real en `juegos/getaway/20-juego.js:256` (hablante `'coro'` no existe en `TC.QUIEN`, debe ser `'camara'`); `LENGUAJE_SUAVE` pierde mayúscula inicial, pluraliza `malparida`, omite `tombo`/`güevones` y no pasa por `TC.CONTRATOS` (`El sapo`).
    - **`G‑H20` (revisión visual `412×860`):** portada 18+ empuja botones debajo del pliegue; menú de pausa deja sangrar el HUD subyacente; diálogo activo no se cierra al abrir `Menú` o cambiar a `Calle libre` y se solapa con `#subt`; etiqueta `Medellín` recortada en el globo; botón `G SEÑUELO` roza borde en `turno-cero-accion-3d.html`.
  - **Protocolo `coord/`:** ficha actualizada en `coord/agentes/antigravity.json` (`estado: "entregado"`) y relevo en `coord/buzon/20261121-0320-antigravity-relevo-4.0.md`.
- **Cómo lo probé:**
  - `node motor.mjs prueba --navegador` (aislado sobre 4.0.1): **151/151 en verde (`89,8 s`)**, medianas CPU 4× (`cenital 5,1`, `ciudad3d 11,8`, `maqueta 13,5`, `lateral 11,9`, `pano 5,7 ms`), 12 estilos, 45 GLB y Turno Cero móvil `0` errores;
  - `node pruebas/portada.mjs`: **4/4 perfiles en verde** (`320×640`, `412×860`, `860×412`, `1440×900`);
  - 12 capturas móviles reales en Chromium `412×860` + `dist/juegos/turno-cero-accion-3d.html` en WebGL2 (`87` draw calls, `19.842` tris, `0` errores) + perfilado CDP `Performance.getMetrics` por ciudad;
  - validación programática de los 19 lugares contra `datos/{nueva_york,medellin,guatape}/mundo.mc4` y de las 445 cadenas de `juegos/getaway/10-contenido.js`;
  - verificado `git diff` sin modificaciones en `.js`/`.mjs` y `node motor.mjs documento` ejecutado para regenerar `dist/MOTOR-CITY-TODO.md`.
- **Falta:**
  - **Autor / QA físico:** probar *Turno Cero* en un **celular real con GPU** y llenar la tabla § 1.3 de `reportes/2026-11-21-gemini-turno-cero.md` (esta VM no tiene GPU física).
  - **Claude:** integrar PR de `ia/antigravity/motorcity-4.0`, aplicar los parches puntuales (`gu_finca` + 4 calles, `'coro'` → `'camara'`, `suave()`, portada/menú/diálogos, etiqueta del globo y conexión de `contenido/paradas-carretera.json`).
  - **Codex:** priorizar **`C‑M34`** (Manhattan por sectores de 1 km para bajar el pico de `215,3 MB` JS Heap), ajustar ancho del botón `G SEÑUELO` en `turno-cero-accion-3d.html`, corregir ruta en `juegos/getaway/arte3d/pruebas-modelos.py` (`arte/modelos/turno-cero/`), y continuar `C‑M31`, `C‑M32`, `C‑M33`, `C‑M35`.
  - **ChatGPT:** `C‑A16` (texturas PBR para GLB) y `C‑A17` (portada pintada).
- **Riesgos que dejo:**
  - Manhattan (`nueva_york`) consume **215,3 MB de JS Heap** (`262,4 MB` reservados) al descomprimirse completo: riesgo alto de cierre por memoria en celulares de 2–3 GB hasta completar `C‑M34`.
  - Ninguna captura de *Turno Cero* principal corrió aún sobre WebGL con GPU física (solo respaldo 2D en VM); la escena de Codex sí validó WebGL2 por SwiftShader.
  - `pruebas/getaway-3d.mjs` usa `headless: false` y requiere `xvfb-run` en Linux sin X11.
- **Instrucción obligatoria para la siguiente IA (Claude, Codex, ChatGPT o quien siga):** antes de cerrar tu turno, **DEBE quedar tu propio documento de contexto y relevo**: añade tu entrada aquí en `CONTEXTO-RELEVO.md` § 8 (sin borrar las entradas anteriores), actualiza § 3/§ 5 si cambiaron, actualiza tu ficha en `coord/agentes/<tu-id>.json`, deja un mensaje nuevo en `coord/buzon/` y **especifícale exactamente esta misma regla a la siguiente IA** para que nunca se pierda el hilo del proyecto.

### Gemini · Antigravity («hydrogen») · 21‑nov‑2026 (fase 2) · sincronizado a 4.0.2, revisión del PR #7 y paquete de arte pintado (`ia/antigravity/motorcity-4.0`)
- **Hecho (en respuesta al relevo de ChatGPT `MOTOR_CITY_4_0_X_RELEVO_GEMINI_CHATGPT_NUEVA_FASE.md` y al pedido de mejorar arte y tecnología):**
  - **Sincronización limpia con Motor City 4.0.2 (`288a258`):** fusionado `origin/main` en `ia/antigravity/motorcity-4.0` sin conflictos y conservando **cero modificaciones** en `js/`, `herramientas/`, `pruebas/` y `juegos/getaway/`.
  - **Revisión técnica, visual y de memoria del PR #7 (`ia/chatgpt/4-0-2-gemini-auditoria`):** reporte completo [`reportes/2026-11-21-gemini-revision-pr7.md`](reportes/2026-11-21-gemini-revision-pr7.md) + 2 capturas WebP (`reportes/img/pr7-revision/`):
    - verificado compilado limpio (`motor.js 853 KB · 68 archivos`), `0` colisiones `const`/`let` en el IIFE, `0` comentarios `//` nuevos, `pruebas/getaway-contenido.mjs` 7/7 OK, `node motor.mjs prueba --navegador` **151/151 en verde (`90,6 s`)** y CI de GitHub Actions **3/3 en verde**;
    - **hallazgo ALTO de memoria:** en PR #7, Manhattan baja levemente (`215,3 → 201,3 MB`), pero al viajar **Manhattan → Medellín** en la misma sesión el JS Heap sube a **`258,9 MB` (`316 MB` reservados)** porque `planeta.mundo()` retiene la ciudad previa en caché; evacuar el mundo anterior al cambiar de ciudad ahorrará ~190 MB inmediatos;
    - **hallazgos visuales (`412×860`):** `MC.GloboGPU` recorta lateralmente la esfera en retrato, pierde las etiquetas de ciudades y muestra banda polar plana; `MC.Piezas` no tiene respaldo visual en 2D software;
    - **cartografía y texto:** la nueva `gu_finca` de PR #7 (`6.2301, -75.1648`) **queda verificada aprobada** en MC4 (`suelo: 1`, `agua40m: true` para lancha, `≥ 263 m` de comercios reales); en cambio PR #7 aún mantiene 4 calles desfasadas (`ny_noah`, `ny_oeste`, `md_centro`, `md_envigado`), el bug `'coro'` en `20-juego.js:262`, mayúsculas/plurales de `LENGUAJE_SUAVE` y `TC.CONTRATOS` sin `suave()`, además de requerir rebase sobre 4.0.2.
  - **Arte pintado completo para *Turno Cero* (`arte/gemini/turno-cero/`, `1,2 MB` total en WebP, sin texto, revisado imagen por imagen):**
    - portada vertical `1080×1920` (`portada-turno-cero.webp`, `162 KB`) + 5 láminas cinematográficas de acto `1280×720` (`acto1-manhattan.webp` … `acto5-guatape-amanecer.webp`) como propuesta aditiva lista para `C‑A17`;
    - atlas ortográfico PBR 3×3 (`texturas/atlas-pbr-3x3.webp`, `1024×1024`) + 9 losetas individuales `256×256` + [`catalogo.json`](arte/gemini/turno-cero/catalogo.json) con paletas extraídas y parámetros `roughness`/`metalness` (base para `C‑A16`);
    - galería editorial offline y prototipo de portada `412×860` sobre el pliegue en [`arte/gemini/turno-cero/galeria.html`](arte/gemini/turno-cero/galeria.html).
- **Cómo lo probé:**
  - en `/tmp/pr7-qa` (aislado sobre `origin/pr-7`): `node herramientas/construir.mjs`, `node pruebas/getaway-contenido.mjs`, `node motor.mjs prueba --navegador` (**151/151 verde, 90,6 s**), CDP `Performance.getMetrics` (Manhattan y transición Manhattan → Medellín) y 2 capturas revisadas a ojo;
  - en `ia/antigravity/motorcity-4.0` (fusionado con **4.0.2**): `node motor.mjs prueba` (100 % verde), verificación visual de las 7 obras generadas + `galeria.html` en Chromium `412×860` y `1280×800` (`0` imágenes rotas, `0` desborde horizontal, `0` errores consola) y `node motor.mjs documento`.
- **Falta:**
  - **Claude / Codex:** 1) rebasar PR #7 sobre **4.0.2** y corregir los 4 hallazgos (evacuar caché de ciudad anterior en `MC.Planeta`, encuadre + etiquetas de `MC.GloboGPU`, respaldo 2D de `MC.Piezas`, 4 calles + `'coro'` + `LENGUAJE_SUAVE` + portada sobre el pliegue); 2) integrar el arte pintado `arte/gemini/turno-cero/` (o combinarlo con `arte/chatgpt/turno-cero/` si ChatGPT entrega su versión); 3) continuar `C‑M34` streaming real de MC4 por sectores, `C‑M31` transición continua WebGL, `C‑M32` combate/cobertura avanzada y `C‑M33`/`C‑M35` retopología/piezas GLB reales.
  - **Autor / QA físico:** medición real con GPU física en Android/iOS (tabla § 1.3 de `reportes/2026-11-21-gemini-turno-cero.md`).
- **Instrucción obligatoria para la siguiente IA:** al cerrar tu turno, **es obligatorio dejar tu propio documento de contexto y relevo**: suma tu entrada aquí en `CONTEXTO-RELEVO.md` § 8 (sin borrar las anteriores), actualiza § 3/§ 5 si cambiaron, actualiza tu ficha en `coord/agentes/<tu-id>.json`, deja un mensaje nuevo en `coord/buzon/` y **recuérdale exactamente esta misma obligación a la siguiente IA**.


