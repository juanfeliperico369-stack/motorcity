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
