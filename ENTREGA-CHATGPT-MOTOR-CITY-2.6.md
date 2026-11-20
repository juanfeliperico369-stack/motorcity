# Motor City 2.7.1 · Entrega del motor compartido

**20 de noviembre de 2026.** Mandados permite jugar con el arte nuevo en **Vista → Arte → ChatGPT**. La elección se conserva al volver a entrar. La rama de entrega es `claude/motor-city-engine-xu7p4y`. Este informe mantiene el nombre de archivo pedido en `TAREAS-IA.md`.

El documento HTML de la entrega incluye el informe, las guías visuales y un archivo ZIP que se puede extraer sin conexión. Dentro están los atlas, sus manifiestos, el código fuente, los mundos, las pruebas, Mandados y los adaptadores. [Documento único](dist/ENTREGA-MOTOR-CITY-2.7.1.html)

## Arte que ya se puede usar

| Recurso | Entrega y uso |
|---|---|
| Guatapé | Una misma cuadra en maqueta de día y de noche con lluvia. Una segunda lámina compara seis técnicas de ilustración. [Guía de luz](arte/chatgpt/guias/ancla.webp) · [Guía de estilos](arte/chatgpt/guias/estilos.webp) |
| Personajes | Seis personas, diez estados y cuatro fases por estado, 240 cuadros de perfil. El atlas añade 24 orientaciones cenitales y 40 cuadros ilustrados del mensajero en cel. Las otras cinco figuras reciben contorno y tres niveles de luz en los estilos dibujados. La persona de pie mide 54 px. En la vista cenital gira con el rumbo. [Personajes](arte/chatgpt/chatgpt_p.webp) |
| Vehículos | Perfil y planta de los 34 vehículos del registro. La entrada número 35 es «a pie» y usa el personaje. También están la moto y el carro de reparto, bus, chiva, furgón y seis tipos de rueda en dos vistas. Los vehículos de igual familia pueden compartir dibujo. [Vehículos](arte/chatgpt/chatgpt_v.webp) |
| Vegetación y animales | Ocho especies de árbol con tres variantes en dos vistas, 48 cuadros. Las variantes combinan silueta, reflejo y color de una misma base. Ocho animales de perfil a escala. [Árboles](arte/chatgpt/chatgpt_arboles.webp) · [Animales](arte/chatgpt/chatgpt_a.webp) |
| Suelos y fachadas | Diez losetas periódicas de 128 × 128 px, cada una de cuatro metros de lado. Las 36 bases de fachada producen 216 módulos al combinar tres variantes y luz de día o de noche. [Suelos](arte/chatgpt/chatgpt_suelos.webp) · [Fachadas](arte/chatgpt/chatgpt_w.webp) |

Los seis atlas de ChatGPT reúnen **676 cuadros**. El revisor comprobó límites, anclas, metros, separación y nombres. Para reutilizarlos en otro juego se añade `chatgpt` a la propiedad `arte` de su `juego.json` y se instala el paquete con `MC.Pieles.instalar`. [Manifiesto](arte/chatgpt/manifiesto.json) · [Integración en Mandados](juegos/mandados/juego.js)

## Motor y comprobaciones

| Encargo | Resultado observado |
|---|---|
| Losas y lluvia · C-M16 y C-M17 | La piel suministra el material en metros. Si falta, se dibuja el material procedural. El asfalto cambia al llover y los charcos reflejan cielo o luz cálida con ondas animadas. En una calle de Mandados con 11 charcos, el pase de charcos tardó **0,26 ms de mediana y 0,56 ms en el percentil 95** con CPU 4×. Se midieron 31 tandas de 25 dibujos y se leyó un píxel por tanda. El horneado inicial del asfalto y el resto de la escena tienen costes adicionales. |
| Rendimiento · C-M13 | La maqueta conserva fachadas, árboles y desgaste. Se reutilizan dibujos de edificios, pasos elevados y cables y se descartan objetos fuera de pantalla. El banco integrado midió **34,9 ms** de mediana en maqueta con CPU 4×. El objetivo es **menos de 20 ms**. Las otras medianas fueron 16,9 ms en cenital, 23,6 ms en ciudad 3D, 23,4 ms en lateral y 7,9 ms en panorámica. |
| Terreno · C-M15 | Guatapé y Medellín incluyen la capa comprimida de agua. Se compararon tipo, cuerpo y distancia a la orilla de **cada celda** con el cálculo original. Los mundos anteriores conservan el cálculo al cargar. Los carros se inclinan en pendientes y llevan inercia de dirección sobre nieve o terreno blando mojado. [Generador reproducible](herramientas/precalcular-agua.mjs) |
| Otros motores · C-M18 | Godot 4.6.3 abrió el GLB y el JSON de Guatapé en modo headless, con **300 edificios y 1.396 árboles** en dos MultiMesh. La vista opcional de three.js registró **17.230 triángulos** en una escena del banco y cero errores de Motor City. Unity y Unreal quedaron sin ensayo. [Godot](adaptadores/godot/) · [Three.js](adaptadores/three/) |
| Estilos · C-M19 | Las cuatro vistas proyectadas de Canvas pueden imprimir en blanco y negro con una matriz de 256 umbrales. Una prueba desplaza la cámara un píxel y comprueba la coincidencia de la trama. En cómic, los puntos cubren más área en los tonos oscuros. El pase final tiene un coste apreciable en resolución completa. |

Para abrir la escena de Godot se ejecuta `node motor.mjs exportar guatape` y se abre `adaptadores/godot/project.godot`. Para three.js se ejecuta `npm ci --prefix adaptadores/three`, se sirve la raíz por HTTP y se abre `/adaptadores/three/`. Mandados se distribuye como HTML autónomo. [Mandados](dist/juegos/mandados.html)

## Auditoría del código nuevo · C-M1

| Archivo y línea | Gravedad | Escenario | Cambio en esta entrega |
|---|---|---|---|
| `js/16-estilos.js:57` | Media | Una palabra CSS o un hexadecimal con alfa cambiaba de color o perdía transparencia bajo un estilo. | Se reconocen los formatos admitidos y se conserva el alfa hexadecimal o RGBA. |
| `js/29-arboleda.js:40` | Baja | Un catálogo externo solicita una especie desconocida. | El horneado utiliza el urapán de respaldo. |
| `js/40-dibujo.js:91` | Media | Queda una losa diferida y el jugador cambia de estilo antes de pintarla. | Se valida la clave de piel y estilo al consumir la cola y se vacía al invalidar la caché. |
| `js/87-pieles.js:112` y `js/38-sprites.js:23` | Alta | Un archivo de atlas falla en la carga. La instalación anterior podía esperar indefinidamente. | Cada imagen comunica el resultado y la instalación identifica los atlas fallidos. |
| `js/88-vida.js:23` | Media | Un cuerpo nuevo hereda la última velocidad vertical del anterior. | Se reinicia el historial de movimiento al cambiar de cuerpo. |
| `js/89-exportar.js:25` y `js/89-exportar.js:41` | Media | Una vía atraviesa todo el recorte con ambos extremos fuera. El RAW16 dependía del orden de bytes nativo. | El segmento se recorta en el borde tanto en JSON como en GLB. El relieve escribe explícitamente en little endian. |

Para inspeccionar el diff exacto a partir de la entrega de Gemini, ejecutar `git diff f47e46a HEAD -- js/16-estilos.js js/29-arboleda.js js/38-sprites.js js/40-dibujo.js js/87-pieles.js js/88-vida.js js/89-exportar.js`.

## Auditoría de los juegos

| Juego y revisión probada | Prueba y resultado |
|---|---|
| Motor City y Mandados · 2.7.1 | `node motor.mjs construir` y `node motor.mjs prueba --navegador`. Pasaron **130 pruebas**. Se comprobaron nueve vistas, nueve estilos, movimiento táctil, hogar, urbanismo, importación de atlas y fases de animación. Se eligió ChatGPT en el menú real y se recargó la página para verificar la persistencia. |
| Juega EnCicla · `fbe3c7e` | Compiló y completó 54 partidas simuladas. Quedó un fallo reproducible en Chromium con tres jugadores. El segundo invitado no vio a la vez al anfitrión y al primero dentro de la espera de la prueba. La medición sola no permite atribuir el fallo al transporte o al temporizador. |
| El Metro · `22771b2` | Tras generar los recursos visuales, la prueba de diez partidas recorrió 31.388 pasos, con cinco victorias, cero errores y cero errores de consola. En la primera corrida faltaban tres recursos HTTP. Se repitió el flujo completo tras generarlos con Chromium. |
| Run Scooter · `803eff1` | El simulador completó 100 partidas, con cero errores y cero filas imposibles. El bot del navegador completó la prueba de interfaz y exportación sin errores. |

Los tres juegos se probaron desde copias de sus ramas de trabajo. Sus migraciones tienen responsables y listas de tareas propios. Para comparar con la línea base anterior se conserva la auditoría del 19 de noviembre. [Informe previo](docs/AUDITORIA-MOTOR-CITY-2026-11-19.md)

## Trabajo de Gemini y revisión visual

Se integraron los commits `9146c86` y `f47e46a`, con las referencias, los datos, la propuesta de iconos, las obras candidatas y los informes de Gemini. Codex reparó la geometría de los atlas de Gemini y completó los recortes de vehículos que faltaban con arte nuevo. **Los 997 cuadros de Gemini pasan ahora el revisor**. Las comprobaciones automáticas verifican geometría y metadatos. [Informe de origen](reportes/2026-11-20-gemini-revisar-arte.md) · [Atlas reparados](arte/gemini/)

| Capturas de Mandados | Hallazgo | Gravedad |
|---|---|---|
| Cenital, 10 h, 17 h y 20:30 | Las cebras y el rumbo se distinguen a las tres horas. La figura ocupa pocos píxeles junto a los nombres de lugares. | Media |
| Ciudad 3D, 10 h, 17 h y 20:30 | De noche hay contraste en los viales. Los nombres largos y las copas compiten con el indicador del jugador. | Media |
| Lateral, 10 h, 17 h y 20:30 | Los árboles se mantienen verticales. El solapamiento de copas dificulta reconocer la calle a nivel del suelo. | Media |
| Maqueta, 10 h, 17 h y 20:30 | La altura relativa de árboles y edificios sigue siendo legible. Las fachadas próximas y el follaje pueden ocultar temporalmente a una persona. | Media |
| Capa de valor y Mi casa | El dato de suelo se distingue por el color y su leyenda. La casa se lee como planta, con espacio sobrante arriba en la pantalla vertical. | Baja |

La herramienta tomó **14 capturas** con viewport táctil de 412 × 860 y anotó cero errores y cero controles sobre el centro. La densidad de etiquetas requiere juicio visual además de esa comprobación geométrica. [Capturas](dist/capturas/) · [Observaciones de Gemini](reportes/2026-11-20-gemini-capturas.md)

## Pendientes e ideas para el siguiente corte

1. **Maqueta.** Mantener la prueba fija con CPU 4× y repetir un mismo recorrido en un teléfono físico. Registrar mediana y percentil 95 al girar o acercarse a un cruce con muchos árboles. El objetivo de 20 ms sigue abierto.
2. **Legibilidad.** En el móvil, dar prioridad visual al jugador y al siguiente giro frente a los nombres comerciales. Comprobarlo de día y de noche con la misma misión.
3. **EnCicla.** Registrar el último estado recibido por cada invitado y sus marcas de tiempo durante la prueba de tres participantes. Esto permite localizar la pérdida de reenvío o el exceso de espera sin ocultar el fallo.
4. **Alcance de terreno y simulación.** Siguen pendientes la prueba completa de las siete clases de vehículo, el salto sobre roca pequeña y la cobertura de agua y roca en el raster. C-M2 a C-M12 y C-M14 conservan sus criterios en la lista del motor, incluidos tráfico por recorridos, viviendas con A*, sombras sobre muros, distritos, accesibilidad, contenido y pruebas. [Criterios de aceptación](TAREAS-IA.md)
5. **Referencias de vídeo.** Para nueve enlaces de Instagram sigue faltando una correspondencia confirmada con los MP4 del autor. En otro caso hay una reseña indirecta. El informe de Gemini conserva esa distinción. [Estado por referencia](docs/INSPIRACION-VISUAL.md)
