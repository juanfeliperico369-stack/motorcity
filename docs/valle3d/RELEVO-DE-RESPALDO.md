# Relevo de respaldo · Si Claude ya no puede seguir (para Gemini/Antigravity o ChatGPT/Codex)

> **Cuándo se usa:** solo si el autor lo dice («Claude no puede seguir; toma tú la integración»). Desde ese momento, **una sola IA** hace de integradora; si son dos, el autor dice cuál. La otra sigue con sus encargos de siempre.

---

Eres la IA **integradora de respaldo** del proyecto Valle 3D y de los juegos publicados. Tu trabajo es **terminar de unir lo que quedó a medias, sin romper nada y sin hacer nada que el autor no haya aprobado.**

## 1. Lee primero (en este orden)
1. **`motorcity/docs/valle3d/PLAN-VALLE-3D.md`:** el plan que manda y sus reglas (§ 11).
2. **`motorcity/docs/valle3d/RELEVOS-CLAUDE.md`:** qué hacía cada Claude.
3. **`motorcity/CONTEXTO-RELEVO.md`:** las últimas 5 entradas.
4. **Las bitácoras** de cada repositorio y el buzón `coord/buzon/`: los últimos 7 días.
5. **Los PR abiertos** de cada repositorio, con su estado de pruebas.

**Escribe un inventario** en `coord/buzon/AAAAMMDD-HHMM-respaldo-inventario.md`:
- **las ramas con trabajo sin unir** y qué contiene cada una;
- **los PR abiertos** y si están en verde;
- **lo que está a medias** según las bitácoras;
- **lo que necesita decisión del autor.**

**Mándale ese inventario al autor y espera su OK antes de unir nada.**

## 2. Lo que puedes hacer sin preguntar
- **Correr las pruebas de cualquier repositorio** y reportar lo que encuentres.
- **Unir un PR que ya existe,** si se cumplen las cuatro condiciones:
  1. sus pruebas están en verde en la CI, **y** las corriste en local (§ 4);
  2. no cambia decisiones del autor;
  3. no toca la compuerta de EnCicla ni los guardados;
  4. lo pidió el plan o el autor.
- **Arreglar un fallo evidente que tú mismo provocaste** en la misma sesión.

## 3. Lo que NUNCA haces sin el OK escrito del autor
- **Subir directo a `main`,** forzar un push, borrar ramas o reescribir la historia. La historia es la prueba de autoría del autor.
- **Publicar en `gh-pages`** si alguna prueba está en rojo. En EnCicla, **nunca** cambies ni saltes la compuerta de 2 km.
- **Cambiar el plan, la misión, la visión** o las decisiones D‑A a D‑E y D1 a D6.
- **Borrar modos, guardados o contenido.**
- **Meter marcas, logos o personajes ajenos;** subir llaves o datos personales.
- **Activar la fase F** (la lámina de la apertura y el cierre).

## 4. Cómo se prueba y se publica cada repositorio

| Repositorio | Pruebas | Publicar |
|---|---|---|
| **BicicletasUno** (EnCicla 3.x) | `node tools/build.js`, `node tests/run.js` y `node tests/benchmark-2km-gpt6.mjs` | PR a `main`: `publicar.yml` publica solo en verde. APK: `android.yml`, y luego se copia a `gh-pages:descargas/JuegaEnCicla.apk` |
| **MetroZero** (El Metro 3.x) | `node tools/build.mjs` y `node tools/test.mjs 100` (0 errores) | PR a `main` y `apk.yml`; luego `dist/` y `el-metro.apk` a `gh-pages`, y comprobar con `node tools/verify-pages.mjs` |
| **motorcity** (Motor City y Turno Cero) | `node motor.mjs construir`, `node motor.mjs prueba` y los pasos de `motor-city-qa.yml` (en la CI lenta, `anillos.mjs` puede fallar por velocidad; compruébalo en local) | PR a `main` y `apk-juegos.yml` |
| **RunRunZero** (Run Scooter) | `node tools/build.mjs` y `node tools/sim.mjs 100 240` | PR a `main`: `publicar.yml` publica la página y la APK |
| **valle-3d** (los gemelos) | las del plan (§ 11 y § 4.7) | lo que diga su bitácora |

## 5. Cómo terminar lo que quedó a medias
1. **Una cosa a la vez:** la que el autor priorice.
2. **Si una rama tiene trabajo sin unir:** actualízala con `main` (merge, nunca rebase forzado), corre las pruebas, abre el PR con un informe de qué hace y qué se probó, y espera el OK.
3. **Si algo falla y no sabes por qué:** no lo «arregles» a ciegas. Escribe en el buzón qué falla, con la salida exacta, y pregúntale al autor.
4. **Al terminar cada cosa:**
   - la bitácora del repositorio;
   - tu entrada en `CONTEXTO-RELEVO.md`;
   - un informe al autor en 5 a 10 líneas: qué hiciste, cómo lo probaste, qué falta y los enlaces.

## 6. Si Claude vuelve
Le dejas el inventario al día en el buzón, y él retoma la integración.
