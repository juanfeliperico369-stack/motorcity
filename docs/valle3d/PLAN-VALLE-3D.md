# Plan Valle 3D · Los gemelos mejorados de EnCicla y El Metro sobre un solo mundo 3D (27‑nov‑2026)

> **Qué une este plan, y por qué manda:**
> - el pedido del autor del 27‑nov (§ 1, palabra por palabra);
> - la auditoría y el plan v6 de Gemini/Antigravity (`docs/AUDITORIA-CRITICA-2026-11-27.md`, `docs/PLAN-RECONSTRUCCION-3D-V6.md` y `motor-v6/`);
> - la auditoría y el plan de ChatGPT/Codex (ramas `ia/chatgpt/auditoria-integral-20261127` y `ia/chatgpt/plan-mundo-3d`);
> - lo hecho por Claude hasta las versiones del 27‑nov.
>
> Donde chocan, **manda este documento**. Lo que este plan no decide, lo decide el autor (§ 2).

## 1. Lo que pidió el autor (27‑nov‑2026, palabra por palabra)

> «Sí hazlo, haz lo mejor posible, construye bien esa cámara de juego que es crucial, y empieza nuevamente con el mapa y ahora sí en 3D, con las zonas que propongo ya bien detalladas mientras que el resto de la ciudad fuera de esas zonas sean genéricas, para ahorrar peso y ser más fluido, mientras se sigue manteniendo todo el valle completo y libre de jugarse. Lo ideal con esto es al fin aplicar una campaña de historia divertida para todo el público que no conoce y conoce sobre el metro y encima, obviamente cada uno por aparte, y que ahora así estos dos juegos sí compartan un mismo mapa con mismos diseños, y con todo lo mismo, cambiando únicamente los modos de juego ya planteados de cada videojuego, y la marca, pero también manteniendo el mismo mundo abierto único. Y antes de que inicies te propongo algo para poder reconstruir nuevamente desde cero aplicando ingeniería inversa a los juegos actuales para mejorarlos en su gemelo mejorado […]»

**En una frase:** un solo mundo abierto 3D del Valle de Aburrá, con zonas emblemáticas detalladas y el resto genérico pero completo y libre. Sobre él corren dos juegos hermanos, Juega EnCicla y El Metro, que solo cambian sus modos, su campaña y su marca. Los dos se construyen de cero como **gemelos mejorados** de los actuales.

## 2. Decisiones

**Ya decididas por el autor:**
- **D‑A · El mapa de nuevo, en 3D de verdad:** las zonas del autor bien detalladas, el resto genérico, y todo el valle completo y libre.
- **D‑B · Un solo mundo para EnCicla y El Metro:** el mismo mapa, los mismos diseños, todo igual. Cambian solo los modos de juego y la marca.
- **D‑C · Una campaña de historia divertida por juego,** para todo público, para quien conoce los sistemas y para quien no.
- **D‑D · La cámara es lo crucial:** una sola, cenital, que se acerca hasta casi tercera persona (§ 4).
- **D‑E · Gemelos por ingeniería inversa:** se rescata lo que vale de los juegos actuales (contenido, datos, mecánicas que funcionan) y se rehace limpio (§ 8).

**Esperan al autor (Claude recomienda una opción para cada una):**

| # | Decisión | Recomendación |
|---|---|---|
| D1 | ¿Dónde se construye? | **Un repositorio nuevo para los dos juegos y su mundo**, por ejemplo `valle-3d`. Un repositorio por juego volvería a copiar el mapa y a separarlo. |
| D2 | Las zonas detalladas | Las 12 del § 5.1. Confírmalas, quita o agrega. |
| D3 | ¿Se deja la regla del «HTML único» para los gemelos? | **Sí, para los gemelos:** una app web instalable que funciona sin internet, más su APK, con el mundo en archivos por sector. Funciona igual sin conexión, arranca más rápido y gasta mucha menos memoria. Los juegos actuales siguen como están. |
| D4 | Los nombres de los gemelos | Mientras se decide, «EnCicla 4» y «El Metro 4». La marca oficial solo con licencia de sus dueños. |
| D5 | Los personajes de las campañas | **Personajes propios del autor.** Rosalba, de El Metro, ya es suya. Los personajes de la lámina de EnCicla solo con permiso. |
| D6 | La primera zona (la rebanada vertical) | **El Centro:** San Antonio, Parque Berrío y Plaza Botero. Ahí se cruzan las líneas A y B, el tranvía y varias estaciones EnCicla, así que sirve a los dos juegos desde el día 1. |

## 3. La arquitectura

```text
valle-3d/                      (repositorio nuevo; mientras tanto se prepara en motorcity/docs/valle3d)
├── motor/                     el motor (sale de motor-v6, revisado): módulos ES nativos, sin parches encima de parches
│   ├── nucleo/                bucle de paso fijo a 60 Hz con interpolación del dibujo, reloj y pausa probada
│   ├── camara/                la cámara única (§ 4)
│   ├── entrada/               táctil (palanca fija o flotante y botones), teclado y mando; esquemas y sensibilidad (P10)
│   ├── render/                Three.js en una versión fija y local, instancias, niveles de detalle, recorte por cámara, atlas de texturas
│   ├── mundo/                 sectores por cercanía: cargar, armar en un trabajador y soltar; capa detallada y capa genérica
│   ├── fisica/                a pie, bici, carro y bus; trenes y cables sobre su riel (escala real: 1 unidad = 1 m)
│   ├── sonido/                mezcla, música y el guardián del sonido (P8)
│   ├── guardado/              versionado, con migraciones y sin borrar nunca un campo
│   └── ui/                    componentes accesibles (botones ≥ 44 px, textos que no se recortan)
├── mundo/                     EL MUNDO ÚNICO (lo comparten los dos juegos)
│   ├── fuentes/               el registro de cada fuente: OSM/Overture (ODbL), SRTM, GeoMedellín (si la licencia sirve), con fecha
│   ├── tuberia/               Python (sale de motor-valle): sanea, mide, empaqueta por sector y valida
│   ├── zonas/                 una ficha por zona detallada: polígono, medidas, fuentes y nivel de confianza
│   ├── generico/              las reglas del resto del valle por comuna y bioma (ladrillo de ladera, torres, barrios)
│   └── sectores/              lo que sale: archivos binarios por sector, como `s_<i>_<j>.bin`
├── juegos/
│   ├── encicla/               SOLO modos, campaña, textos y marca de EnCicla
│   └── metro/                 SOLO modos, campaña, textos y marca de El Metro
├── contenido/                 textos y datos en JSON que el autor puede editar (misiones, diálogos, fichas, turismo)
├── pruebas/                   pruebas honestas (§ 11)
└── docs/                      el plan, los relevos, los inventarios y la bitácora
```

- **El presupuesto de un celular modesto** (Android 7 con WebView 119, iPhone 8):

  | Medida | Tope |
  |---|---|
  | Descarga inicial (motor, interfaz y la primera zona) | 15 MB |
  | Cada sector | 200 KB |
  | Memoria | 150 MB |
  | Velocidad mínima | 30 fps (60 en gama media) |
  | Mientras se carga el mundo | ningún cuadro de más de 100 ms |
  | Hasta poder jugar | 5 s |

- **Cómo se construye:** sin herramientas raras. Módulos ES servidos tal cual, con un service worker para jugar sin conexión y Capacitor para la APK. La única librería del juego es Three.js, en una versión fija.

## 4. La cámara (lo crucial)

**Una sola cámara.** No hay selector, ni maqueta, ni panorámica, ni primera persona. Base: `motor-v6/src/camara.js` (Gemini) y el seguimiento de rumbo de Codex. Se rehace como módulo propio, con sus pruebas.

1. **El acercamiento es continuo:**
   - pellizcar acerca y aleja, y la rueda del ratón también;
   - hay un botón 🎥 con 4 acercamientos fijos: de lejos, cenital, de cerca y casi tercera persona;
   - el ángulo va de **~70°**, mirando desde arriba, a **~32°**, casi tercera persona, por una curva suave;
   - el lente se abre al acercarse (de ~35° a ~55°), para no quedar en teleobjetivo.
2. **El seguimiento:**
   - el objetivo sigue al jugador con un resorte amortiguado, sin rebote;
   - la cámara mira **un poco adelante** del rumbo, más cuanto más rápido va (máximo ~25 % de la pantalla).
3. **El giro, gradual:**
   - al moverse, la cámara se va poniendo **detrás del rumbo** con un resorte que no depende de los cuadros por segundo;
   - tiene una zona muerta de ~10° y una velocidad máxima de giro;
   - quieto, no gira;
   - con dos dedos el jugador gira y la inclina a mano, y la cámara automática espera ~2,5 s antes de volver.
4. **Los controles van según la pantalla:** empujar hacia arriba siempre avanza hacia donde se ve arriba en la pantalla, aunque la cámara gire.
5. **Nada se interpone:**
   - si un edificio o un cerro queda entre la cámara y el jugador, la cámara se acerca (brazo con resorte);
   - lo que tapa al jugador se vuelve transparente con suavidad; no se usa tramado de ajedrez.
6. **Nunca hay saltos bruscos:**
   - al cambiar de vehículo, entrar a un túnel o subir al metro, la cámara pasa en ~0,4 s;
   - un botón la centra de nuevo;
   - hay una opción de «menos movimiento» para quien se marea.
7. **Las pruebas de la cámara:**
   - nunca queda dentro de un edificio;
   - el jugador siempre se ve;
   - el giro tarda lo prometido;
   - no tiembla (se comparan los cambios de un cuadro al siguiente);
   - el pellizco llega a los dos extremos;
   - todo con la cámara en un recorrido real del Centro.

## 5. El mundo único

### 5.1 Las zonas detalladas (D2: las que propuso el autor, según el plan v6; esperan su confirmación)

| # | Zona | Lo que tiene de los dos sistemas |
|---|---|---|
| 1 | **Centro:** Plaza Botero y San Antonio (la rebanada vertical, D6) | Metro A y B, tranvía, EnCicla |
| 2 | Eje Cívico: Parque de las Luces, Alpujarra y Pies Descalzos | Metro A, EnCicla |
| 3 | Parques del Río, con skate y parkour | Metro, ciclorruta del río |
| 4 | Unidad Deportiva Atanasio Girardot | Metro B (Estadio), EnCicla |
| 5 | Distrito Cultural Norte: Explora, Botánico y Parque de los Deseos | Metro A (Universidad), EnCicla, skatepark |
| 6 | Ciudad del Río: MAMM y su skatepark | Metro A (Industriales), EnCicla |
| 7 | Puente de la 4 Sur: skatepark y río | Metro A, ciclorruta del río |
| 8 | El Poblado: Parque Lleras y Provenza | Metro A (Poblado), EnCicla |
| 9 | Cerro Nutibara y Pueblito Paisa | Metro A (Industriales), mirador |
| 10 | Comuna 13: Escaleras Eléctricas y San Javier | Metro B (San Javier), Metrocable J |
| 11 | Corredor del tranvía de Ayacucho y Museo Casa de la Memoria | Tranvía T‑A, cables M y H |
| 12 | Santo Domingo Savio: Metrocable línea K y laderas | Metrocable K, Metro A (Acevedo) |

### 5.2 Cómo es el mundo

- **Dentro de cada zona:**
  - las calles, los andenes, las ciclorrutas y los separadores con su **ancho real**;
  - los edificios con su huella y su altura reales;
  - los hitos modelados;
  - las estaciones del Metro y de EnCicla en su sitio.

  Cada medida guarda su **fuente, fecha, licencia y nivel de confianza** (regla de Codex). No se inventan medidas: lo que no se pudo medir queda marcado como «estimado».
- **Fuera de las zonas, todo el valle (de Caldas a Barbosa):**
  - la red vial real, completa;
  - los edificios genéricos, con la altura y el estilo de su comuna, dibujados como instancias. Así pesan casi nada y se ven como Medellín: ladrillo en ladera, torres en El Poblado, centros comerciales;
  - el relieve real (SRTM), con el río encajonado.
- **Nada pintado en el suelo (P3):** el suelo solo lleva lo plano (vías, andenes, pasto, agua y cebras). Árboles, postes, bancas, carros y estaciones son 3D, con niveles de detalle e instancias.
- **La infraestructura de los dos sistemas vive en el mismo mundo,** y cada juego la usa a su manera:
  - el viaducto y las estaciones del metro, los cables, el tranvía y Metroplús;
  - las estaciones y las ciclorrutas de EnCicla.
- **El día y la noche, la lluvia y la luz** son del mundo, iguales para los dos juegos.
- **La carga, de lo cercano a lo lejano:**
  - una cola por prioridad que tiene en cuenta la distancia, el rumbo y lo que ve la cámara inclinada;
  - el trabajo pesado se hace en un trabajador, fuera del hilo del juego;
  - nada cercano se cancela.

## 6. Los dos gemelos

| | Igual en los dos | Solo en EnCicla 4 | Solo en El Metro 4 |
|---|---|---|---|
| El mundo, el motor, la cámara y los controles | ✔ | | |
| La gente, el tráfico, el clima y la hora | ✔ | | |
| Cómo se mueve el jugador | a pie | **bici** (la de EnCicla, 1,78 m) y patineta en los skateparks | **trenes, cables, tranvía y buses** sobre su recorrido real |
| Los modos | | oficios y turnos (los 9 oficios, con menos y mejores turnos), el modo libre, el turismo guiado, el escalafón y unos pocos minijuegos buenos | Conduce el Metro, la operación de la red, la guía y el turismo, la Cultura Metro y la Ciudad Libre |
| La campaña | | la suya (§ 7) | la suya (§ 7) |
| La marca | | colores, logo, música y textos de EnCicla (con licencia) | colores, logo, música y textos de El Metro (con licencia) |

**Turismo, ahora de verdad:**
- el sitio se marca en el mundo;
- se sigue una **ruta visible** (flechas y camino) desde la estación hasta el sitio;
- se llega, se ve el dato y se gana un sello.

Así responde a la crítica de las auditorías.

## 7. Las campañas (borradores para que el autor los cambie)

**Las reglas de las dos campañas:**
- para todo público, sin violencia;
- misiones cortas, de 3 a 5 minutos;
- el objetivo siempre visible, con su ruta;
- con puntos de control;
- cada capítulo sucede en una zona detallada y enseña algo real del sistema;
- quien ya lo conoce encuentra datos y retos; quien no, aprende jugando.

**EnCicla · «La vuelta al valle»** (nombre provisional):
- **La historia:** alguien llega al valle (de otro país o de otra ciudad), se inscribe en EnCicla y descubre la ciudad pedaleando.
- **Lo que enseña:**
  - la inscripción;
  - prestar y devolver;
  - las ciclorrutas y la inteligencia vial;
  - el casco.
- **Los capítulos, uno por zona:** Centro → Eje Cívico → Distrito Norte → Ciudad del Río → Poblado.
- **Los oficios:** se van abriendo como trabajos de la historia (mecánico, rebalanceo, operador…).
- **El final:** la Ciclovía del domingo.

**El Metro · «Rosalba y la ciudad que se mueve»** (Rosalba ya es personaje del autor):
- **Los capítulos, por líneas:**
  - A: Niquía–La Estrella;
  - B: San Antonio–San Javier;
  - los cables;
  - el tranvía;
  - Metroplús.
- **Lo que enseña:**
  - la Cultura Metro;
  - la Cívica y los transbordos;
  - la seguridad.
- **Dónde se juega:** se maneja el tren y también se recorre la ciudad a pie desde cada estación.
- **El final:** los Alumbrados.

**Y el turismo de cada campaña:** al terminar un capítulo, se abren las fichas de esa zona.

## 8. La ingeniería inversa (cómo se rescata lo de hoy)

Para cada juego actual, una **ficha de rescate** en `docs/inventario/<juego>.md`:
1. **Qué tiene hoy:** cada modo y sistema, con «funciona y gusta», «funciona, pero se siente mal» o «roto», según las dos auditorías y una partida real.
2. **Qué se lleva al gemelo:**
   - **el contenido,** pasado a JSON: textos, misiones, consejos, fichas de turismo y datos de líneas y estaciones;
   - **los datos del mapa:** el Motor del Valle;
   - **el arte aprobado,** con su licencia.
   - **No se copia código parcheado:** se rehace limpio, con el mismo comportamiento que sí gustaba.
3. **Qué se mejora y qué se deja:** menos modos y mejores, como piden las auditorías.

**Los juegos actuales siguen publicados** (EnCicla 3.11.x y El Metro 3.12.x) hasta que su gemelo sea mejor en todo. Luego el autor decide cuándo se cambian los enlaces.

## 9. Las fases, con su muestra al final de cada una

| Fase | Qué se entrega | Cómo se sabe que está bien |
|---|---|---|
| **F0 · Preparar** (27‑nov, hecho en parte) | los arreglos para la muestra (EnCicla 3.11.1, El Metro 3.12.1, Motor City 5.5.2, Run Scooter 2.5.1), este plan, los relevos y el repositorio nuevo (D1) | las versiones publicadas y el repositorio creado |
| **F1 · La rebanada vertical** | el motor nuevo (núcleo, cámara, entrada, sectores, sonido y guardado) y **el Centro detallado** con el resto genérico alrededor: a pie y en bici, la estación San Antonio con el viaducto, la app web y la APK | se juega en el celular del autor a 30 fps o más; la cámara cumple el § 4; las pruebas honestas en verde |
| **F2 · Todo el valle** | las 12 zonas y el valle genérico completo y libre, con su carga por sectores | los presupuestos del § 3 en un recorrido de Caldas a Barbosa |
| **F3 · EnCicla 4** | sus modos, rescatados y mejorados; la campaña, capítulos 1–3; el turismo guiado | 5 personas que no lo conocen lo juegan 3 minutos y quieren seguir |
| **F4 · El Metro 4** | los trenes, cables, tranvía y Metroplús en 3D sobre su recorrido; sus modos; la campaña, capítulos 1–3 | lo mismo, con 5 personas |
| **F5 · Pulir y publicar** | la accesibilidad, las campañas completas, las APK firmadas para las tiendas y el registro DNDA de las versiones nuevas | listo para mostrar a las entidades |

**Después, si el autor quiere:** Turno Cero (18+, en su propio mundo) y Run Scooter sobre el mismo motor.

## 10. Quién hace qué

| Quién | Qué | Dónde trabaja |
|---|---|---|
| **Claude central** | el motor, el mundo único, la cámara, la integración, revisar todos los PR, las versiones y publicar | `motor/`, `mundo/`, `pruebas/` y `docs/` |
| **Claude EnCicla** | el gemelo de EnCicla: modos, campaña y marca | `juegos/encicla/` y `contenido/encicla/` |
| **Claude El Metro** | el gemelo de El Metro: modos, campaña y marca | `juegos/metro/` y `contenido/metro/` |
| **ChatGPT / Codex** | lo técnico pesado: la tubería de las zonas detalladas con su procedencia, el empaquetado por sectores, la física, las herramientas de rendimiento y las pruebas de punta a punta | ramas `ia/codex/*`, según `PROMPT-CHATGPT-CODEX.md` |
| **Gemini / Antigravity** | el arte y las texturas, las fichas visuales de las zonas, la interfaz de cada marca, los guiones de las campañas, el inventario del contenido y la revisión visual | ramas `ia/gemini/*`, según `PROMPT-GEMINI-ANTIGRAVITY.md` |

## 11. Las reglas (para todas las IA, sin excepción)

1. **Nadie sube directo a `main`.**
   - Se trabaja en una rama `ia/<agente>/<tema>` o en la rama de la sesión, con PR.
   - Solo se une con las pruebas en verde y la revisión del Claude central. Si Claude no está, se sigue `RELEVO-DE-RESPALDO.md`.
2. **Nunca se fuerza un push, ni se borra o reescribe la historia.** La historia de git es la prueba de autoría del autor.
3. **Cada IA trabaja en sus carpetas** (§ 10). Si necesita cambiar algo de otra, lo pide en `coord/buzon/`.
4. **Las pruebas son honestas** (las piden las auditorías):
   - sin teletransportes en las pruebas de juego: se usan toques y teclas reales;
   - una compuerta de fluidez y memoria a 412 × 860 mientras el jugador se mueve;
   - pruebas reales de la pausa, el sonido al salir y los controles;
   - revisión visual: ningún texto recortado, ningún botón de menos de 44 px, nada encima del HUD;
   - ninguna prueba que exija «al menos N modos»;
   - y la revisión de comentarios que se tragan código.
5. **No aparecen nombres de IA en lo que ve el jugador.** En los créditos va: «Creado y dirigido por [el autor], con asistencia de herramientas de IA».
6. **Marcas y datos:**
   - EnCicla, Metro de Medellín y sus signos solo con licencia de sus dueños;
   - OSM con su atribución ODbL;
   - nada de material ajeno sin permiso, como la lámina de la apertura y el cierre.
7. **Para niños:** no se recogen datos personales y no hay chat abierto.
8. **Español de Colombia** en todo lo que ve el jugador.
9. **Lo que no esté en este plan se le pregunta al autor.** Las IA ajustan cómo trabajan; nunca cambian la misión, la visión ni estas decisiones.

## 12. Qué recomienda Claude además
- **Primero la rebanada vertical (F1)** antes de construir todo el valle: si el Centro se siente bien en el celular, el resto se escala sin miedo.
- **Probar con personas reales al final de cada fase,** con 5 personas por juego. Se mide una sola cosa: ¿quieren seguir jugando a los 3 minutos?
- **El mundo sin marcas.** Los letreros de las estaciones son genéricos hasta tener la licencia, y la marca oficial entra como un «paquete» que se cambia sin tocar el mundo.
- **Todos los textos en JSON** (`contenido/`), para que el autor los cambie sin programar.
- **Registrar en la DNDA las versiones nuevas** al cerrar F1 y F3/F4, como «versión nueva» de cada obra.
