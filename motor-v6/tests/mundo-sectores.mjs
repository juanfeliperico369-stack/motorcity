import assert from 'node:assert/strict';
import { MundoSectores, alturaSector } from '../src/mundo-sectores.js';
class W{
  constructor(){this.e={};this.m=[];}
  addEventListener(k,f){this.e[k]=f;}
  removeEventListener(k){delete this.e[k];}
  postMessage(m){this.m.push(m);}
  terminate(){this.terminado=true;}
  enviar(s){const m=this.m.filter(m=>m.tipo==='cargar'&&m.id===s.id).at(-1);assert.ok(m);this.e.message({data:{id:s.id,token:m.token,sector:s,bytes:123}});}
}
const idx={version:1,tamano_m:250,sectores:[{id:'a',x:125,z:125,url:'a.json',dependencias:['b']},{id:'b',x:375,z:125,url:'b.json',dependencias:['a']},{id:'c',x:625,z:125,url:'c.json',dependencias:[]}]};
const n=(id,x,z,h=0)=>({id,posicion:[x,z],altura_m:h,cruce:'ninguno'});
const sector=(id,x,nodos=[],tramos=[],objetos=[],alturas_m=[0,0,0,0])=>({id,version:1,unidad:'m',origen:[x,0],tamano_m:250,nodos,tramos,objetos,relieve:{nx:2,nz:2,alturas_m,fuente:'fixture'}});
const a=sector('a',0,[n('n1',240,20,1)],[{id:'t',red:'ciclovia',desde:'n1',hasta:'n2',puntos:[[240,20],[250,22],[260,20]],ancho_m:2,pendiente:0,nivel:0}],[{id:'o',huella:[[245,30],[255,30],[255,40],[245,40]],altura_m:4,base_m:0}],[0,1,2,5]);
const b=sector('b',250,[n('n2',260,20,1)],[],[],[1,1,5,5]),c=sector('c',500);
assert.equal(alturaSector(a,0,0),0);
assert.equal(alturaSector(a,62.5,62.5),.75);
assert.equal(alturaSector(a,187.5,187.5),3.25);
assert.equal(alturaSector(a,250,125),3);
assert.equal(alturaSector(b,250,125),3);
assert.equal(alturaSector(a,-1,5),undefined);
const w=new W(),m=new MundoSectores({indice:idx,opcionesCarga:{baseURL:'https://example.test/indice.json',tope:2,concurrencia:2,trabajador:w}});
try{
  m.actualizar({x:250,z:20,visibles:['a','b'],radio:0});
  w.enviar(a);m.procesar();assert.equal(m.estado().lotes,0);assert.deepEqual(m.estado().faltantesDatos,['a','b']);
  w.enviar(b);let e=m.procesar();assert.equal(e.lotes,1);assert.equal(e.pendientesLotes,3);assert.equal(e.listo,false);
  e=m.procesar({maxLotes:3});assert.equal(e.lotes,4);assert.equal(e.listo,true);
  assert.equal(m.raiz.children.filter(g=>g.name==='ciclovia:a').length,1);
  assert.equal(m.raiz.children.filter(g=>g.name==='edificio:a').length,1);
  assert.equal(e.triangulos,18); // dos suelos (4), vía (4), edificio (10)
  assert.ok(e.bytesGeometria>0);assert.equal(m.altura(250,125),3);
  const original=m.raiz.children.find(g=>g.name==='ciclovia:a');
  const normales=original.children[0].geometry.attributes.normal;assert.ok(normales.getY(0)>0);
  let liberados=0;for(const g of m.raiz.children)g.children[0].geometry.addEventListener('dispose',()=>liberados++);
  m.actualizar({x:375,z:20,visibles:['b'],radio:0});m.procesar({maxLotes:4});
  assert.equal(m.estado().lotes,3);assert.equal(liberados,1);assert.equal(m.raiz.children.find(g=>g.name==='ciclovia:a'),original);
  m.actualizar({x:625,z:20,visibles:['c'],radio:0});m.procesar();assert.equal(m.estado().lotes,0);assert.equal(liberados,4);
  w.enviar(c);e=m.procesar();assert.equal(e.lotes,1);assert.ok(e.listo);assert.equal(m.altura(0,0),undefined);
}finally{m.cerrar();}
assert.equal(m.raiz.children.length,0);assert.equal(m.estado().bytesGeometria,0);assert.ok(w.terminado);
const w2=new W(),m2=new MundoSectores({indice:{...idx,sectores:[idx.sectores[2]]},opcionesCarga:{baseURL:'https://example.test/indice.json',trabajador:w2}});
try{m2.actualizar({x:625,z:10,visibles:['c']});const sin={...c};delete sin.relieve;w2.enviar(sin);const e=m2.procesar();assert.equal(e.listo,false);assert.deepEqual(e.omisiones,[{id:'c',tipo:'relieve_sin_datos'}]);assert.equal(m2.altura(625,10),undefined);}finally{m2.cerrar();}
const w3=new W(),m3=new MundoSectores({indice:{...idx,sectores:[idx.sectores[2]]},maxVerticesLote:3,opcionesCarga:{baseURL:'https://example.test/indice.json',trabajador:w3}});
try{m3.actualizar({x:625,z:10,visibles:['c']});w3.enviar(c);const e=m3.procesar();assert.equal(e.listo,false);assert.match(e.errores[0].error,/Límite/);assert.equal(e.lotes,0);}finally{m3.cerrar();}
console.log('OK: Three real, relieve, altura en borde, dependencias, lotes sin duplicar, presupuesto, expulsión y cierre');
