import assert from 'node:assert/strict';
import { CargadorSectores } from '../src/mundo/sectores.js';
import { perfilArcade, adaptarVelocidad, pasoArcade, MULTIPLICADORES } from '../src/fisica/arcade.js';
class W {
  constructor(){this.eventos={};this.envios=[];}
  addEventListener(t,f){this.eventos[t]=f;}
  removeEventListener(t){delete this.eventos[t];}
  postMessage(m){this.envios.push(m);}
  terminate(){this.cerrado=true;}
  responder(id,bytes=100,formato='json'){const m=this.envios.filter(m=>m.tipo==='cargar'&&m.id===id).at(-1);this.eventos.message({data:{id,token:m.token,sector:{id},bytes,formato}});}
}
const w=new W(), expulsados=[];
const catalogo=[{id:'a',url:'a.json',url_binaria:'a.rcs',x:0,z:0,dependencias:['b']},{id:'b',url:'b.json',x:2000,z:0},{id:'c',url:'c.json',x:4000,z:0}];
const c=new CargadorSectores({catalogo,baseUrl:'https://example.test/datos/indice.json',preferirBinario:true,tope:2,concurrencia:1,trabajador:w,alExpulsar:id=>expulsados.push(id),alCargar:id=>{if(id==='a')throw Error('callback simulado');}});
try{
  c.actualizar({x:0,z:0,visibles:['a'],radio:0});
  assert.equal(w.envios[0].urlBinaria,'https://example.test/datos/a.rcs');
  assert.deepEqual(c.estado().faltantes,['a','b']);
  w.responder('a',50,'RCS1'); w.responder('b',100);
  assert.deepEqual(c.estado().faltantes,[]);
  assert.equal(c.estado().bytesDescargadosCache,150);
  assert.deepEqual(c.estado().formatos,{a:'RCS1',b:'json'});
  assert.equal(c.estado().erroresCallbacks.length,1);
  c.actualizar({x:4000,z:0,visibles:['c'],radio:0});w.responder('c',120);
  assert.equal(c.estado().cache,2);assert.equal(expulsados.length,1);
  assert.deepEqual(c.estado().faltantes,[]);
}finally{c.cerrar();}
assert.equal(c.estado().bytesDescargadosCache,0);assert.equal(expulsados.length,3);assert.ok(w.cerrado);
assert.equal(Object.keys(MULTIPLICADORES).length,17);
assert.deepEqual(perfilArcade('foot'),{velocidadMax:3.5,pie:true});
assert.deepEqual(perfilArcade('foot',{correr:true}),{velocidadMax:7,pie:true});
assert.deepEqual(perfilArcade('bike'),{velocidadMax:11,pie:false});
const original={x:2,z:3,rumbo:1,velocidad:11};
const pie=adaptarVelocidad(original,perfilArcade('foot'));
assert.deepEqual(pie,{x:2,z:3,rumbo:1,velocidad:3.5});
assert.equal(original.velocidad,11);
assert.doesNotThrow(()=>pasoArcade(pie,{avance:1},1/60,perfilArcade('foot')));
console.log('OK: perfiles, alias URL, faltantes, contabilidad de bytes de transferencia, callbacks y cierre');
