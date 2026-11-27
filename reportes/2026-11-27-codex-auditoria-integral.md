# Auditoría crítica integral · Motor City y sus videojuegos

**Autoría:** Codex (OpenAI), 27 de noviembre de 2026.

**Destinatarios:** autor, Claude, Gemini y desarrolladores de cada juego.

## Diagnóstico

El conjunto reúne mapas, modalidades, física, gráficos y narrativas ambiciosas, pero la cantidad de sistemas ha crecido más rápido que la calidad de cada experiencia. Una partida divertida depende de entender qué hacer, controlar con precisión, recibir una respuesta clara, encontrar una consecuencia interesante y querer repetir. La presencia de módulos y la aprobación de bots no demuestran esas cualidades.

El problema más serio es la distancia entre el catálogo y lo que llega a la pantalla. El propio plan admite que la carga y la fluidez siguen incompletas, que los controles necesitan una fase entera y que EnCicla todavía usa un mundo 2.5D. Comunicar el conjunto como un mundo 3D pulido y fluido crea una expectativa que el jugador puede perder en segundos.

La crítica de diversión siguiente es juicio de diseño a partir de recorridos breves y lectura del código. No se midió retención, satisfacción, accesibilidad con personas reales ni la duración completa de todas las actividades. Las propuestas son hipótesis comprobables.

## Alcance y evidencias

Se reconstruyeron las ramas principales y se abrió la versión local a 412 × 860 en Chromium con WebGL por software. Se entró al mundo, se mantuvo la flecha arriba durante cinco segundos y se registraron capturas. Las pruebas se ejecutaron con otros procesos activos. Los tiempos de apertura y la fluidez no sirven como referencia de rendimiento. La interacción automatizada de teclado tampoco reemplaza una prueba táctil humana ni una sesión prolongada.

| Producto | Revisión examinada | Evidencia |
|---|---|---|
| Motor City y Turno Cero 5.5.1 | motorcity 499ea90 | [Motor](auditoria-integral-2026-11-27/motor-inicio.png), [Turno Cero](auditoria-integral-2026-11-27/turno-juego.png) |
| Juega EnCicla 3.11.0 | BicicletasUno 7bb6fde | [Portada](auditoria-integral-2026-11-27/encicla-311-inicio.png), [paseo](auditoria-integral-2026-11-27/encicla-juego.png) |
| El Metro 3.12.0 | MetroZero 8d1f451 | [San Antonio](auditoria-integral-2026-11-27/metro-juego.png) |
| Run Scooter | RunRunZero 6556cd8 | [Primera partida](auditoria-integral-2026-11-27/run-juego.png) |

Las cuatro páginas públicas respondieron HTTP 200. Las observaciones jugables corresponden a las compilaciones locales indicadas. No se ha demostrado que cada página o APK servida coincida byte a byte. Las ramas históricas de trabajo eran anteriores a las de main y no se usaron para juzgar la última versión.

## Por qué puede sentirse mal

### Motor City · infraestructura extensa, experiencia difícil de gobernar

El banco de pruebas entra directamente al mapa y muestra clima, posición, opciones y vehículo. Eso ayuda a probar herramientas, pero no plantea por sí mismo un reto ni demuestra que un juego pueda sostener una experiencia. La infraestructura añade cámaras, ciudades, renderizadores, simulación y controles con costes y estados distintos, lo que multiplica los puntos de integración. El README anuncia la versión 4.0.0 aunque VERSION.json indica 5.5.1, una señal concreta de documentación desactualizada.

El render tiene una mejora R6-b funcional como experimento, pero js/45-z-r6b.js solo la activa con ?r6b y juegos/getaway/juego.json incluye únicamente Guatapé. docs/PEDIDOS-CHATGPT-5.0.md registra el motivo: 65 regiones y 81 pendientes a los 30 s con el experimento, frente a 128 y 0 sin él. **La existencia del Worker no demuestra una mejora para el jugador de Medellín.** El informe R6-b midió construcción de regiones, no el p95 global del juego ni el consumo de GPU de un celular.

Prioridad: establecer un presupuesto único de cuadros, carga, memoria y respuesta al mando por dispositivo. Arreglar primero los huecos y tirones de un recorrido representativo.

### Turno Cero · ambición sin una primera acción suficientemente clara

La portada ofrece mundo abierto, modos, garaje, historia, ciudades, misión 3D y capítulos, junto con un largo bloque argumental. La amplitud es real en la interfaz, pero la primera decisión tiene demasiadas rutas de valor desigual. Al entrar, múltiples botones laterales, un joystick, un mapa y herramientas con abreviaturas compiten visualmente.

En la captura la calle es una franja estrecha rodeada de una gran superficie beige, el vehículo ocupa muy pocos píxeles y el aviso superior aparece recortado. Tras cinco segundos de flecha arriba la interfaz pasó de 0 a 1 km/h y mostró «Un poste». Es una reproducción puntual en una máquina cargada. El inicio puede presentar obstáculo y poca lectura de la escena antes de enseñar el manejo. La distancia entre el relato adulto y una primera interacción poco expresiva debilita el tono.

Propuesta: iniciar en una calle despejada y reconocible con un contrato opcional de 60–90 segundos que use conducir, recoger y entregar. Mantener todas las opciones liberadas, pero dar a la primera acción un objetivo visible, distancia, recompensa y estado. Reducir el HUD inicial y revelar herramientas conforme se necesitan. Probar freno, aceleración, giro y recuperación en ambas orientaciones con personas nuevas.

### EnCicla · identidad clara, poco volumen y progresión difícil de percibir

La portada 3.11 sí ofrece **Escalafón** y **Turismo por el valle**, como pidió el autor. El paseo observado orienta con flechas y el usuario avanzó con el teclado. Aun así, se lee como un tablero plano de colores, con elementos de mapa, iconos y botones compitiendo por atención. La señal de ruta y la interacción con la estación resultan más visibles que un propósito inmediato o una recompensa comprendida. El texto del aviso de cámara aparece duplicado en el DOM durante esta sesión, aunque la captura no demuestra que ambas copias fueran visibles.

El plan oficial reconoce que el paseo libre actual es **2.5D**, y reserva la transición a WebGL como fase E. La cámara única está implementada como interacción, mientras el mundo enteramente 3D sigue abierto. La fase A mejora la carga, pero los controles, el volumen y la fluidez completa siguen pendientes según el propio plan.

Para hacerlo más atractivo, dar al primer trayecto una pequeña elección comprensible —ruta segura o más rápida—, una devolución de precisión sin castigo excesivo y una consecuencia visible en una estación. Hacer que turismo guíe un recorrido con distancias y contexto, y ensayar si usuarios nuevos completan el primer viaje sin manual. La transformación 3D debe conservar la claridad del mapa.

### El Metro · escala útil, lectura visual débil

La experiencia empieza en San Antonio y ofrece acciones de abordar y conducir. La captura presenta extensas superficies grises y un patrón punteado sobre la escena, con el personaje señalado por «Tú» y controles de icono en una columna apretada. La interferencia puede involucrar geometría, texturas o el renderizador por software y debe reproducirse en GPU real antes de atribuir una causa. El efecto observado dificulta distinguir andén, recorrido y objetivo.

Hay un núcleo potencialmente entretenido en detener el tren con precisión, coordinar pasajeros y conocer estaciones. Si el jugador debe descifrar primero un mapa denso y una serie de iconos, la actividad tarda en revelar su recompensa. Priorizar una llegada de estación con información anticipada, freno legible, resultado y motivo para intentar mejorar. Ofrecer etiquetas a controles secundarios y contraste entre suelo caminable, vías, tren y jugador.

La bitácora de 3.12 indica que el peor cambio de ventana bajó a ~70 ms con CPU 4× en un recorrido concreto. Es progreso, pero sigue por encima de un cuadro de 20 ms y no demuestra ausencia de tirones en todos los dispositivos. El modo turismo está implementado como tarjeta y lista de sitios, aunque aún necesita prueba de comprensión con jugadores nuevos.

### Run Scooter · bucle legible con exceso de reglas simultáneas

Es el recorrido más fácil de reconocer en las capturas: personaje grande, carriles, monedas, distancia y dos acciones. En la prueba pasó de 69 a 113 m y respondió con un salto y puntuación. No se ha medido aquí si un gesto táctil reconoce correctamente cada dirección ni si la dificultad mantiene interés durante una partida completa.

La portada ofrece muchas rutas y el diseño incorpora aliento, freno, impulso, entregas, lesiones, policía, rivales, bifurcaciones y mentores. Si todo aparece antes de dominar carril, salto y freno puede convertir decisiones en ruido. El primer minuto debería enseñar una regla nueva por tramo, anticipar obstáculos y hacer que la entrega sea el centro del ritmo. Evaluar si un principiante entiende por qué perdió, si puede repetir enseguida y si una ruta posterior cambia realmente su decisión.

La simulación de 100 partidas terminó con 0 errores y 0 filas imposibles. No prueba que una persona encuentre justa una fila, comprenda el gesto o quiera volver.

## Pedidos contrastados

| Pedido del autor | Evidencia | Evaluación |
|---|---|---|
| Mundo 3D, objetos con volumen y una sola cámara | docs/PEDIDO-DEL-AUTOR-2026-11-25.md, fases D y E | Parcial. Cámara cenital y zoom documentados, 2.5D de EnCicla y objetos pintados pendientes. |
| Cargar sin huecos al avanzar | Plan, fase A | Parcial. Hay mejoras documentadas en EnCicla y Metro; falta Turno Cero y medición física del criterio de 0 casillas visibles pendientes. |
| Movimiento fluido y controles adaptables | Plan, fases B y C | Parcial. Existen controles, pero el plan deja pendiente interpolación, sensibilidad y recomendaciones por orientación. |
| Música que se detiene al salir | Plan P8 y prueba de El Metro | Implementado y comprobado por la prueba automática del guardián en El Metro. Falta comprobación humana del ciclo real de cada APK. |
| Escalafón en portada | Captura de EnCicla 3.11 | Cumplido visualmente; falta evaluar si un usuario entiende la progresión. |
| Turismo en EnCicla y El Metro | Botón de EnCicla y src/js/97f-turismo.js de El Metro | Implementado a nivel de entrada y contenido. Falta evaluar la ruta completa con personas sin conocimiento del sistema. |
| Apertura y cierre de estaciones | Plan fase F | Planificado y deliberadamente pendiente según la instrucción del autor. |
| R6-b, sectores y Worker | js/45-z-r6b.js, juegos/getaway/juego.json | Piloto optativo en Guatapé, no mejora predeterminada demostrada para Medellín. |
| Cuartos nocturnos, SSAO, faroles y agua | docs/PEDIDOS-CHATGPT-5.0.md | Cuartos implementados según el relevo; SSAO, faroles y reflejos siguen pendientes en ese plan. |
| Pisos oficiales y LiDAR | Relevo de Claude y reportes/r3-cobertura-catastro.json | Recuento e investigación realizados; integración a la espera de decisiones de licencia. |
| Vuelcos, inclinación y daño | pruebas/dinamica.mjs, pruebas/vuelcos.mjs, informe C5-01 | Implementaciones y pruebas deterministas existen. El informe describe vuelco visual con colisiones en plano. |
| Paridad de todos los modos entre mundo abierto y cerrado | Código y plan de actividades | No se verificó de extremo a extremo. La presencia de accesos no demuestra igualdad de estado, reglas y resultados. |

## Qué priorizar para que sean mejores juegos

1. **Una experiencia mínima completa por juego.** Un recorrido libre con un objetivo, una acción precisa, una consecuencia visible y reinicio. Congelar la adición de modos durante la validación del primer ciclo.
2. **Legibilidad.** Resolver el patrón observado de El Metro y los huecos visuales de Turno Cero, aumentar la lectura de vehículo y jugador, jerarquizar objetivos y quitar avisos cortados. Comparar en vertical, horizontal, software y teléfonos físicos.
3. **Controles y continuidad.** Ejecutar las fases A–C con pruebas táctiles reales, seguimiento de latencia, carga y cuadros lentos. Probar orientación, pausa, segundo plano, rescate, cambios de modo y guardados antiguos.
4. **Metas propias para cada juego.** Turno Cero necesita tensión de manejo y contratos; EnCicla, dominio amable del viaje y estaciones; El Metro, precisión operacional; Run, lectura y ritmo. Una lista de funciones compartidas no sustituye estas identidades.
5. **Recompensa y contenido.** Diseñar misiones pequeñas que cambien una decisión, con resultados comprensibles. Medir tiempo hasta el primer objetivo, repetición voluntaria y motivos de abandono mediante sesiones consentidas.
6. **Una matriz de aceptación.** Por petición, enlazar requisito, versión, prueba por entradas reales, captura, resultado y limitación. Marcar parcial si solo existe un módulo o una prueba sintética. Mantener el plan de la lámina sin implementarlo hasta que el autor lo solicite.

Referencias de diseño para comparar mediante pruebas, sin copiar código ni arte: Super Arcade Racing para lectura de curvas y repetición rápida, Alto's Odyssey para enseñar con ritmo y siluetas, y Mini Metro para jerarquía de red y decisiones. Son comparaciones propuestas, no pruebas de que el proyecto ya alcance esos estándares.

## Pruebas y límites

- La construcción de Motor City 5.5.1 terminó. Turno Cero compilado ocupa 29.415 KiB según la herramienta.
- La batería general del motor con navegador pasó 158 comprobaciones en 199 s. Las pruebas de 3D realista, dinámica, interacción humana simulada, modos e Historieta terminaron en verde. Dinámica pasó 25 comprobaciones, vuelcos 11 verificaciones y R6-b datos validó Guatapé y Medellín en el generador. Eso no significa que Medellín esté activado en el HTML.
- La prueba de El Metro con 20 partidas terminó con 0 errores y comprobó el guardián del sonido.
- Run Scooter terminó 100 simulaciones, 0 errores y 0 filas imposibles.
- La prueba oficial de EnCicla falló al abrir file:// por la política del navegador de este entorno. La misma batería con 100 partidas, servida por HTTP en este entorno, terminó en verde, incluido el multijugador simulado. Ese cambio de transporte no demuestra funcionamiento offline en el dispositivo.
- Las capturas y partidas son una muestra breve, con CPU compartida y WebGL por software. No se ha certificado GPU, latencia táctil, consumo, audio de la APK, historia completa ni todos los modos.

## Relevo

La siguiente IA debe crear su propio documento de contexto, actualizar CONTEXTO-RELEVO.md §8, registrar los resultados reproducibles y pasar esta misma obligación a quien continúe. Debe verificar cada defecto en la revisión vigente, conservar capturas, no dar por cumplidos los requisitos sin recorrerlos y distinguir las decisiones pendientes de licencia y de la lámina.

**Firma: Codex (OpenAI).**
