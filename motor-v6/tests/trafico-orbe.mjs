import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {crearCarrilesViales,muestraVial} from '../src/fisica/trafico.js';
import {RedTrafico} from '../src/fisica/red-trafico.js';
import {CapaTrafico} from '../src/render/trafico.js';
const dir=process.argv[2];if(!dir)throw Error('Directorio de sectores compilados requerido');
const idx=JSON.parse(fs.readFileSync(path.join(dir,'indice.json')));
const ss=idx.sectores.map(c=>JSON.parse(fs.readFileSync(path.join(dir,c.url))));
const red=crearCarrilesViales(ss);
assert.equal(red.carriles.size,62);
for(const c of red.carriles.values()){
 const a=red.nodos.get(c.desde),b=red.nodos.get(c.hasta),p=muestraVial(c,0),q=muestraVial(c,c.largo);
 assert.ok(Math.hypot(p.x-a.posicion[0],p.z-a.posicion[1])<1e-7);
 assert.ok(Math.hypot(q.x-b.posicion[0],q.z-b.posicion[1])<1e-7);
 assert.equal(c.ancho_m,2.75);
}
const sim=new RedTrafico(red);
const entradas=[...red.carriles.values()].filter(c=>c.hasta==='n_km0'&&c.largo>=56),salidas=[...red.carriles.values()].filter(c=>c.desde==='n_km0'&&c.largo>=56);
assert.ok(entradas.length>=3&&salidas.length>=3);
for(const [i,c] of entradas.entries()){
 const d=salidas[(i+1)%salidas.length];
 sim.agregar({id:'orbe'+i,ruta:[c.id,d.id],s:c.largo-27});
}
let e=sim.estado(),max=0,maxSalto=0;
const capa=new CapaTrafico({tope:8});
for(let i=0;i<60;i++)sim.paso(1/60,{verde:()=>false});
assert.equal(sim.estado().cruces,0);
for(let i=0;i<18000;i++){
 const n=sim.paso(1/60);
 max=Math.max(max,n.reservas.length);
 for(const a of n.actores){const b=e.actores.find(b=>b.id===a.id);maxSalto=Math.max(maxSalto,Math.hypot(a.x-b.x,a.z-b.z));}
 e=n;
 if(i%60===0){const v=capa.actualizar(e.actores,{x:1350,z:1110,radio:2000});assert.equal(v.visibles,e.actores.length);assert.equal(capa.huellas().length,v.visibles);assert.equal(capa.lotes[2].count,v.visibles*4);}
 if(e.actores.every(a=>a.terminado))break;
}
assert.equal(e.cruces,entradas.length);assert.equal(e.reservas.length,0);assert.equal(max,1);assert.ok(e.actores.every(a=>a.terminado));assert.ok(maxSalto<.17);
assert.equal(capa.raiz.children.length,3);capa.cerrar();assert.equal(capa.raiz.children.length,0);
console.log('OK: Orbe compilada, '+red.carriles.size+' carriles, '+e.cruces+' itinerarios por Km 0, reserva exclusiva, salto máximo '+maxSalto.toFixed(3)+' m/paso, tres lotes y huellas dinámicas');
