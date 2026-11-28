import assert from 'node:assert/strict';
import { CargadorSectores } from '../src/sectores.js';
class TrabajadorFalso {
  constructor() { this.envios = []; }
  addEventListener(_, f) { this.escucha = f; }
  removeEventListener() { this.escucha = null; }
  postMessage(m) { this.envios.push(m); }
  responder(id, sector = { id }) { this.escucha({ data: { id, sector } }); }
  terminate() { this.terminado = true; }
}
const w = new TrabajadorFalso(), cargados = [];
const catalogo = [{id:'atras', x:0,z:-100,url:'a'}, {id:'adelante',x:0,z:100,url:'b'}, {id:'visible',x:500,z:0,url:'c'}];
const c = new CargadorSectores({catalogo, tope:2, concurrencia:1, trabajador:w, alCargar:id => cargados.push(id)});
c.actualizar({x:0,z:0,visibles:['visible'],radio:600});
assert.equal(w.envios[0].id,'visible');
w.responder('visible');
assert.equal(w.envios[1].id,'adelante');
w.responder('adelante');
assert.deepEqual(cargados,['visible','adelante']);
assert.equal(c.cache.size,2);
c.actualizar({x:0,z:-100,visibles:['atras'],radio:0});
assert.equal(w.envios[2].id,'atras');
w.responder('atras');
assert.equal(c.cache.size,2);
assert.equal(c.obtener('visible'),undefined);
assert.equal(c.obtener('atras').id,'atras');
c.cerrar(); assert.ok(w.terminado);
console.log('✓ prioridad visible y rumbo, concurrencia, caché limitada y cierre');
