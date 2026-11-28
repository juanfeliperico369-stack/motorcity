import assert from 'node:assert/strict';
import { pasoArcade, VELOCIDADES, MULTIPLICADORES, velocidadVehiculo } from '../src/fisica/arcade.js';
const dt = 1 / 60;
function sim(cuerpo, entrada, n, opciones) { for (let i = 0; i < n; i++) cuerpo = pasoArcade(cuerpo, entrada, dt, opciones); return cuerpo; }
for (const id of Object.keys(MULTIPLICADORES)) {
  const max = velocidadVehiculo(id), cfg = { velocidadMax: max };
  const acelerado = sim({}, { avance: 1 }, 108, cfg);
  assert.ok(Math.abs(acelerado.velocidad - max) < 1e-9, `${id}: aceleración`);
  assert.ok(Math.abs(sim(acelerado, { freno: true }, 42, cfg).velocidad) < 1e-9, `${id}: frenada`);
  assert.ok(Math.abs(sim(acelerado, {}, 81, cfg).velocidad) < 1e-9, `${id}: rodar`);
}
const pie = sim({}, { avance: 1 }, 15, { velocidadMax: VELOCIDADES.caminar, pie: true });
assert.ok(Math.abs(pie.velocidad - 3.5) < 1e-9);
const gira = sim({ velocidad: 5.5 }, { avance: .5, giro: 1 }, 30, {});
assert.ok(Math.abs(gira.rumbo - Math.PI / 2) < 1e-9);
assert.ok(pasoArcade({ velocidad: 5.5 }, { avance: .5, giro: 1 }, dt).rumbo > 0);
assert.throws(() => velocidadVehiculo('desconocido'), RangeError);
console.log(`✓ ${Object.keys(MULTIPLICADORES).length} vehículos: acelerar 1,8 s, frenar 0,7 s y rodar 1,35 s; giro y pie`);
