# El pedido del autor (25‑nov‑2026): el mundo 3D cenital con una sola cámara

> **Para toda IA (Claude, Codex, Gemini, Antigravity, Cursor…):** este pedido manda sobre cualquier plan anterior de cámaras o vistas. El autor dijo que **la petición «se perdió» entre IAs**. Aquí queda **palabra por palabra**, para que no vuelva a pasar. Antes de tocar una cámara, una vista o el arte del mundo de cualquier juego, léelo.

## 1. Lo que dijo el autor (literal)

**Primer mensaje** (después de jugar EnCicla 3.9.0, El Metro 3.10.0 y Turno Cero 5.4.1):

> «Ya lo jugué, y la petición que pedí desde la anterior IA aparentemente se perdió, y era que el juego debía ser totalmente en un mundo 3D en cenital con partes 2D y de pixel art para algunos modos de juego ya establecidos y para en general hacer los detalles y texturas del mundo con mejor diseño en sus gráficos. El mundo en tercera persona no carga en totalidad ni aunque avances más, hay que pensar en forma ingeniosas para hacer la carga del mundo y mejorar su fluidez y optimización. El moviendo de ningún juego aún está a la altura de la fluidez que tiene EnCicla. EnCicla tiene un bug en la pantalla de inicio y es que no carga el panel de la animación y el el bug que tiene el metro y también EnCicla es la mala optimización de la música ya que cuando se sale de la app aún sigue sonando la música, de lo cual también carece turno cero y este también le pesa aún la mala fluidez. En todos los videojuegos aún falta mejorar los controles y la sensibilidad, además de agregar otras formas y hacerlo personalizable al gusto y darle recomendaciones dependiendo si se juega en vertical o horizontal. Hay que lograr un balance perfecto en la creación del mundo enteramente en un 3D, para jugarse en vista cenital de camara más bien centrada y que se puede mover al gusto, hacercarse y alejarse, y así añadiría un poco la forma de tercera persona, el mundo no sería tan pesado si fuera enteramente hecho 3D ya que tiene ayuda de híbridos, pero si necesito que nada quede pintado en suelo para dar la ilusión de vista cenital.»

**Segundo mensaje:**

> «Hay que eliminar las "camaras", la de maqueta, la de panorámica 2D, etc. Ya dije que debe prevalecer
> Y haz que en encicla aparezca el escalafón como botón en la pantalla de inicio, porque para ir a el hace falta ingresar al mundo abierto y luego salirse de allí, eso no es ideal»

**Tercer mensaje** (al aprobar el plan; con una lámina de EnCicla, «Un día en EnCicla · Para la apertura y el cierre»):

> «Sí, hazlo, publica y el plan está bien, ya veremos sobre la marcha»
>
> «Agrega todo esto al videojuego de encicla» … «Haz lo de la imagen al final del plan»

La lámina está en el repositorio de EnCicla: `docs/referencias/2026-11-25-apertura-y-cierre.jpg` (detalle en § 4, fase F).

**Cuarto mensaje** (26‑nov; **cambia la fase F**):

> «Lo de la imagen no lo agregues todavía, mejor al final haces un plan de cómo lo vas a agregar, y hasta que no te diga que lo agreguemos lo dejamos ahí pendiente.
> Agrega a El Metro y EnCicla un modo turismo de la ciudad y las estaciones para todos aquellos que no conozcan los sistemas del Valle de Aburrá.
> También cuando termines las fases o antes de eso hazme el prompt de relevo, y hazme los documentos de derechos de autor para hacerlos validar en el derechos de autor de Colombia […] También patenta el motor. […] Al terminar necesito los videojuegos bastante funcionales y profesionales para las muestras, será esto en dos días […]»

## 2. Lo que pide, punto por punto

| # | Pedido | En los juegos |
|---|---|---|
| P1 | **Un mundo enteramente 3D**, jugado en **vista cenital**. | todos |
| P2 | **Una sola cámara**: centrada, que se mueve al gusto, se acerca y se aleja. Al acercarse, «un poco» de tercera persona. **Se eliminan las otras cámaras** (maqueta, panorámica 2D, etc.). | todos |
| P3 | **Nada pintado en el suelo** para fingir la vista cenital: lo que tiene altura (edificios, árboles, carros, postes…) es 3D de verdad. Los híbridos sirven para aligerar. | todos |
| P4 | **2D y pixel art solo en algunos modos ya establecidos**, no en el mundo. | todos |
| P5 | **Mejores detalles y texturas** en los gráficos del mundo. | todos |
| P6 | **La carga del mundo**: que cargue completo al avanzar, con ingenio; fluidez y optimización. | todos |
| P7 | **La fluidez del movimiento**: la de EnCicla es la vara; Turno Cero está por debajo. | El Metro y Turno Cero, sobre todo |
| P8 | **La música no debe seguir sonando al salir de la app.** | EnCicla, El Metro y Turno Cero |
| P9 | **La portada de EnCicla**: el panel de la animación no cargaba. | EnCicla |
| P10 | **Controles**: mejor sensibilidad, más formas de control, personalizables, con recomendaciones según se juegue en vertical o en horizontal. | todos |
| P11 | **El escalafón como botón en la portada de EnCicla** (antes había que entrar al mundo abierto y salir). | EnCicla |
| P12 | **La apertura y el cierre de estaciones** de la lámina «Un día en EnCicla». **PENDIENTE, solo como plan** (§ 4, fase F): no se agrega hasta que el autor diga. | EnCicla |
| P13 | **Un modo turismo** de la ciudad y las estaciones, para quien no conoce los sistemas del Valle de Aburrá. | EnCicla y El Metro |

## 3. Lo que ya quedó (25‑nov‑2026, Claude)

| Pedido | Hecho | Dónde |
|---|---|---|
| P2 | **La cámara única** en los tres juegos. Solo la cenital 3D, con cuatro acercamientos: de lejos, cenital, de cerca y casi tercera persona. De cerca baja hasta unos 36° y se va detrás del rumbo, y los controles giran con ella. Pellizcar acerca y aleja, y dos dedos giran e inclinan. Los guardados con otra cámara vuelven a la cenital. | EnCicla 3.10.0 (`src/js/99zz-camara-unica.js`), El Metro 3.11.0 (`src/js/36-libre.js`), Turno Cero en Motor City 5.5.0 (`js/34-camara.js`, `juegos/getaway/90-inicio.js`) |
| P8 | **El guardián del sonido**: al salir de la app todo calla, en cualquier pantalla, y al volver sigue lo que sonaba. En la APK lo avisa la actividad nativa. | EnCicla 3.9.1, El Metro 3.10.1 y Motor City 5.4.2 (`*sonido-guardian*`) |
| P9 | **La portada viva** de EnCicla: la animación sale a ~1,9 s en vez de quedar ~10 s en blanco (CPU 4×), mientras el mapa se arma. | EnCicla 3.9.1 (`src/js/98z-portada-viva.js`) |
| P11 | **🏆 Escalafón** en la portada de EnCicla, directo a su pestaña. | EnCicla 3.9.1 (`src/js/98n-abierto.js`) |
| P6 (fase A, EnCicla) | **La carga sin huecos.** Lo cercano y lo de adelante primero, de a uno hasta terminarlo; el caché cuenta la vista girada. Mientras se arma, el trozo se ve en baja resolución con los colores del suelo. En la compuerta de 2 km pasó de 0 trozos terminados a 14 y 20, con p95 de 43 y 35 ms. | EnCicla 3.10.1 (`src/js/99w-chunks-progresivos.js`) |
| P2 (afinada) | **La cámara de persecución de cerca:** en Turno Cero, el último tramo abre el lente de 35° a 55° y baja a 40° (con el lente estrecho, inclinar solo daba un teleobjetivo). En El Metro, de cerca la cámara queda a unos 40°, con el ojo a 8 m o más. | Motor City 5.5.1, El Metro 3.11.1 |
| P6 y P7 (fases A y B, El Metro) | **La ventana por partes**: el piso en 16 baldosas, los edificios y lo lejano se arman antes de llegar al borde. Con el CPU 4×, el peor cuadro pasó de 1808 a ~440 ms (3.11.1), y el cambio de ventana bajó a ~70 ms (3.11.2). | El Metro 3.11.1 y 3.11.2 (`src/js/97e-ventana-por-partes.js`, `src/js/22-gl.js`) |
| P13 | **🧭 Turismo por el valle**, con 12 sitios para conocer y el dato de cada uno, la estación más cercana con la distancia a pie y el minimapa, y un botón para ir ahí en el mundo abierto. En El Metro trae también las líneas del sistema integrado, con su color y su apertura; en EnCicla, cómo funciona el préstamo. | EnCicla 3.11.0 (`src/js/99zz2-turismo.js`), El Metro 3.12.0 (`src/js/97f-turismo.js`) |

**Siguen como modos propios** (no son cámaras del mundo):
- en Turno Cero, las 🏎️ Carreras retro (pseudo‑3D) y el 🧰 garaje (fichas pixel);
- en El Metro, Conduce el Metro (cabina y panorámica de la línea) y La Red;
- los minijuegos de cada juego;
- los miradores (🔭), con su vista contemplativa mientras dura la visita.

**Pixel World** de EnCicla sigue como estilo en Más › Gráficos, no como cámara.

## 4. El plan por fases (aprobado el 25‑nov: «el plan está bien, ya veremos sobre la marcha»)

Cada fase tiene su informe, sus pruebas y su 📏 en el celular.

1. **Fase A · La carga del mundo sin huecos (P6).**
   - Una cola por prioridad: distancia, dirección del viaje y lo que ve la cámara inclinada (que de cerca mira más lejos).
   - Un presupuesto por cuadro, sin cancelar nunca lo cercano, y precarga hacia adelante según la velocidad.
   - Meta: con la bici a 30 km/h o el carro a 60 km/h, 0 casillas pendientes en lo visible a los 2 s. Medido con 📏 en el celular del autor.
2. **Fase B · La fluidez (P7).**
   - Paso fijo con interpolación del dibujo en los tres juegos, con la sensación de EnCicla como vara.
   - Resortes de la cámara y menos latencia de entrada.
   - Presupuesto de cuadro de Turno Cero (p95 ≤ 20 ms en el celular).
3. **Fase C · Controles a tu gusto (P10).**
   - Sensibilidad y curva, y varios esquemas: palanca fija o flotante, botones, deslizar, inclinar el celular y zurdo o diestro.
   - Tamaño y opacidad de los botones.
   - Una recomendación al girar el celular: en vertical, una mano con la palanca abajo; en horizontal, dos manos.
   - Todo guardado sin romper los guardados.
4. **Fase D · Nada pintado en el suelo (P3, P5).**
   - Árboles, carros, postes, señales, bancas y estaciones como objetos 3D livianos (instancias y niveles de detalle, LOD).
   - Fachadas y techos con textura por zona, y sombras simples de contacto.
   - El suelo solo lleva lo que de verdad es plano: vías, andenes, pasto y agua.
5. **Fase E · Un solo mundo 3D (P1).**
   - El mundo de EnCicla hoy es un lienzo 2.5D. Esta fase lo pasa al 3D de verdad (WebGL, como El Metro y Motor City), con el 2D solo de respaldo para equipos sin WebGL.
   - Es la fase más grande, y su orden lo decide el autor.

6. **Fase F · «Un día en EnCicla»: la apertura y el cierre de estaciones (P12). ⏸ PENDIENTE: SOLO PLAN.** El autor lo dijo el 26‑nov: «no lo agregues todavía… hasta que no te diga que lo agreguemos lo dejamos ahí pendiente». **No se programa nada de esta fase sin su OK.**
   - **Lo que trae la lámina** (`BicicletasUno/docs/referencias/2026-11-25-apertura-y-cierre.jpg`):
     - **los horarios:** apertura de 5:00 a 5:30 a. m. y cierre de 10:00 a 10:30 p. m.;
     - **los seis pasos:**
       1. revisar los números de todas las bicicletas antes de enviar el formulario;
       2. comprobar que no quede ningún préstamo activo;
       3. en las mecánicas cuyo número empieza por 0, escribir **B** al principio (0123 → B0123);
       4. en la estación manual, escribir las bicicletas y, si hay dañadas, la palabra **MALA** y debajo sus números;
       5. en las automáticas, revisar que ninguna esté mal anclada;
       6. el casco siempre, el autocuidado y la inteligencia vial;
     - **los personajes:** Buen Servicio Gómez, Linda Amable Palacio y Jorge Descuido;
     - **los lemas:** «Cada encuentro cuenta», «¡Que no se nos escape ningún detalle!», «Apertura y cierre: verificar también es cuidar» y «¡De nuestro compromiso depende que EnCicla siga rodando!».
   - **Antes de empezar:**
     - la lámina y sus personajes parecen material de EnCicla o de su operador, así que se necesita el **permiso escrito** de su titular (ver `docs/propiedad-intelectual/01-INVENTARIO-DE-OBRAS.md`, § 1.4);
     - sin ese permiso, se hace con personajes y textos propios que enseñen lo mismo.
   - **El plan de cómo se agrega, cuando el autor diga** (EnCicla 3.12 o la que siga):
     1. **Un módulo aditivo:** `src/js/99zz3-un-dia.js`, que envuelve `UI.init` como el modo turismo y no toca los oficios.
        - Entra como **dos turnos nuevos** del Operador y del Supervisor: «Apertura (5:00–5:30)» y «Cierre (10:00–10:30)».
        - Cada turno tiene dos variantes: la estación **manual** y la **automática**.
     2. **El formulario táctil** de la estación: la lista de las bicicletas ancladas, con su número.
        - El jugador **verifica cada número** contra el anclaje.
        - Corrige los que empiezan por 0 con la **B** (0123 → B0123).
        - Marca las dañadas con **MALA**.
        - Confirma «0 préstamos activos».
        - En la automática, revisa los anclajes (un toque por anclaje; los mal anclados parpadean).
     3. **Los errores de Jorge Descuido.** En cada turno, Jorge deja 2 o 3 errores sembrados al azar con una semilla fija, para que la prueba sea repetible:
        - un número sin la B;
        - una MALA sin anotar;
        - un préstamo abierto;
        - una bici mal anclada.

        El recuento final los muestra uno por uno, con el paso de la lámina que los evita.
     4. **El reloj:** el turno se juega contra el horario (30 min de juego, comprimidos en unos 3 min reales), con la luz del amanecer o de la noche del mundo.
     5. **El puntaje y el guardado:**
        - el puntaje de «verificar también es cuidar» va en el escalafón (🏆) como un oficio más;
        - el guardado suma campos sin borrar ninguno (`unDia: {mejor, turnos}`).
     6. **En Más › La historia:** las fichas de los seis pasos y los lemas, con la lámina en pequeño si hay permiso.
     7. **Las pruebas:**
        - un recorrido de prueba en `tests/run.js`: abre el turno, siembra los errores, el bot los corrige y el recuento da 0 pendientes;
        - la K‑1, para no romper los oficios;
        - la compuerta de 2 km sin cambios.
   - **Tamaño estimado:** un módulo de unas 400 líneas, sin arte nuevo obligatorio. Los íconos son vectoriales, y las ilustraciones solo con permiso.

### Estado de las fases (26‑nov‑2026)

| Fase | Estado | Qué falta |
|---|---|---|
| A · La carga | ✅ EnCicla 3.10.1 y El Metro 3.11.1 · ⏳ Turno Cero | En Turno Cero, la misma cola por prioridad para las casillas del mundo abierto; medir con 📏 en el celular. |
| B · La fluidez | 🟡 Empezada: El Metro 3.11.2 (lo lejano por partes) | El paso fijo con interpolación en los tres juegos; los picos de Turno Cero (p95 ≤ 20 ms); los resortes de la cámara. |
| C · Los controles | ⏳ Pendiente | Toda la fase (§ 4, punto 3). |
| D · Nada pintado en el suelo | ⏳ Pendiente | Toda la fase (§ 4, punto 4). |
| E · Un solo mundo 3D | ⏳ Pendiente; **su orden lo decide el autor** | Toda la fase (§ 4, punto 5). |
| F · «Un día en EnCicla» | ⏸ **Solo plan, hasta que el autor diga** | Su OK y el permiso de la lámina. |
| P13 · Turismo | ✅ EnCicla 3.11.0 y El Metro 3.12.0 | Más sitios y rutas sugeridas, si el autor quiere. |

## 5. Reglas para quien siga

- **No vuelvas a poner un selector de cámaras** ni cámaras de tercera o primera persona, maqueta, panorámica o cine en el mundo de ningún juego.
  - Lo que se acerca es la misma cámara: más cerca, más baja y detrás del rumbo.
  - Si una prueba necesita otra vista del motor para medir un dibujo, la pone a mano; el jugador no la ve.
- **Nada pintado en el suelo** que deba tener altura.
- **2D y pixel solo en los modos ya establecidos.**
- El orden de las fases de § 4 lo aprobó el autor («el plan está bien, ya veremos sobre la marcha»).
- **La fase F (la lámina de la apertura y el cierre) no se programa hasta que el autor diga**: por ahora es solo el plan del § 4.
