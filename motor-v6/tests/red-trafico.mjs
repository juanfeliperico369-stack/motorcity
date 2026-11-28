import assert from 'node:assert/strict';
import {crearCarrilesViales} from '../src/fisica/trafico.js';
import {RedTrafico} from '../src/fisica/red-trafico.js';
const nodos=[['o',0,0],['n',0,100],['s',0,-100],['e',100,0],['w',-100,0]].map(([id,x,z])=>({id,posicion:[x,z],altura_m:0}));
const tramos=[];
for(const n of nodos.slice(1)){
 const v={id:n.id,red:'vial',desde:n.id,hasta:'o',nivel:0,ancho_m:10,puntos:[n.posicion,[0,0]]};
 tramos.push(v,{...v,id:'c'+n.id,red:'ciclovia',ancho_m:4.5,circulacion:{tipo:'lateral',vial:v.id,offset_m:2.75,transicion_m:25}});
}
const red=crearCarrilesViales([{nodos,tramos}]),sim=new RedTrafico(red);
sim.agregar({id:'uno',ruta:['n:1','s:-1'],s:40});
sim.agregar({id:'dos',ruta:['e:1','w:-1'],s:40});
sim.agregar({id:'tres',ruta:['n:1','w:-1'],s:29});
assert.throws(()=>sim.agregar({id:'mal',ruta:['s:1','e:1'],s:40}),/desconectada/);
assert.throws(()=>sim.agregar({id:'solapado',ruta:['n:1'],s:39}),/superpuesta/);
const dt=1/60;
for(let i=0;i<900;i++){const e=sim.paso(dt,{verde:()=>false});assert.equal(e.cruces,0);assert.equal(e.reservas.length,0);assert.ok(e.actores.every(a=>a.s<=73+1e-7));}
assert.equal(sim.estado().actores.find(a=>a.id==='uno').s,73);
let previo=sim.estado(),max=0,cruces=[];
for(let i=0;i<5400;i++){
 const e=sim.paso(dt);max=Math.max(max,e.reservas.length);assert.ok(e.reservas.length<=1);
 for(const a of e.actores){const b=previo.actores.find(b=>b.id===a.id);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<.17,'salto de posición');assert.ok(a.distancia_m>=b.distancia_m-1e-7);if(a.i!==b.i)cruces.push(a.id);}
 for(const a of e.actores)for(const b of e.actores)if(a.id!==b.id&&a.carril===b.carril)assert.ok(Math.abs(a.s-b.s)>=6-1e-7);
 previo=e;
 if(e.actores.every(a=>a.terminado))break;
}
assert.ok(previo.actores.every(a=>a.terminado));assert.equal(previo.cruces,3);assert.equal(max,1);assert.equal(previo.reservas.length,0);assert.deepEqual(cruces,['dos','uno','tres']);
assert.equal(sim.quitar('uno'),true);assert.equal(sim.quitar('no'),false);
console.log('OK: tres itinerarios, rojo, reserva exclusiva FIFO, transición continua y destino; '+previo.tick+' pasos');
