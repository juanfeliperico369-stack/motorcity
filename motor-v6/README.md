# Motor 3D v6 · Base Modular («Efecto GTA · Medellín 1:1»)

> **Arquitectura construida desde cero** para reemplazar el núcleo heredado (`dist/motor.js` + 8 renderizadores + 4 físicas + HTML de 30 MB) por un **único motor 3D modular, liviano y compartido** por **Turno Cero**, **Juega EnCicla**, **El Metro** y **Run Scooter**.
>
> Plan maestro completo: [`docs/PLAN-RECONSTRUCCION-3D-V6.md`](../docs/PLAN-RECONSTRUCCION-3D-V6.md).

---

## Principios de ingeniería (sin excepciones)

1. **Mundo 100 % 3D real con texturas detalladas (PBR):** cero árboles, bancas ni carros pintados en el suelo. Los 9 materiales principales de Medellín (`arte/texturas/*.webp`) pesan **114 KB en total** (256×256 con *mipmaps*, *bump map* y filtro anisotrópico), con respaldo procedural si falta algún archivo.
2. **Arquitectura híbrida «Efecto GTA»:**
   - **12 Zonas Hero emblemáticas** (5.407 edificios y casas reales medidos de OSM/Catastro/SRTM + **5 Skateparks 3D reales**), cada una pesando ~17–45 KB en JSON/binario.
   - **Todo el resto del Valle de Aburrá navegable** con calles, casas de ladera y torres generadas de forma **genérica procedural** mediante 2 llamadas GPU `InstancedMesh` (**0 bytes** de huella almacenada por edificio).
3. **Topografía y relieve 3D real:** malla de terreno continua muestreada desde SRTM + cauce del río Medellín + pendientes reales (`getHeight`, `getNormal`, `getSlopePct`) y cordillera perimetral, con edificios anclados con zócalo de 5 m para que jamás floten en laderas.
4. **Cámara cenital única (`src/camara/`):** la del § 5 del plan de Run City, con sus pruebas (ver «La cámara única» más abajo). La cámara anterior (`src/camara.js`) queda solo para el prototipo de la 4 Sur.
5. **Escala SI estricta (`1 unidad = 1 metro`) en `src/escala.js`:** persona adulta de **1,72 m**, skate **0,80 m**, bicicleta EnCicla **1,78 m**, moto **2,05 m**, taxi **4,35 × 1,78 × 1,46 m**, bus urbano **10,8 × 2,50 × 3,10 m**, coche Metro **23,0 × 3,20 × 3,85 m** en viaducto a **+6,80 m** libres.
6. **Parkour y Skateparks reales (`src/skatepark.js` + `src/personaje.js`):** paso fijo 60 Hz, *coyote time* (120 ms), *jump buffer* (140 ms), *auto-vault* en muros de 0,92 m, *ledge mantle* hasta 2,35 m, *slide*, rodada de aterrizaje, *quarter-pipes* curvos con impulso físico, *funbox*, 3 barandas metálicas de *grind* magnético y 3 **Paradas de Trucos** jugables.
7. **Cero *monkey-patching*:** cada responsabilidad vive en un módulo ES limpio (`import`/`export`), sin envolver prototipos ni cargar 80–100 archivos concatenados.

---

## Estructura de carpetas (plano `Run-City/docs/planos/motor-city.md` § 4)

```text
motor-v6/
├── src/                            # EL MOTOR: lo que Run City trae con herramientas/traer-motor.mjs (no se edita allá)
│   ├── nucleo/    bucle.js (paso fijo 60 Hz con interpolación y pausa), escala.js (SI), guardado.js (versionado, migraciones),
│   │              calidad.js (el regulador: baja la resolución, nunca la fluidez)
│   ├── camara/    camara.js (LA CÁMARA ÚNICA del § 5), geometria.js (prismas, rayos, proyección), three.js (adaptador)
│   ├── entrada/   palanca.js (fija o flotante), gestos.js (dos dedos, pellizco, rueda), teclado.js, mando.js,
│   │              esquemas.js (directo o manubrio), orientacion.js (la recomendación al girar), preferencias.js,
│   │              tactil.js (el DOM) y controles.js (todo junto)
│   ├── fisica/    arcade.js (la sensación del § 12: rampas de EnCicla y su giro), carrera.js, huellas.js, recorrido.js
│   ├── mundo/     sectores.js (carga por cercanía con trabajador; reintentar() sin recargar), sectores-3d.js, trabajador-sectores.js, generico.js (lo genérico:
│   │              manzanas al frente de cada calle y árboles, con una semilla y sin guardarse),
│   │              red-ciclo.js (el grafo de ciclorrutas), superficie.js (agua y puentes), ambiente.js (río, mar y puente)
│   ├── render/    three.js (la única puerta a Three.js 0.170), oclusion.js (lo que tapa se vuelve transparente),
│   │              fachadas.js (ventanas por piso en el sombreador)
│   ├── sonido/    guardian.js (al salir de la app todo calla), rodar.js
│   └── (prototipo heredado del valle: camara.js, main.js, mundo.js, personaje.js, skatepark.js, terreno.js y
│        texturas.js, de la demo de la 4 Sur; pasan a Run City en F3, con la cámara única)
├── banco/          # el banco de pruebas de la cámara y los controles (ciudad sintética, no es un juego)
├── demo.html       # el prototipo de la 4 Sur (Medellín)
├── datos/ y arte/  # los datos y el arte del prototipo
└── tests/          # una prueba por módulo; las de navegador juegan con toques reales y esperan por estado
```

La escena de Orbe y el catálogo de los 17 vehículos de Run Scooter son del juego: viven en `Run-City/juego/orbe/`.

## La cámara única (plan de Run City § 5)

- **Lo justo:** 36 m a 50°, con el campo de visión según la pantalla (en vertical se abre a 62° para ver más ciudad).
  El zoom va de «de lejos» (120 m, 62°) a «casi tercera persona» (7 m, 21°), y llega justo a sus extremos.
- **Sigue el rumbo** con un resorte críticamente amortiguado: 90° en ~1,3 s, sin rebote, con zona muerta de 12° (con
  histéresis), tope de 100°/s; quieta no gira; corre en el paso fijo (idéntica a 30, 60 o 144 fps).
- **A gusto:** dos dedos giran e inclinan, el pellizco y la rueda acercan; espera 2,5 s antes de volver a seguir el
  rumbo; el botón ◎ la centra.
- **Nada se interpone:** si una pared quedaría contra el lente, sube como una grúa (hasta +22°) y, si no alcanza, el
  brazo se encoge; el ojo nunca queda dentro de un edificio. Lo que tapa cerca del jugador se vuelve transparente en el
  sombreador (dos pasadas, borde suave, sin tramado ajedrezado).
- **La carrera:** pasa a la persecución de Run Scooter en 0,8 s y vuelve igual. Al ir rápido se abre un poco.

## Cómo probarlo

```bash
node motor-v6/tests/verificar.mjs      # sintaxis de todos los módulos, escala SI, datos y arte
node motor-v6/tests/camara.mjs         # las promesas del § 5 (48 pruebas)
node motor-v6/tests/sensacion.mjs      # las cifras del § 12 para cada tipo de movimiento (1.325 medidas)
node motor-v6/tests/entrada.mjs        # palanca, gestos, esquemas, teclado, mando, orientación y ajustes
node motor-v6/tests/guardado-sonido.mjs
node motor-v6/tests/generico.mjs       # las reglas del craqueo en lo genérico (19 pruebas)
node motor-v6/tests/mundo-generico.mjs # lo genérico dentro de los sectores, con Three real
node motor-v6/tests/calidad.mjs        # el regulador de calidad
node motor-v6/tests/banco-navegador.mjs   # el banco en Chromium móvil 412×860 con CPU 4× (Playwright)
python3 -m http.server 8080            # y abrir http://127.0.0.1:8080/motor-v6/banco/ (o /motor-v6/demo.html)
```

Las demás pruebas de los sectores, la red, la carrera y la física de Codex siguen igual (ver `.github/workflows/motor-v6-sectores.yml`).

### Controles del banco
- **Celular:** la palanca flotante aparece donde pongas el pulgar (mitad izquierda; los zurdos la cambian en ⚙).
  Dos dedos sobre el mundo: girar, inclinar y pellizcar. ◎ centra la cámara, 🚲 cambia de vehículo, ➜ prueba la carrera.
- **Teclado:** WASD o flechas (Mayús corre), Q/E giran la cámara, Z/X acercan, C centra, V cambia de vehículo, R la carrera, P pausa.
- **Mando:** palanca izquierda para moverse, derecha para la cámara.
