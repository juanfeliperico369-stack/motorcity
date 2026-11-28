/* Motor City 6 · entrada/orientacion.js — «una recomendación al girar el celular» (plan § 5).
   Al pasar a vertical u horizontal, el juego sugiere los controles que mejor van con esa forma de agarrarlo, y el
   jugador decide (un botón «Usar» y otro «Así está bien»). La recomendación se da una vez por orientación.
   - vertical: una mano; la palanca flotante, donde caiga el pulgar.
   - horizontal: dos manos; la palanca fija en su esquina y los botones al otro lado, y se ve más ciudad. */

export function orientacionDe(ancho, alto) { return ancho > alto ? 'horizontal' : 'vertical'; }

/** La recomendación para una orientación y las preferencias de ahora, o null si ya van bien. */
export function recomendar(orientacion, prefs = {}) {
  if (orientacion === 'horizontal' && prefs.modo !== 'fija') return { orientacion, cambios: { modo: 'fija' }, texto: 'En horizontal se agarra con las dos manos: ¿palanca fija en su esquina?' };
  if (orientacion === 'vertical' && prefs.modo !== 'flotante') return { orientacion, cambios: { modo: 'flotante' }, texto: 'En vertical se juega con un pulgar: ¿palanca flotante, donde pongas el dedo?' };
  return null;
}

/** Vigila los giros del celular y llama a alCambiar(orientacion) (una vez por cambio). Devuelve la función para dejar de vigilar. */
export function vigilarOrientacion(alCambiar, ventana = globalThis) {
  let ultima = orientacionDe(ventana.innerWidth, ventana.innerHeight);
  const revisar = () => { const o = orientacionDe(ventana.innerWidth, ventana.innerHeight); if (o !== ultima) { ultima = o; alCambiar(o); } };
  ventana.addEventListener?.('resize', revisar); ventana.screen?.orientation?.addEventListener?.('change', revisar);
  return () => { ventana.removeEventListener?.('resize', revisar); ventana.screen?.orientation?.removeEventListener?.('change', revisar); };
}
