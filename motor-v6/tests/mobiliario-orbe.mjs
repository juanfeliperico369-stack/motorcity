import fs from 'node:fs';
import path from 'node:path';
import {IndicadoresCruce,permisoSemaforo} from '../src/render/semaforos.js';
import {luzCruce} from '../src/fisica/carrera.js';
import assert from 'node:assert/strict';
import {MobiliarioUrbano} from '../src/render/mobiliario.js';
const datos=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
assert.equal(datos.piezas.length,27);assert.equal(datos.rechazos.length,0);
assert.equal(datos.piezas.filter(p=>p.tipo==='banca').length,14);
assert.equal(datos.piezas.filter(p=>p.tipo==='farol').length,13);
const capa=new MobiliarioUrbano();
const e=capa.cargar(datos.piezas);
assert.deepEqual(e,{piezas:27,lotes:3,instancias:[28,95,13]});
assert.equal(capa.huellas().length,27);
assert.ok(capa.huellas().every((h,i)=>h.id===datos.piezas[i].id&&h.base_m===datos.piezas[i].y));
capa.cerrar();assert.equal(capa.raiz.children.length,0);
console.log('OK: mobiliario real de diseño, 27 piezas, 136 instancias, tres lotes y 27 huellas; recursos liberados');

const dir=process.argv[3],idx=JSON.parse(fs.readFileSync(path.join(dir,'indice.json')));
const nodos=new Map(idx.sectores.flatMap(c=>JSON.parse(fs.readFileSync(path.join(dir,c.url))).nodos).map(n=>[n.id,n]));
assert.equal(datos.semaforos.length,11);assert.equal(datos.semaforos_rechazados.length,0);
const indicadores=new IndicadoresCruce(nodos,datos.semaforos);
assert.equal(indicadores.huellas().length,11);assert.equal(indicadores.postes.count,22);assert.equal(indicadores.luces.count,33);
for(let t=0;t<12;t+=.25){const estado=indicadores.actualizar(t);assert.equal(estado.estados.length,11);for(const e of estado.estados){assert.equal(e.fase,luzCruce(nodos.get(e.nodo),t));assert.equal(permisoSemaforo(nodos,t,e.nodo),e.fase==='verde');}}
indicadores.cerrar();
console.log('OK: 11 indicadores físicos, 55 instancias en 2 lotes, 48 muestras de reloj sincronizadas');
