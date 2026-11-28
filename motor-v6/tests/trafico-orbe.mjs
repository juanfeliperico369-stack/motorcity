import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {crearCarrilesViales,muestraVial} from '../src/fisica/trafico.js';
import {RutasViales} from '../src/fisica/rutas-viales.js';
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
const plan=new RutasViales(red);
let rutas=0,inalcanzables=0,maxTramos=0;
for(const a of plan.carriles.values())for(const b of plan.carriles.values()){
 if(a.id===b.id)continue;
 const q=plan.buscar(a.id,b.id);
 if(!q){inalcanzables++;continue;}
 assert.equal(q.ruta[0],a.id);assert.equal(q.ruta.at(-1),b.id);
 for(let i=1;i<q.ruta.length;i++){
   const u=red.carriles.get(q.ruta[i-1]),v=red.carriles.get(q.ruta[i]);
   assert.equal(u.hasta,v.desde);assert.notEqual(u.tramo,v.tramo);
 }
 assert.equal(new Set(q.ruta).size,q.ruta.length);
 rutas++;maxTramos=Math.max(maxTramos,q.ruta.length);
}
assert.equal(rutas+inalcanzables,plan.carriles.size*(plan.carriles.size-1));
assert.ok(rutas>2000);
console.log('RUTAS ORBE: '+plan.carriles.size+' carriles elegibles; '+rutas+' pares conectados sin giro U; '+inalcanzables+' no alcanzables; máximo '+maxTramos+' tramos');
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
