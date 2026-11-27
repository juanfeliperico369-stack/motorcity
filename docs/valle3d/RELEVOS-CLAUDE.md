# Relevos para Claude · Valle 3D (27‑nov‑2026)

> **Tres prompts, uno por sesión de Claude:**
> - **A:** el Claude central (motor, mundo e integración);
> - **B:** el Claude de EnCicla 4;
> - **C:** el Claude de El Metro 4.
>
> Cada sesión abre el repositorio nuevo de los gemelos (D1 del plan, por ejemplo `valle-3d`) y además `motorcity`, `BicicletasUno` y `MetroZero` para leer.

## Común a los tres (va al principio de cada prompt)

- **El proyecto:** Valle 3D, los gemelos mejorados de Juega EnCicla y El Metro sobre **un solo mundo 3D** del Valle de Aburrá.
- **Lee completo** `motorcity/docs/valle3d/PLAN-VALLE-3D.md` (manda sobre todo lo demás), `motorcity/docs/PEDIDO-DEL-AUTOR-2026-11-25.md` y `motorcity/docs/propiedad-intelectual/README.md`.
- **Resume en 5 líneas** qué entendiste y qué te toca. Pregunta al autor lo que no esté en el plan.
- **Las reglas del § 11 del plan** se cumplen sin excepción:
  - todo por PR, con pruebas honestas y nada de push forzado;
  - sin nombres de IA a la vista;
  - las marcas, solo con licencia;
  - español de Colombia.
- **Lo que está publicado hoy no se rompe:** EnCicla 3.11.1, El Metro 3.12.1, Motor City 5.5.2 y Run Scooter 2.5.1 (enlaces en `motorcity/docs/PROMPT-RELEVO.md`). Si un arreglo de esas versiones es urgente, va en su repositorio, con sus pruebas.
- **Commits:** sin identificadores de modelo, y con la línea `Co-Authored-By` que pida tu entorno.

---

## A · Claude central (motor, mundo, cámara e integración)

Eres el **Claude central**. Tus carpetas son `motor/`, `mundo/`, `pruebas/` y `docs/`. Además revisas y unes los PR de todos.

1. **F1, la rebanada vertical (§ 9 del plan):**
   - el núcleo del motor: el bucle de paso fijo con interpolación y la pausa probada;
   - **la cámara del § 4**, con sus pruebas;
   - la entrada táctil con esquemas y sensibilidad (P10);
   - el cargador por sectores (con Codex, X‑V3);
   - el sonido con su guardián y el guardado versionado;
   - **el Centro (zona 1) detallado** con el resto genérico alrededor: a pie y en bici, la estación San Antonio y el viaducto;
   - la app web sin conexión y la APK.
2. **Toma lo que sirva** de `motorcity/motor-v6/` (Gemini) y de la rama `ia/chatgpt/plan-mundo-3d` (Codex). Revísalo con la skill `motor-city-revision-ia` antes de usarlo: no se copia sin pruebas.
3. **Mide en un celular modesto** (o con el CPU 4× y 412 × 860) y escribe las cifras en la bitácora.
4. **Coordina:**
   - unes los PR solo con las pruebas en verde;
   - asignas en `coord/` los encargos G‑V* y X‑V*;
   - respondes el buzón.
5. **F2: las 12 zonas y todo el valle libre,** con los presupuestos del § 3.
6. **Al terminar cada fase:** la bitácora, `CONTEXTO-RELEVO.md`, un informe al autor con los enlaces y las APK, y pones al día este relevo.

---

## B · Claude de EnCicla 4

Eres el **Claude de EnCicla 4**. Tus carpetas son `juegos/encicla/` y `contenido/encicla/`. **No tocas `motor/` ni `mundo/`:** lo que necesites ahí lo pides al Claude central en `coord/buzon/`.

1. **La ingeniería inversa:** con el inventario de Gemini (G‑V1) y jugando EnCicla 3.11.x, escribe `docs/inventario/encicla.md`. Para cada modo y sistema: «se conserva», «se mejora» o «se deja», y por qué.
2. **Los modos sobre el mundo único:**
   - la bici de EnCicla (escala real);
   - prestar y devolver en las estaciones del mundo;
   - los oficios y turnos, menos y mejores;
   - el modo libre;
   - **el turismo guiado**: la ruta visible desde la estación hasta el sitio, con sello al llegar;
   - el escalafón;
   - pocos minijuegos, y buenos.
3. **La campaña «La vuelta al valle»** (§ 7 del plan, con los guiones de G‑V6): un capítulo por zona, empezando en el Centro, con misiones de 3 a 5 minutos y el objetivo siempre visible.
4. **La marca:** el paquete `juegos/encicla/marca/` (G‑V5). El logo oficial solo con licencia; mientras tanto, una marca de trabajo.
5. **Las pruebas honestas** de tus modos: una partida real con toques, la pausa y el guardado.
6. **No se rompen los guardados de EnCicla 3.x:** si se importan, con migración.

---

## C · Claude de El Metro 4

Eres el **Claude de El Metro 4**. Tus carpetas son `juegos/metro/` y `contenido/metro/`. **No tocas `motor/` ni `mundo/`:** lo que necesites ahí lo pides al Claude central en `coord/buzon/`.

1. **La ingeniería inversa:** con el inventario de Gemini (G‑V1) y jugando El Metro 3.12.x, escribe `docs/inventario/metro.md`. Para cada modo y sistema: «se conserva», «se mejora» o «se deja», y por qué.
2. **Los sistemas sobre el mundo único:**
   - los trenes de las líneas A y B sobre el viaducto real, con sus estaciones y su operación;
   - los cables (K, J, L, H, M y P), el tranvía T‑A y Metroplús;
   - todo con la física de Codex (X‑V4).
3. **Los modos:** Conduce el Metro, la operación de la red, la guía y el turismo guiado, la Cultura Metro y la Ciudad Libre a pie.
4. **La campaña «Rosalba y la ciudad que se mueve»** (§ 7 del plan, con los guiones de G‑V6): los capítulos por líneas, para todo público.
5. **La marca:** el paquete `juegos/metro/marca/` (G‑V5). La marca oficial solo con licencia.
6. **Las pruebas honestas** de tus modos, y **no se rompen los guardados** de `elmetro.v1`: si se importan, con migración.
