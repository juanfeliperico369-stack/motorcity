/* La sensación de juego (plan § 12, R10: nada se siente lento). Uso: node motor-v6/tests/sensacion.mjs
   Mide las curvas de cada tipo de movimiento, con todas las velocidades de Run Scooter (sus multiplicadores 0,62 a 1,18
   sobre la bici de 11 m/s) y su manejo (0,82 a 1,32), y falla si se salen de las metas:
   - de quieto a la máxima: 1,5 a 2 s sobre ruedas y ≤ 0,3 s a pie;
   - frenar a fondo: 0,6 a 0,8 s (a pie ≤ 0,3 s);
   - soltar y rodar hasta parar: 1,2 a 1,5 s (a pie se para: ≤ 0,3 s);
   - la primera respuesta al giro en el primer paso, y 90° a media marcha en ~0,5 s en la bici (los pesados, más lento a propósito);
   - con la palanca hacia atrás da la vuelta sin zigzaguear. */
import assert from 'node:assert/strict';
import { moverArcade, perfilMovimiento, TIPOS_MOVIMIENTO, MULTIPLICADORES, velocidadVehiculo, VELOCIDADES } from '../src/fisica/arcade.js';

const dt = 1 / 60, G = Math.PI / 180;
let n = 0; const tabla = [];
const ok = (c, m) => { assert.ok(c, m); n++; };
const entre = (v, a, b, m) => ok(v >= a - 1e-9 && v <= b + 1e-9, `${m}: ${v.toFixed(3)} (meta ${a} a ${b})`);
function tiempo(perfil, estado, mando, hasta, max = 10) {
  let e = { x: 0, z: 0, rumbo: 0, velocidad: 0, w: 0, ...estado };
  for (let i = 1; i <= max * 60; i++) { e = moverArcade(e, mando, dt, perfil); if (hasta(e)) return { t: i * dt, e }; }
  return { t: Infinity, e };
}
const velocidades = id => id === 'caminar' ? [VELOCIDADES.caminar] : id === 'correr' ? [VELOCIDADES.correr] : Object.values(MULTIPLICADORES).map(m => VELOCIDADES.bici * m / MULTIPLICADORES.bike);
const metas = {
  caminar: { acel: [0.1, 0.3], freno: [0.05, 0.3], rodar: [0.05, 0.3], giro: [0.15, 0.35] },
  correr: { acel: [0.1, 0.3], freno: [0.05, 0.3], rodar: [0.05, 0.3], giro: [0.15, 0.4] },
  ciclo: { acel: [1.5, 2], freno: [0.6, 0.8], rodar: [1.2, 1.5], giro: [0.4, 0.62] },
  tabla: { acel: [1.5, 2], freno: [0.6, 0.8], rodar: [1.2, 1.5], giro: [0.35, 0.62] },
  motor: { acel: [1.5, 2], freno: [0.6, 0.8], rodar: [1.2, 1.5], giro: [0.45, 0.85] },
  pesado: { acel: [1.5, 2], freno: [0.6, 0.8], rodar: [1.2, 1.5], giro: [0.6, 1.15] },
  vuelo: { acel: [1.5, 2], freno: [0.6, 0.8], rodar: [1.2, 1.5], giro: [0.45, 0.8] },
};
for (const tipo of Object.keys(TIPOS_MOVIMIENTO)) {
  for (const vmax of velocidades(tipo)) for (const manejo of [0.82, 1, 1.32]) {
    const P = perfilMovimiento(tipo, { velocidadMax: vmax, manejo }), M = metas[tipo], etq = `${tipo} a ${vmax.toFixed(1)} m/s, manejo ${manejo}`;
    const acel = tiempo(P, {}, { direccion: 0, magnitud: 1 }, e => e.velocidad >= vmax - 1e-9).t;
    const freno = tiempo(P, { velocidad: vmax }, { freno: true }, e => e.velocidad <= 1e-9).t;
    const rodar = tiempo(P, { velocidad: vmax }, {}, e => e.velocidad <= 1e-9).t;
    entre(acel, ...M.acel, `${etq}: de quieto a la máxima`); entre(freno, ...M.freno, `${etq}: frenar a fondo`); entre(rodar, ...M.rodar, `${etq}: soltar y rodar`);
    const uno = moverArcade({ x: 0, z: 0, rumbo: 0, velocidad: vmax / 2, w: 0 }, { giro: 1, avance: 0.5 }, dt, P);
    ok(uno.rumbo < 0, `${etq}: el giro responde en el primer paso`);
    const giro = tiempo(P, { velocidad: vmax / 2 }, { giro: 1, avance: 0.5 }, e => e.rumbo <= -90 * G).t;
    entre(giro, ...M.giro, `${etq}: 90° a media marcha`);
    if (manejo === 1 && vmax === velocidades(tipo).at(-1) || (tipo === 'ciclo' && manejo === 1 && Math.abs(vmax - 11) < 1e-9)) tabla.push({ tipo, 'v (m/s)': +vmax.toFixed(2), acelera: +acel.toFixed(2), frena: +freno.toFixed(2), rueda: +rodar.toFixed(2), 'gira 90°': +giro.toFixed(2) });
  }
}
/* la palanca hacia atrás a toda marcha: la bici baja la marcha, da la vuelta y no zigzaguea */
{
  const P = perfilMovimiento('ciclo', { velocidadMax: 11 });
  let e = { x: 0, z: 0, rumbo: 0, velocidad: 11, w: 0 }, llega = null, sobre = 0;
  for (let i = 1; i <= 240; i++) { e = moverArcade(e, { direccion: Math.PI, magnitud: 1 }, dt, P); const err = Math.atan2(Math.sin(Math.PI - e.rumbo), Math.cos(Math.PI - e.rumbo)); if (llega === null && Math.abs(err) < 10 * G) llega = i * dt; if (llega !== null) sobre = Math.max(sobre, Math.abs(err)); }
  ok(llega !== null && llega < 1.2, `la vuelta en U con la palanca hacia atrás tarda ${llega?.toFixed(2)} s (≤ 1,2 s)`);
  ok(sobre < 10 * G, `y no se pasa ni zigzaguea (${(sobre / G).toFixed(1)}°)`);
  const a30 = (() => { let s = { x: 0, z: 0, rumbo: 0, velocidad: 11, w: 0 }, max = 0; for (let i = 0; i < 180; i++) { s = moverArcade(s, { direccion: 30 * G, magnitud: 1 }, dt, P); max = Math.max(max, s.rumbo); } return max; })();
  ok(a30 < 31.5 * G, `a toda marcha hacia 30° no se pasa (${(a30 / G).toFixed(1)}°)`);
}
/* la velocidad de cada vehículo de Run Scooter sigue siendo su multiplicador sobre la bici */
for (const id of Object.keys(MULTIPLICADORES)) ok(Math.abs(velocidadVehiculo(id) - 11 * MULTIPLICADORES[id] / MULTIPLICADORES.bike) < 1e-12, id);
console.table(tabla);
console.log(`✓ la sensación del § 12: ${n} medidas dentro de las metas`);
