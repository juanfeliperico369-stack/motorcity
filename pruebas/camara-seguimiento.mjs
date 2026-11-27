/* Cámara cenital: rumbo gradual optativo, reposo e interacción manual. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ctx = { console, require, process, Buffer, TextDecoder, TextEncoder, performance, setTimeout };
vm.runInNewContext(fs.readFileSync('dist/motor.js', 'utf8'), ctx);
const Camara = ctx.MC.Camara;
const objetivo = { x: 0, y: 0, z: 0, a: 0, v: 4 };
function nueva(op = {}) {
  const c = new Camara({ zoom: 3, ...op });
  c.usarPerfil('cenital');
  c.pantalla = [412, 860];
  return c;
}
function avanzar(c, o, segundos) {
  for (let i = 0; i < Math.round(segundos * 60); i++) c.actualizar(1 / 60, o);
}
const vieja = nueva();
avanzar(vieja, objetivo, 3);
assert.equal(vieja.yaw, 0);
const c = nueva({ seguirRumbo: true });
avanzar(c, objetivo, .1);
assert(c.yaw < 0 && c.yaw > -Math.PI / 2, 'giro gradual sin salto');
avanzar(c, objetivo, 3);
assert(Math.abs(c.yaw + Math.PI / 2) < .02, 'orienta hacia el rumbo');
c.tercio = true; c.zoom = c.limites.zoom[1];
c.gesto({ tipo: 'girar', da: .2 });
const manualCerca = c.yaw;
avanzar(c, objetivo, 1);
assert.equal(c.yaw, manualCerca, 'el acercamiento también respeta el gesto');
avanzar(c, objetivo, 3);
const quieto = c.yaw;
avanzar(c, { ...objetivo, a: 1, v: 0 }, 1);
assert.equal(c.yaw, quieto, 'se detiene si el jugador está quieto');
c.gesto({ tipo: 'girar', da: .4 });
const manual = c.yaw;
avanzar(c, { ...objetivo, a: 1 }, 1);
assert.equal(c.yaw, manual, 'respeta el giro manual temporalmente');
avanzar(c, { ...objetivo, a: 1 }, 4);
assert(Math.abs(c.yaw + 1 + Math.PI / 2) < .05, 'retoma después del gesto');
c.modo = 'libre';
const libre = c.yaw;
avanzar(c, { ...objetivo, a: 2 }, 1);
assert.equal(c.yaw, libre, 'no gira durante la cámara libre');
const reversa = nueva({ seguirRumbo: true });
avanzar(reversa, { ...objetivo, v: -4 }, 4);
assert(Math.abs(Math.abs(reversa.yaw) - Math.PI / 2) < .02 && reversa.yaw > 0, 'sigue el desplazamiento en reversa');
const cruce = nueva({ seguirRumbo: true });
cruce.yaw = Math.PI - .05;
const antesCruce = cruce.yaw;
avanzar(cruce, { ...objetivo, a: Math.PI / 2 - .05 }, .1);
assert(Math.abs(cruce.yaw - antesCruce) < .1, 'elige el giro corto al cruzar ±π');
console.log('✓ cámara cenital: optativa, giro gradual, reposo, gesto manual y modo libre');
