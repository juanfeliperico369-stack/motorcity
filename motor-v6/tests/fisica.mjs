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

// Los 17 identificadores y valores son el contrato de RunRunZero/src/data.js.
assert.deepEqual(MULTIPLICADORES, { foot: .62, quad: .8, inline: .86, skate: .84, long: .88, scooter: .85, uni: .83, bike: .96, trike: .88, ebike: 1, escooter: .98, euc: 1, moped: 1.06, moto: 1.14, auto: 1.18, camion: 1.05, jetpack: 1.1 });
assert.ok(Math.abs(velocidadVehiculo('bike') - 11) < 1e-12);
assert.ok(Math.abs(velocidadVehiculo('foot') - 11 * .62 / .96) < 1e-12);
for (const id of Object.keys(MULTIPLICADORES)) {
  const max = velocidadVehiculo(id), cfg = { velocidadMax: max };
  assert.ok(Math.abs(sim({}, { avance: 1 }, 54, cfg).velocidad - max / 2) < 1e-9, id);
  assert.ok(Math.abs(sim({ velocidad: max }, { freno: true }, 21, cfg).velocidad - max / 2) < 1e-9, id);
  assert.ok(Math.abs(sim({ velocidad: max }, {}, 27, cfg).velocidad - max * 2 / 3) < 1e-9, id);
}
// En 2 s alcanza 10 m/s a los 1,8 s: 9 m acelerando + 2 m uniforme.
assert.ok(Math.abs(pasoArcade({}, { avance: 1 }, 2, { velocidadMax: 10 }).z - 11) < 1e-12);
// En una frenada de 2 s solo se mueve durante los primeros 0,7 s.
assert.ok(Math.abs(pasoArcade({ velocidad: 10 }, { freno: true }, 2, { velocidadMax: 10 }).z - 3.5) < 1e-12);
assert.equal(pasoArcade({ velocidad: 10 }, {}, 0, { velocidadMax: 10 }).z, 0);
assert.throws(() => pasoArcade({}, {}, -1), RangeError);

const { crearRecorrido, avanzarRecorrido } = await import('../src/fisica/recorrido.js');
const ruta = crearRecorrido([{ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 3, y: 4, z: 10 }]);
assert.equal(ruta.longitud, 15);
assert.deepEqual(avanzarRecorrido(ruta, 0, 2, 2.5), { s: 5, x: 3, y: 4, z: 0, extremo: false });
assert.deepEqual(avanzarRecorrido(ruta, 5, 2, 2), { s: 9, x: 3, y: 4, z: 4, extremo: false });
assert.deepEqual(avanzarRecorrido(ruta, 9, -2, 3), { s: 3, x: 1.7999999999999998, y: 2.4, z: 0, extremo: false });
assert.equal(avanzarRecorrido(ruta, 14, 10, 5).s, 15);
assert.equal(avanzarRecorrido(ruta, 1, -10, 5).s, 0);
assert.throws(() => crearRecorrido([{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }]), RangeError);
assert.throws(() => avanzarRecorrido(ruta, 0, 1, -1), RangeError);
console.log('✓ perfiles de carrera, curvas intermedias, saturación y recorrido 3D');
