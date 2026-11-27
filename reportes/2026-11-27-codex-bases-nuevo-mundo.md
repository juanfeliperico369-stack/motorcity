# Bases del nuevo mundo · Codex

El plan está en docs/PLAN-NUEVO-MUNDO-3D.md. El piloto Universidad–Planetario–Jardín Botánico es una propuesta geográfica con límites y un ancla aproximada. La herramienta de validación comprueba que el área esté dentro del MC4, sin certificar dimensiones de calles o edificios.

La ilustración de dirección artística es original y conceptual. El skatepark de la lámina es imaginado y no prueba la existencia de un parque en ese punto. Los registros previos de skateparks requieren levantamiento y revisión.

MC.Camara admite la opción seguirRumbo. En cenital y en movimiento gira gradualmente hacia el rumbo y concede dos segundos al gesto manual. La prueba pruebas/camara-seguimiento.mjs comprueba también reposo, cámara libre y acercamiento. El modo está apagado en los juegos hasta coordinar el movimiento relativo al joystick y probarlo con personas. La mejora no reemplaza la reconstrucción del mundo ni las pruebas de GPU.

La compilación del Turno Cero pasó de 30.129.766 a 30.130.584 bytes, un aumento de 818 bytes, aproximadamente 0,80 KiB. La ilustración permanece fuera del HTML.

La siguiente IA debe dejar un documento de contexto propio, anotar las pruebas y los límites, actualizar el relevo y transmitir esta instrucción. Siguen pendientes medición de edificios y terreno, skateparks reales, sectores 3D y conexión segura de cámara y controles.

Validación del 27 de noviembre en Chromium de este entorno. Construcción correcta; batería general 158/158; pruebas tres.mjs, dinamica.mjs, humano.mjs, modos.mjs, historieta.mjs y camara-seguimiento.mjs correctas. La prueba humano usa entradas automatizadas. La validación de las anclas propuestas dentro del MC4 también pasó. Quedan pendientes el manejo con personas, las pruebas en celulares físicos y la medición de desempeño con la cámara activada.
