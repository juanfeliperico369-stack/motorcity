# Pulso musical original

`sonido/pulso.js` ofrece una base procedural sin muestras ni recursos de red. El tempo y la intensidad aumentan de forma acotada con la velocidad y la urgencia; los valores son un punto de partida para probar, no una reproducción de otra obra. Todavía no se ha integrado ni escuchado dentro de Run City.

Crear `new MusicaPulso()`, llamar `activar()` únicamente desde un gesto voluntario y, durante el juego, `actualizar({velocidad, segundosRestantes})`: velocidad en m/s y segundos restantes o `null` sin reloj. Al pausar llamar `pausar(true)`, al reanudar `pausar(false)` y al salir `cerrar()`. El guardián suspende el contexto al ocultar o abandonar la aplicación. La música permanece apagada si el jugador no la activa.

Pruebas desde la raíz de motorcity: `node motor-v6/tests/pulso.mjs` y `MC_CHROMIUM=/usr/bin/chromium node motor-v6/tests/pulso-navegador.mjs` con Playwright disponible. Se comprueban parámetros, gesto, señal Web Audio, silencio en pausa, guardián y liberación. Falta escuchar y ajustar la mezcla en juego y celular real.
