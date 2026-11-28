import assert from 'node:assert/strict';
import {IndicadoresCruce,permisoSemaforo} from '../src/render/semaforos.js';
import {luzCruce} from '../src/fisica/carrera.js';
const nodos=new Map([['a',{id:'a',cruce:'semaforo'}],['b',{id:'b',cruce:'prioridad'}]]);
const p={id:'s',nodo:'a',x:1,y:0,z:1,rumbo:0,altura_m:3.6,ancho_m:.5,fondo_m:.5,huella:[[.75,.75],[1.25,.75],[1.25,1.25],[.75,1.25]]};
const s=new IndicadoresCruce(nodos,[p]),vistos=new Set();
for(let t=0;t<24;t+=.25){const e=s.actualizar(t);const f=luzCruce(nodos.get('a'),t);vistos.add(f);assert.equal(e.estados[0].fase,f);assert.equal(permisoSemaforo(nodos,t,'a'),f==='verde');assert.equal(s.actualizar(t).cambios,0);}
assert.equal(vistos.size,3);assert.equal(permisoSemaforo(nodos,0,'b'),true);assert.equal(permisoSemaforo(nodos,0,'x'),false);assert.equal(s.postes.count,2);assert.equal(s.luces.count,3);assert.equal(s.huellas().length,1);s.cerrar();assert.equal(s.raiz.children.length,0);
console.log('OK: reloj compartido de carrera, tres fases, dos lotes, permiso y huella');
