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

/* con la cámara de lejos, lo visible se recorta a lo que cabe en la caché (los más lejanos esperan) en vez de romper */
{
  const sectores = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const id = `s${i}${j}`, deps = [i > 0 ? `s${i - 1}${j}` : null, i < 5 ? `s${i + 1}${j}` : null].filter(Boolean); sectores.push({ id, x: i * 250 + 125, z: j * 250 + 125, url: id + '.json', dependencias: deps }); }
  const grande = new MundoSectores({ indice: { version: 1, tamano_m: 250, sectores }, opcionesCarga: { baseURL: 'https://example.test/indice.json', tope: 8, concurrencia: 2, trabajador: new W() } });
  let error = null; try { grande.actualizar({ x: 750, z: 500, radio: 3000, radioVisible: 3000 }); } catch (e) { error = e; }
  const req = new Set(grande.visibles.flatMap(id => [id, ...sectores.find(s => s.id === id).dependencias]));
  if (error || req.size > 8 || grande.recortados <= 0 || !grande.visibles.includes('s21') && !grande.visibles.includes('s31')) throw new Error('el recorte de lo visible falló: ' + (error?.message || req.size));
  console.log(`✓ y con la cámara de lejos lo visible cabe en la caché (${grande.visibles.length} visibles, ${req.size} con sus dependencias, ${grande.recortados} esperan)`);
  grande.cerrar();
}

/* las fachadas de la paleta G‑3: si el barrio las trae, lo genérico las usa (y el follaje, para los árboles) */
{
  const pal = new Map([['z', { escenario: ['#3f8a4f', '#5b4636', '#0e6378', '#e8e4c4', '#ffd36b'], fachadas: ['#e4dec8', '#d2c4a0', '#8e6f56', '#4f8696'], follaje_arbol: '#4a8f56' }]]);
  const wf = new W(), mf = new MundoSectores({ indice: idx, paletas: pal, generico, opcionesCarga: { baseURL: 'https://example.test/indice.json', tope: 2, concurrencia: 2, trabajador: wf } });
  mf.actualizar({ x: 250, z: 125, visibles: ['a', 'b'], radio: 0 }); wf.enviar(a); wf.enviar(b); mf.procesar({ maxLotes: 20 });
  const geo = mf.raiz.children.find(g => g.name === 'edificio:a').children[0].geometry, col = geo.attributes.color.array;
  const { Color } = await import('../src/render/three.js');
  const fach = ['#e4dec8', '#d2c4a0', '#8e6f56', '#4f8696'].map(h => new Color(h)), hsl = c => { const o = {}; c.getHSL(o); return o; };
  let fuera = 0; for (let i = 0; i < col.length; i += 3 * 30) { const c = new Color(col[i], col[i + 1], col[i + 2]), h = hsl(c); if (!fach.some(f => Math.abs(hsl(f).h - h.h) < 0.03 || hsl(f).s < 0.15 && h.s < 0.2)) fuera++; }
  if (fuera > 0) throw new Error(`colores de fachada fuera de la paleta: ${fuera}`);
  console.log('✓ y con la paleta G‑3, las fachadas de lo genérico salen de sus 4 colores');
  mf.cerrar();
}
