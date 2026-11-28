/* Lo genérico dentro de la escena por sectores (mundo/sectores-3d.js + mundo/generico.js), con Three real en Node.
   Uso: node motor-v6/tests/mundo-generico.mjs */
import assert from 'node:assert/strict';
import { MundoSectores } from '../src/mundo/sectores-3d.js';
import { generarGenerico } from '../src/mundo/generico.js';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
class W {   // un trabajador de mentiras, como en mundo-sectores.mjs: entrega los sectores cuando la prueba quiere
  constructor() { this.e = {}; this.m = []; }
  addEventListener(k, f) { this.e[k] = f; } removeEventListener(k) { delete this.e[k]; } postMessage(m) { this.m.push(m); } terminate() {}
  enviar(s) { const m = this.m.filter(m => m.tipo === 'cargar' && m.id === s.id).at(-1); assert.ok(m); this.e.message({ data: { id: s.id, token: m.token, sector: s, bytes: 100 } }); }
}
const idx = { version: 1, tamano_m: 250, sectores: [{ id: 'a', x: 125, z: 125, url: 'a.json', dependencias: ['b'] }, { id: 'b', x: 375, z: 125, url: 'b.json', dependencias: ['a'] }, { id: 'c', x: 625, z: 125, url: 'c.json', dependencias: [] }] };
const nodo = (id, x, z) => ({ id, posicion: [x, z], altura_m: 2, cruce: 'ninguno' });
const sector = (id, x, nodos, tramos, objetos = []) => ({ id, version: 1, unidad: 'm', origen: [x, 0], tamano_m: 250, nodos, tramos, objetos, zona: 'z', relieve: { nx: 2, nz: 2, alturas_m: [2, 2, 2, 2], fuente: 'fixture' } });
/* una avenida de 10 m que cruza las dos celdas, con su nodo en cada una */
const avenida = { id: 'av', red: 'vial', desde: 'na', hasta: 'nb', puntos: [[10, 125], [490, 125]], ancho_m: 10, pendiente: 0, nivel: 0 };
const a = sector('a', 0, [nodo('na', 10, 125)], [avenida], [{ id: 'hito', huella: [[100, 60], [140, 60], [140, 100], [100, 100]], altura_m: 20, base_m: 2 }]);
const b = sector('b', 250, [nodo('nb', 490, 125)], []), c = sector('c', 500, [], []);
let llamadas = 0;
const generico = ({ sector: s, vecinos, celda }) => { llamadas++; return generarGenerico({ id: s.id, celda, tramos: [s, ...vecinos].flatMap(v => v.tramos), objetos: [s, ...vecinos].flatMap(v => v.objetos), altura: () => 2, estilo: 'centro', semilla: 'prueba' }); };
const w = new W(), m = new MundoSectores({ indice: idx, generico, opcionesCarga: { baseURL: 'https://example.test/indice.json', tope: 2, concurrencia: 2, trabajador: w } });
try {
  m.actualizar({ x: 250, z: 125, visibles: ['a', 'b'], radio: 0 });
  w.enviar(a); w.enviar(b);
  const r0 = m.revision; let e = m.procesar({ maxLotes: 20 });
  ok(e.listo && e.errores.length === 0, 'la escena queda lista sin errores');
  ok(llamadas === 2 && m.revision > r0, 'lo genérico se genera una vez por celda visible (y sube la revisión)');
  const gen = [...m.objetos()].filter(o => o.generico), arboles = [...m.arboles()];
  ok(gen.length >= 10 && arboles.length >= 10, `aparecen ${gen.length} edificios genéricos y ${arboles.length} árboles a lo largo de la avenida`);
  ok([...m.objetos()].some(o => o.id === 'hito'), 'objetos() trae también los de los datos: un solo registro para la cámara y los choques');
  const lote = m.raiz.children.find(g => g.name === 'edificio:a')?.children[0];
  ok(lote && lote.geometry.attributes.color && lote.geometry.attributes.aFachada, 'el lote de edificios lleva el color de cada uno y su base y tope para la fachada');
  ok(lote.material.vertexColors && lote.material.userData.fachadas, 'con el material de fachadas');
  const ims = m.raiz.children.filter(g => g.name.startsWith('arboles:')).flatMap(g => g.children);
  ok(ims.length >= 1 && ims.every(i => i.isInstancedMesh) && ims.reduce((s, i) => s + i.count, 0) === arboles.length, 'los árboles van en instancias (una llamada de dibujo por forma)');
  /* procesar otra vez no regenera */
  m.procesar({ maxLotes: 5 }); ok(llamadas === 2, 'mientras nada cambie, no se vuelve a generar');
  /* al irse lejos, lo genérico de las celdas que salen de la caché se suelta; al volver, se rehace igual (misma semilla) */
  const huellas = () => JSON.stringify([...m.objetos()].filter(o => o.generico).sort((p, q) => p.id.localeCompare(q.id)).map(o => [o.id, o.huella, o.altura_m]));
  const antes = huellas();
  m.actualizar({ x: 625, z: 125, visibles: ['c'], radio: 0 }); w.enviar(c); m.procesar({ maxLotes: 20 });
  ok(!m.cargador.cache.has('a') && !m.genericos.has('a'), 'al salir de la caché una celda, su genérico se suelta (la caché tiene tope)');
  const ida = llamadas;
  m.actualizar({ x: 250, z: 125, visibles: ['a', 'b'], radio: 0 }); w.enviar(a); w.enviar(b); m.procesar({ maxLotes: 20 });
  ok(llamadas - ida === 2, 'al volver se rehace lo de las dos celdas (la versión de «a» cambió y «b» depende de ella)');
  ok(huellas() === antes, 'y sale idéntico: nada se guarda y nada cambia');
  /* sin el vecino cargado, esa celda no genera (no se inventa sin datos) */
  const fallo = new MundoSectores({ indice: idx, generico: () => { throw new Error('a propósito'); }, opcionesCarga: { baseURL: 'https://example.test/indice.json', tope: 4, concurrencia: 2, trabajador: new W() } });
  fallo.actualizar({ x: 250, z: 125, visibles: ['a', 'b'], radio: 0 }); fallo.cargador.trabajador.enviar(a); fallo.cargador.trabajador.enviar(b);
  const ef = fallo.procesar({ maxLotes: 20 }); ok(ef.errores.some(x => /a propósito/.test(x.error)), 'si lo genérico falla, se anota el error y la escena sigue');
  fallo.cerrar();
} finally { m.cerrar(); }
console.log(`✓ lo genérico en la escena por sectores: ${n} pruebas`);
