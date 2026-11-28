import assert from 'node:assert/strict';
import {crearCarrilesViales,muestraVial,pasoTrafico} from '../src/fisica/trafico.js';
const nodos=[{id:'a',posicion:[0,0],altura_m:0},{id:'b',posicion:[0,100],altura_m:5}];
const v={id:'v',red:'vial',desde:'a',hasta:'b',nivel:0,ancho_m:10,puntos:[[0,0],[0,100]]};
const c={...v,id:'c',red:'ciclovia',ancho_m:4.5,puntos:[[0,0],[-2.75,25],[-2.75,75],[0,100]],circulacion:{tipo:'lateral',vial:'v',offset_m:2.75,transicion_m:25}};
const red=crearCarrilesViales([{nodos,tramos:[v,c]}]);assert.equal(red.carriles.size,2);
const ida=red.carriles.get('v:1'),vuelta=red.carriles.get('v:-1');
assert.equal(ida.ancho_m,2.75);assert.equal(muestraVial(ida,50).x,3.625);assert.equal(muestraVial(vuelta,50).x,.875);assert.equal(muestraVial(ida,0).x,0);assert.equal(muestraVial(ida,100).z,100);assert.equal(muestraVial(vuelta,0).z,100);assert.equal(muestraVial(ida,50).y,2.535);
let actores=[{id:'a',carril:ida.id,s:30,velocidad:0,largo_m:4},{id:'b',carril:ida.id,s:10,velocidad:0,largo_m:4}];
for(let i=0;i<1800;i++){actores=pasoTrafico(red,actores,1/60);assert.ok(actores[0].s-actores[1].s>=6-1e-7);assert.ok(actores.every(a=>a.s<=73+1e-7));}
assert.ok(Math.abs(actores[0].s-73)<.01);assert.equal(actores[0].velocidad,0);
for(let i=0;i<1000;i++)actores=pasoTrafico(red,actores,1/60,{permiso:()=>true});
assert.equal(actores[0].s,100);assert.equal(actores[0].velocidad,0);assert.ok(actores[1].s<=94+1e-7);
assert.throws(()=>pasoTrafico(red,[{...actores[0],s:40},{...actores[1],s:39}],1/60),/superpuestos/);
assert.throws(()=>pasoTrafico(red,actores,1),/Parámetros/);
assert.equal(crearCarrilesViales([{nodos,tramos:[v]}]).carriles.size,0);
console.log('OK: bandas, sentidos, pendiente, cola, parada y permiso; 2800 pasos fijos');
