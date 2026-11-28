/* node motor-v6/tests/pulso.mjs */
import assert from 'node:assert/strict';
import { MusicaPulso, parametrosPulso } from '../src/sonido/pulso.js';
import { GuardianSonido } from '../src/sonido/guardian.js';

class Eventos {
  constructor() { this.listeners = new Map(); this.hidden = false; }
  addEventListener(n, f) { if (!this.listeners.has(n)) this.listeners.set(n, new Set()); this.listeners.get(n).add(f); }
  removeEventListener(n, f) { this.listeners.get(n)?.delete(f); }
  emitir(n) { for (const f of this.listeners.get(n) || []) f(); }
}
class Parametro {
  constructor() { this.value = 0; }
  setValueAtTime(v) { this.value = v; }
  cancelScheduledValues() {}
  linearRampToValueAtTime(v) { this.value = v; }
  exponentialRampToValueAtTime(v) { this.value = v; }
}
class Nodo {
  constructor() { this.gain = new Parametro(); this.frequency = new Parametro(); }
  connect() { return this; }
  disconnect() { this.desconectado = true; }
  start(t) { this.inicio = t; }
  stop(t) { this.fin = t; }
}
class Contexto {
  constructor() { this.state = 'suspended'; this.currentTime = 0; this.destination = {}; this.notas = []; }
  createGain() { return new Nodo(); }
  createOscillator() { const n = new Nodo(); this.notas.push(n); return n; }
  async resume() { this.state = 'running'; }
  async suspend() { this.state = 'suspended'; }
  async close() { this.state = 'closed'; }
}

const libre = parametrosPulso(), rapido = parametrosPulso({ velocidad: 18 }), urgente = parametrosPulso({ velocidad: 18, segundosRestantes: 0 });
assert.ok(libre.bpm < rapido.bpm && rapido.bpm < urgente.bpm);
assert.ok(libre.intensidad < rapido.intensidad && rapido.intensidad < urgente.intensidad);
assert.deepEqual(urgente, parametrosPulso({ velocidad: 500, segundosRestantes: 0 }));
assert.throws(() => parametrosPulso({ velocidad: NaN }), RangeError);
assert.throws(() => parametrosPulso({ segundosRestantes: -1 }), RangeError);
const doc = new Eventos(), win = new Eventos();
const g = new GuardianSonido({ ventana: win, documento: doc, Contexto });
const musica = new MusicaPulso({ guardian: g });
musica.actualizar({ velocidad: 5 });
assert.equal(musica.ctx, null, 'sin gesto no crea contexto');
assert.equal(await musica.activar(), true);
const ctx = musica.ctx;
musica.actualizar();
assert.equal(ctx.notas.length, 2, 'primer pulso con bajo y acento');
musica.actualizar();
assert.equal(ctx.notas.length, 2, 'no duplica el pulso en cuadros sucesivos');
ctx.currentTime = 1;
musica.actualizar({ velocidad: 10, segundosRestantes: 15 });
assert.equal(ctx.notas.length, 3, 'avanza al siguiente pulso');
assert.ok(ctx.notas.every(n => n.fin > n.inicio && n.fin - n.inicio < .2));
musica.pausar();
assert.equal(musica.salida.gain.value, 0, 'calla inmediatamente en pausa');
ctx.currentTime = 20; musica.actualizar();
assert.equal(ctx.notas.length, 3, 'sin notas mientras está en pausa');
musica.pausar(false); musica.actualizar();
assert.equal(ctx.notas.length, 5, 'reanuda sin reproducir pulsos acumulados');
doc.hidden = true; doc.emitir('visibilitychange');
assert.equal(ctx.state, 'suspended', 'el guardián calla al ocultar');
musica.actualizar(); assert.equal(ctx.notas.length, 5);
doc.hidden = false; doc.emitir('visibilitychange');
assert.equal(ctx.state, 'running');
musica.desactivar();
assert.equal(musica.salida.gain.value, 0);
musica.actualizar(); assert.equal(ctx.notas.length, 5);
await musica.cerrar();
assert.equal(ctx.state, 'closed'); assert.equal(g.contextos.size, 0);
await assert.rejects(() => musica.activar(), /cerrada/);
g.cerrar();

// Una activación aún pendiente no debe ganar a una desactivación posterior.
let resolver;
const lento = new GuardianSonido({ ventana: new Eventos(), documento: new Eventos(), Contexto });
lento.despertar = () => new Promise(r => { resolver = r; });
const carrera = new MusicaPulso({ guardian: lento }), activando = carrera.activar();
carrera.desactivar(); resolver(true);
assert.equal(await activando, false); assert.equal(carrera.activa, false); assert.equal(carrera.salida.gain.value, 0);
await carrera.cerrar(); lento.cerrar();
console.log('✓ pulso musical: gesto, tempo, pausa, visibilidad, reanudación y cierre');
