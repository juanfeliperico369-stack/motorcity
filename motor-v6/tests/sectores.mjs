import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { CargadorSectores } from '../src/sectores.js';
class TrabajadorFalso {
  constructor() { this.envios = []; this.escuchas = {}; }
  addEventListener(tipo, f) { this.escuchas[tipo] = f; }
  removeEventListener(tipo) { delete this.escuchas[tipo]; }
  postMessage(m) { this.envios.push(m); }
  responder(m, sector = { id: m.id }) { this.escuchas.message({ data: { id: m.id, token: m.token, sector, bytes: 100 } }); }
  fallar(m) { this.escuchas.message({ data: { id: m.id, token: m.token, error: 'falló' } }); }
  terminate() { this.terminado = true; }
  cargas() { return this.envios.filter(m => m.tipo === 'cargar'); }
}
const baseURL = 'https://example.test/mapa/indice.json';
const catalogo = [{id:'atras', x:0,z:-100,url:'a'}, {id:'adelante',x:0,z:100,url:'b'}, {id:'visible',x:500,z:0,url:'c'}];
{
  const w = new TrabajadorFalso(), cargados = [];
  const c = new CargadorSectores({catalogo, baseURL, tope:2, concurrencia:1, trabajador:w, alCargar:id => cargados.push(id)});
  c.actualizar({x:0,z:0,visibles:['visible'],radio:600});
  assert.equal(w.cargas()[0].id,'visible'); assert.equal(w.cargas()[0].url, 'https://example.test/mapa/c');
  w.responder(w.cargas()[0]); assert.equal(w.cargas()[1].id,'adelante'); w.responder(w.cargas()[1]);
  assert.deepEqual(cargados,['visible','adelante']); assert.equal(c.cache.size,2);
  c.actualizar({x:0,z:-100,visibles:['atras'],radio:0}); w.responder(w.cargas()[2]);
  assert.equal(c.cache.size,2); assert.equal(c.obtener('visible'),undefined); assert.equal(c.obtener('atras').id,'atras');
  c.cerrar(); assert.ok(w.terminado); assert.equal(c.cache.size,0); assert.equal(c.deseados.size,0);
}
{
  const w = new TrabajadorFalso();
  const cadena = ['a','b','c','d'].map((id, i, todos) => ({id,url:id,x:i*10,z:0,dependencias:i < 3 ? [todos[i+1]] : []}));
  const c = new CargadorSectores({catalogo:cadena,baseURL,tope:2,concurrencia:1,trabajador:w});
  c.actualizar({x:0,z:0,visibles:['a'],radio:100});
  assert.deepEqual([...c.deseados].sort(),['a','b']);
  assert.equal(w.cargas()[0].id,'a'); w.responder(w.cargas()[0]);
  assert.equal(w.cargas()[1].id,'b'); w.responder(w.cargas()[1]);
  assert.equal(w.cargas().length,2); c.cerrar();
}
{
  const w = new TrabajadorFalso();
  const c = new CargadorSectores({catalogo:[{id:'visible',url:'v',x:0,z:0,dependencias:['fuera']},{id:'fuera',url:'f',x:2000,z:0},{id:'prefetch',url:'p',x:10,z:0}],baseURL,tope:3,concurrencia:1,trabajador:w});
  c.actualizar({x:0,z:0,visibles:['visible'],radio:100});
  assert.equal(w.cargas()[0].id,'visible'); w.responder(w.cargas()[0]);
  assert.equal(w.cargas()[1].id,'fuera'); w.responder(w.cargas()[1]);
  assert.equal(w.cargas()[2].id,'prefetch'); c.cerrar();
}
{
  const w = new TrabajadorFalso(), errores = [];
  const c = new CargadorSectores({catalogo, baseURL, tope:2, concurrencia:2, trabajador:w, reintentos:1, alError:(...e) => errores.push(e)});
  c.actualizar({x:0,z:0,radio:150}); const [primero, cerca] = w.cargas();
  c.actualizar({x:0,z:-100,radio:0});
  assert.ok(w.envios.some(m => m.tipo === 'cancelar' && m.token === primero.token));
  assert.ok(!w.envios.some(m => m.tipo === 'cancelar' && m.token === cerca.token));
  w.responder(primero); assert.equal(c.obtener(primero.id),undefined); // respuesta tardía ignorada
  w.fallar(cerca); const retry = w.cargas().at(-1); assert.equal(retry.id, cerca.id); assert.notEqual(retry.token,cerca.token);
  w.fallar(retry); assert.equal(errores.length,1); assert.equal(c.pendientes.size,0);
  c.actualizar({x:0,z:-100,radio:0}); assert.equal(w.cargas().length,3); // no reintenta infinitamente
  c.cerrar();
}
{
  const w = new TrabajadorFalso();
  const c = new CargadorSectores({catalogo:[{id:'a',url:'a',x:0,z:0,dependencias:['b']},{id:'b',url:'b',x:1000,z:0,dependencias:['a']},{id:'c',url:'c',x:2000,z:0}], baseURL,tope:2,concurrencia:1,trabajador:w});
  c.actualizar({x:0,z:0,visibles:['a'],radio:0}); assert.deepEqual([...c.deseados].sort(),['a','b']);
  assert.throws(() => c.actualizar({x:0,z:0,visibles:['a','c'],radio:0}), /dependencias/);
  assert.deepEqual([...c.deseados].sort(),['a','b']); assert.equal(c.pendientes.size,1); // rechazo atómico
  w.responder(w.cargas()[0]); assert.equal(w.cargas()[1].id,'b'); c.cerrar();
  assert.throws(() => new CargadorSectores({catalogo:[{id:'a',url:'a',x:0,z:0,dependencias:['x']}],baseURL,trabajador:w}), /desconocida/);
}
{
  const w = new TrabajadorFalso(), errores = [];
  const c = new CargadorSectores({catalogo,baseURL,trabajador:w,concurrencia:1,reintentos:0,timeoutMs:10,alError:(...e) => errores.push(e)});
  c.actualizar({x:0,z:0,visibles:['visible'],radio:0});
  await new Promise(resolve => setTimeout(resolve,35));
  assert.equal(errores.length,1); assert.match(errores[0][1],/Tiempo/); assert.equal(c.pendientes.size,0); c.cerrar();
}
{
  const w = new TrabajadorFalso(), errores = [];
  const c = new CargadorSectores({catalogo,baseURL,trabajador:w,concurrencia:1,alError:(...e) => errores.push(e)});
  c.actualizar({x:0,z:0,radio:600}); w.escuchas.error({message:'se cayó'});
  assert.equal(errores.length,3); assert.equal(c.pendientes.size,0); assert.throws(() => c.actualizar({x:0,z:0}),/se cayó/); c.cerrar();
}
// Ejecuta el código real del trabajador con respuestas controladas, sin fingir
// que esta prueba de Node reemplaza la integración de navegador.
{
  let recibir; const resultados = [];
  const self = { addEventListener: (_, f) => recibir = f, postMessage: m => resultados.push(m) };
  let cuerpo = {version:1,unidad:'m',id:'a',origen:[0,0],tamano_m:250,nodos:[],tramos:[],objetos:[]};
  const fetch = async () => { const bytes = Buffer.from(JSON.stringify(cuerpo)); return {ok:true,headers:new Headers(),arrayBuffer:async () => bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}; };
  vm.runInNewContext(fs.readFileSync(new URL('../src/mundo/trabajador-sectores.js', import.meta.url),'utf8'), {self,fetch,TextDecoder,AbortController,Uint8Array});
  await recibir({data:{id:'a',token:1,url:'https://example.test/a'}}); assert.equal(resultados[0].sector.id,'a');
  cuerpo = {...cuerpo,id:'otro'}; await recibir({data:{id:'a',token:2,url:'https://example.test/a'}}); assert.match(resultados[1].error,/inválida/);
  cuerpo = {...cuerpo,id:'a',relleno:'x'.repeat(200000)}; await recibir({data:{id:'a',token:3,url:'https://example.test/a'}}); assert.match(resultados[2].error,/200 KB/);
}
{
  let recibir, leidos = 0, liberado = false; const resultados = [];
  const self = { addEventListener: (_, f) => recibir = f, postMessage: m => resultados.push(m) };
  const fetch = async () => ({ok:true,headers:new Headers(),body:{getReader:() => ({read:async () => { leidos++; return {done:false,value:new Uint8Array(110000)}; },releaseLock:() => { liberado = true; }})}});
  vm.runInNewContext(fs.readFileSync(new URL('../src/mundo/trabajador-sectores.js', import.meta.url),'utf8'), {self,fetch,TextDecoder,AbortController,Uint8Array});
  await recibir({data:{id:'a',token:1,url:'https://example.test/a'}});
  assert.equal(leidos,2); assert.ok(liberado); assert.match(resultados[0].error,/200 KB/);
}
{
  let recibir, señal; const resultados = [];
  const self = { addEventListener: (_, f) => recibir = f, postMessage: m => resultados.push(m) };
  const fetch = async (_, opciones) => { señal = opciones.signal; return {ok:true,headers:new Headers({'content-length':'200001'})}; };
  vm.runInNewContext(fs.readFileSync(new URL('../src/mundo/trabajador-sectores.js', import.meta.url),'utf8'), {self,fetch,TextDecoder,AbortController,Uint8Array});
  await recibir({data:{id:'a',token:1,url:'https://example.test/a'}});
  assert.ok(señal.aborted); assert.match(resultados[0].error,/200 KB/);
}
console.log('✓ prioridades, dependencias, cancelación, reintentos, tiempos, caída de trabajador y validación de datos');
