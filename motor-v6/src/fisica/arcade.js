/* Movimiento arcade en SI: metros, segundos y radianes. Valores de diseño,
 * no una simulación de fuerzas: plan Run City §12, calibrado a EnCicla
 * (BicicletasUno/src/js/25-vehiculos.js y 30-ride.js).
 * Cinemática uniforme: v = v0 + a·t; x = x0 + (v0+v)·t/2.
 * Véase OpenStax University Physics vol. 1, §3.4, Motion with Constant Acceleration.
 */
export const VELOCIDADES = Object.freeze({ caminar: 3.5, correr: 7, bici: 11 });
// RunRunZero/src/data.js VEH.spd; bici normalizada a su multiplicador 0.96.
export const MULTIPLICADORES = Object.freeze({ foot: .62, quad: .8, inline: .86, skate: .84, long: .88, scooter: .85, uni: .83, bike: .96, trike: .88, ebike: 1, escooter: .98, euc: 1, moped: 1.06, moto: 1.14, auto: 1.18, camion: 1.05, jetpack: 1.1 });
export function velocidadVehiculo(id) {
  if (!Object.prototype.hasOwnProperty.call(MULTIPLICADORES, id)) throw new RangeError(`Vehículo desconocido: ${id}`);
  return VELOCIDADES.bici * (MULTIPLICADORES[id] / MULTIPLICADORES.bike);
}
const limitar = (v, min, max) => Math.max(min, Math.min(max, v));
/** Actualiza un cuerpo plano; rumbo 0 avanza hacia +z. Mando [-1,1]. */
export function pasoArcade(estado, control, dt, { velocidadMax = 11, pie = false, manejo = 1 } = {}) {
  if (!Number.isFinite(dt) || dt < 0 || !Number.isFinite(velocidadMax) || velocidadMax <= 0 || !Number.isFinite(manejo) || manejo <= 0) throw new RangeError('dt y velocidad máxima inválidos');
  const { x = 0, z = 0, velocidad = 0, rumbo = 0 } = estado;
  if (![x, z, velocidad, rumbo, control.avance ?? 0, control.giro ?? 0].every(Number.isFinite) || velocidad < 0 || velocidad > velocidadMax) throw new RangeError('Estado o mando inválido');
  const avance = limitar(control.avance ?? 0, 0, 1), giro = limitar(control.giro ?? 0, -1, 1);
  const objetivo = velocidadMax * avance;
  // Aceleración 1,8 s en ruedas, 0,25 s a pie; freno 0,7 s, rodar 1,35 s.
  const tiempo = control.freno ? .7 : avance === 0 ? 1.35 : pie ? .25 : 1.8;
  const meta = control.freno ? 0 : objetivo;
  const cambio = velocidadMax * dt / tiempo;
  const v = velocidad + limitar(meta - velocidad, -cambio, cambio);
  // 90° en 0,5 s a media velocidad; la respuesta se aplica en el primer paso.
  const rumboNuevo = rumbo + giro * Math.PI * dt * manejo;
  // Integrar por tramos: al alcanzar la meta se mantiene hasta terminar dt.
  const activo = Math.min(dt, Math.abs(meta - velocidad) * tiempo / velocidadMax);
  const distancia = (velocidad + v) * activo / 2 + v * (dt - activo);
  const angulo = (rumbo + rumboNuevo) / 2;
  return { ...estado, x: x + Math.sin(angulo) * distancia, z: z + Math.cos(angulo) * distancia, velocidad: v, rumbo: rumboNuevo };
}

/** Perfil del mundo abierto: foot conserva 0.62 en carrera, no para caminar. */
export function perfilArcade(id, { correr = false } = {}) {
  return id === 'foot' ? { velocidadMax: correr ? VELOCIDADES.correr : VELOCIDADES.caminar, pie: true } : { velocidadMax: velocidadVehiculo(id), pie: false };
}
/** Transición inicial de modalidad: conserva posición y rumbo, acota velocidad. */
export function adaptarVelocidad(estado, perfil) {
  if (!Number.isFinite(estado.velocidad) || estado.velocidad < 0 || !Number.isFinite(perfil.velocidadMax) || perfil.velocidadMax <= 0) throw new RangeError('Estado o perfil inválido');
  return { ...estado, velocidad: Math.min(estado.velocidad, perfil.velocidadMax) };
}

/* ===================================================================================================================
   El movimiento del mundo abierto (Claude central, F1): la misma rampa de velocidad, y el GIRO DE ENCICLA
   (BicicletasUno/src/js/25-vehiculos.js:9 y 30-ride.js:98-107): la velocidad de giro depende de la marcha (w0 parado,
   w1 a toda marcha), tiene inercia tw y responde en el primer paso. Dos esquemas de mando:
   - directo: { direccion, magnitud } — hacia dónde ir (según la pantalla, ya pasado al mundo); si apunta lejos del rumbo,
     baja la marcha para girar, como EnCicla;
   - manubrio: { giro (+1 a la derecha), avance, freno }.
   A pie se para al soltar (0,2 s): una persona no «rueda». Las metas del plan § 12 se prueban en tests/sensacion.mjs.
   =================================================================================================================== */
export const TIPOS_MOVIMIENTO = Object.freeze({
  //            tAcel  tFreno tRodar   w0   w1    tw
  caminar: Object.freeze({ tAcel: .25, tFreno: .15, tRodar: .2, w0: 7.5, w1: 6, tw: .05, pie: true }),
  correr: Object.freeze({ tAcel: .3, tFreno: .18, tRodar: .24, w0: 7.5, w1: 5.4, tw: .05, pie: true }),
  ciclo: Object.freeze({ tAcel: 1.8, tFreno: .7, tRodar: 1.35, w0: 5, w1: 2.7, tw: .09 }),      // la bici de EnCicla
  tabla: Object.freeze({ tAcel: 1.6, tFreno: .65, tRodar: 1.45, w0: 5.6, w1: 3.1, tw: .08 }),   // patines, skate, monopatín
  motor: Object.freeze({ tAcel: 1.9, tFreno: .75, tRodar: 1.4, w0: 3.6, w1: 2.1, tw: .12 }),    // moto, scooter, auto
  pesado: Object.freeze({ tAcel: 1.95, tFreno: .78, tRodar: 1.46, w0: 2.6, w1: 1.5, tw: .16 }), // el camión
  vuelo: Object.freeze({ tAcel: 1.7, tFreno: .7, tRodar: 1.45, w0: 4.2, w1: 2.6, tw: .1 }),     // el jetpack
});
/** El perfil de un cuerpo: su tipo de movimiento, su velocidad máxima (m/s) y su manejo (multiplica el giro). */
export function perfilMovimiento(tipo, { velocidadMax, manejo = 1 } = {}) {
  const T = TIPOS_MOVIMIENTO[tipo];
  if (!T) throw new RangeError(`Tipo de movimiento desconocido: ${tipo}`);
  const vmax = velocidadMax ?? (tipo === 'caminar' ? VELOCIDADES.caminar : tipo === 'correr' ? VELOCIDADES.correr : VELOCIDADES.bici);
  if (!Number.isFinite(vmax) || vmax <= 0 || !Number.isFinite(manejo) || manejo <= 0) throw new RangeError('Perfil inválido');
  return Object.freeze({ tipo, ...T, velocidadMax: vmax, manejo, pie: !!T.pie });
}
const angulo = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
/** Un paso del cuerpo en el mundo abierto. estado: { x, z, rumbo, velocidad, w }; devuelve uno nuevo. */
export function moverArcade(estado, mando, dt, perfil) {
  const P = perfil;
  if (!P || !Number.isFinite(dt) || dt < 0 || !Number.isFinite(P.velocidadMax)) throw new RangeError('dt o perfil inválidos');
  const { x = 0, z = 0, rumbo = 0 } = estado, v0 = Math.max(0, Math.min(P.velocidadMax, estado.velocidad || 0)), w0 = estado.w || 0;
  if (![x, z, rumbo, v0, w0].every(Number.isFinite)) throw new RangeError('Estado inválido');
  const vmax = P.velocidadMax, wMax = (P.w1 + (P.w0 - P.w1) * limitar(1 - v0 / vmax, 0, 1)) * P.manejo;
  let wObj = 0, vObj = 0, frenar = !!mando.freno, activo = false;
  const m = limitar(mando.magnitud ?? 0, 0, 1);
  if (Number.isFinite(mando.direccion) && m > 0) {
    const da = angulo(rumbo, mando.direccion);
    wObj = limitar(da * 6.5 - w0 * 0.25, -wMax, wMax);                  // con amortiguación: a toda marcha no zigzaguea
    vObj = vmax * m * (0.3 + 0.7 * Math.max(0, Math.cos(da))); activo = true;
  } else if (mando.giro || mando.avance) {
    wObj = -limitar(mando.giro ?? 0, -1, 1) * wMax;                       // +1 es a la derecha: el rumbo baja
    vObj = vmax * limitar(mando.avance ?? 0, 0, 1); activo = vObj > 0;
  }
  const w = w0 + (wObj - w0) * (1 - Math.exp(-dt / P.tw));
  let v;
  if (frenar) v = Math.max(0, v0 - vmax / P.tFreno * dt);
  else if (vObj > v0) v = Math.min(vObj, v0 + vmax / P.tAcel * dt);
  else v = Math.max(vObj, v0 - vmax / (activo ? P.tFreno / 0.6 : P.tRodar) * dt);
  const r = rumbo + w * dt, media = (rumbo + r) / 2, d = (v0 + v) / 2 * dt;
  return { ...estado, x: x + Math.sin(media) * d, z: z + Math.cos(media) * d, rumbo: r, velocidad: v, w };
}
