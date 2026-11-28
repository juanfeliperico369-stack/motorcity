# Instrucciones para agentes (Codex, Gemini, Claude, Cursor…)

> **PLAN VIGENTE (28‑nov‑2026): Run City.** Está en el repositorio **`Run-City`**: `docs/PLAN-RUN-CITY.md`, `docs/RELEVOS.md` y `docs/PROMPTS-ARRANQUE.md`. Run City es el juego central, sin marcas: el nuevo Run Scooter. Empieza en la isla de Orbe y sigue en el Valle de Aburrá, sobre **Motor City 6**, que vive aquí en `motor-v6/` y se rehace desde cero con los planos (`Run-City/docs/planos/motor-city.md`). Después vienen EnCicla y El Metro sobre el mismo mundo, y al final Turno Cero. El plan «Valle 3D» (`docs/valle3d/`) quedó **reemplazado**. **Nadie sube directo a `main`.**

> **Plan vigente (27‑nov‑2026): `docs/valle3d/PLAN-VALLE-3D.md`.** Es un solo mundo 3D del Valle de Aburrá: las zonas del autor detalladas, el resto genérico y todo el valle libre. Sobre él van los **gemelos mejorados de EnCicla y El Metro**: el mismo mapa, cambian los modos, la campaña y la marca. La cámara única es lo crucial. Relevos: Claude central, EnCicla y El Metro en `docs/valle3d/RELEVOS-CLAUDE.md`; Gemini en `docs/valle3d/PROMPT-GEMINI-ANTIGRAVITY.md`; Codex en `docs/valle3d/PROMPT-CHATGPT-CODEX.md`. Si Claude no puede seguir: `docs/valle3d/RELEVO-DE-RESPALDO.md`. **Nadie sube directo a `main`.**

> **Pedido vigente del autor (25‑nov‑2026), manda sobre lo demás: `docs/PEDIDO-DEL-AUTOR-2026-11-25.md`.** Pide el mundo 3D cenital con **una sola cámara**: centrada, se mueve, se acerca hasta casi tercera persona, y las demás cámaras se eliminaron. Pide también que **nada quede pintado en el suelo**, el 2D y el pixel solo en los modos ya establecidos, la carga del mundo sin huecos, la fluidez y los controles a gusto. Está palabra por palabra, con lo hecho y las fases que faltan. Léelo antes de tocar cámaras, vistas o el arte del mundo.

> **Relevo vigente (26‑nov‑2026): `docs/PROMPT-RELEVO.md`.** Lo primero son **las muestras del autor (hacia el 28‑nov)**: pulir y probar sin romper. Después vienen las fases B–E del pedido (fluidez, controles, nada pintado en el suelo y EnCicla en 3D). La fase F, la lámina de la apertura y el cierre, **es solo un plan hasta que el autor diga**. Ya están hechas y publicadas: la cámara única, el guardián del sonido, la fase A y el 🧭 modo turismo (EnCicla 3.11.0, El Metro 3.12.0 y Motor City 5.5.1). La propiedad intelectual (lo que es del autor, el registro en la DNDA y los modelos) está en `docs/propiedad-intelectual/`, y el aviso en `AVISO-LEGAL.md`. El relevo anterior, el «renacimiento cenital» con sus 5 fases, quedó en `docs/relevos/`. La misión y la visión están en `docs/VISION-Y-MISION.md`.

> **Primero lee `CONTEXTO-RELEVO.md`:** el relevo entre IAs (plan, lo hecho, lo que falta y el protocolo `coord/`). Al terminar tu turno, **deja tu entrada en su § 8** y tu ficha en `coord/agentes/`. Pídele lo mismo a la IA que siga.


> **¿Te dijeron «mira el repositorio y haz tu parte»?** Abre **`TAREAS-IA.md`**: la lista corta de tu IA, en orden. Gemini con Antigravity usa ahora «hydrogen» (tareas fáciles); ChatGPT con Codex usa «astra» (arte y código fuertes).

**Lee primero `docs/DOCUMENTO-UNICO.md`** (todo el contexto, el código a usar y el plan de cada IA). Después, si vas a tocar el motor: `CONTEXTO-IA.md` → `MOTOR.md` → `CONTRIBUIR.md`. Todo junto en un archivo: `node motor.mjs documento` → `dist/MOTOR-CITY-TODO.md`.

Las skills del proyecto están en `.agents/skills/` (Gemini CLI, Antigravity, Codex y Cursor las cargan solas) y en `.claude/skills/` (Claude Code). **Síguelas aunque no seas Claude:**

| Skill | Para qué |
|---|---|
| `motor-city-desarrollo` | Desarrollar el motor |
| `motor-city-territorio` | Mapas y mundos |
| `motor-city-juegos` | Hacer juegos |
| `motor-city-ciencia` | Números reales |
| `motor-city-arte` | Arte |
| `motor-city-web-moderna` | Plataforma web moderna y Baseline (basada en Modern Web Guidance) |
| `motor-city-diseno-ui` | Auditoría anti-clichés de IA para HUD y portadas (basada en Hallmark) |
| `motor-city-qa-playwright` | QA táctil `412 × 860`, inspección visual y telemetría con Playwright |
| `motor-city-revision-ia` | Revisión de PRs IA, procedencia de plugins y simulación como hipótesis |

Catálogo de plugins externos verificados y sus comandos de instalación: `docs/SKILLS-Y-PLUGINS.md`.

**Integra las skills con un comando (5.3.1):** `node motor.mjs skills --integrar --agente antigravity` (o `gemini-cli`). Revisa en la lista de skills de tu IA que aparezcan. Los pasos y las reglas, para pasárselos a otra IA: `docs/PROMPT-SKILLS.md`.

**Comandos:** `node motor.mjs construir` · `node motor.mjs prueba --navegador` (todo en verde) · `node motor.mjs reporte "título" --juego X` (obligatorio si cambias el motor desde otro juego) · `node motor.mjs documento`.
