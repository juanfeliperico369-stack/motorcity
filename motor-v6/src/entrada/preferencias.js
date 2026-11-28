/* Motor City 6 · entrada/preferencias.js — los ajustes de los controles, guardados con versión (nucleo/guardado.js).
   «Los controles van según la pantalla, y son intuitivos y personalizables» (plan § 5): la palanca (fija o flotante, tamaño,
   opacidad, mano, zona muerta y sensibilidad), el esquema a pie y en vehículo, la cámara (sensibilidad, invertir la
   inclinación, seguir el rumbo o no, menos movimiento) y qué recomendaciones de giro ya se dieron. */
import { Almacen } from '../nucleo/guardado.js';
import { normalizarPreferencias, PREFERENCIAS_PALANCA } from './palanca.js';
import { ESQUEMAS } from './esquemas.js';

export const AJUSTES_CONTROL = Object.freeze({
  palanca: PREFERENCIAS_PALANCA,
  esquemaPie: 'directo', esquemaVehiculo: 'directo',
  camara: Object.freeze({ sensibilidad: 1, invertirInclinacion: false, seguirRumbo: true, menosMovimiento: false }),
  recomendado: Object.freeze({ vertical: false, horizontal: false }),
});
const num = (v, a, b, d) => (Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : d);
export function normalizarAjustes(a = {}) {
  const c = a.camara || {}, r = a.recomendado || {}, D = AJUSTES_CONTROL;
  return {
    palanca: normalizarPreferencias(a.palanca || {}),
    esquemaPie: ESQUEMAS.includes(a.esquemaPie) ? a.esquemaPie : D.esquemaPie,
    esquemaVehiculo: ESQUEMAS.includes(a.esquemaVehiculo) ? a.esquemaVehiculo : D.esquemaVehiculo,
    camara: { sensibilidad: num(c.sensibilidad, 0.4, 2.5, 1), invertirInclinacion: !!c.invertirInclinacion, seguirRumbo: c.seguirRumbo !== false, menosMovimiento: !!c.menosMovimiento },
    recomendado: { vertical: !!r.vertical, horizontal: !!r.horizontal },
  };
}
/** Los ajustes de los controles de un juego (la clave es del juego: así Run City, EnCicla y El Metro no se pisan). */
export function ajustesControl({ clave = 'motor-city.controles', almacenamiento } = {}) {
  const almacen = new Almacen({ clave, version: 1, validar: normalizarAjustes, almacenamiento });
  let valores = almacen.leer() || normalizarAjustes();
  return {
    get valores() { return valores; },
    get persistente() { return almacen.persistente; },
    cambiar(parcial) {
      valores = normalizarAjustes({ ...valores, ...parcial, palanca: { ...valores.palanca, ...(parcial.palanca || {}) }, camara: { ...valores.camara, ...(parcial.camara || {}) }, recomendado: { ...valores.recomendado, ...(parcial.recomendado || {}) } });
      almacen.escribir(valores); return valores;
    },
    restablecer() { valores = normalizarAjustes(); almacen.escribir(valores); return valores; },
  };
}
