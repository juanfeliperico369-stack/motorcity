import { CargadorSectores } from '../src/sectores.js';
function comprobar(ok,msg){if(!ok)throw new Error(msg);}
class TrabajadorFalso{
  constructor(){this.envios=[];}
  addEventListener(_,fn){this.fn=fn;}
  removeEventListener(){this.fn=null;}
  postMessage(m){this.envios.push(m);}
  responder(id,sector={id}){this.fn({data:{id,sector}});}
  error(id){this.fn({data:{id,error:'fallo'}});}
  terminate(){this.terminado=true;}
}
function probar(){
  const iguales=(a,b)=>comprobar(JSON.stringify(a)===JSON.stringify(b),JSON.stringify({a,b}));
  const falla=(fn,msg)=>{let e;try{fn()}catch(x){e=x}comprobar(e&&e.message.includes(msg),msg);};
  const cat=[{id:'visible',x:0,z:0,url:'v.json',dependencias:['remoto']},{id:'remoto',x:2000,z:0,url:'r.json',dependencias:['otro']},{id:'otro',x:4000,z:0,url:'o.json'},{id:'cerca',x:0,z:100,url:'c.json'}];
  const crear=(opts={})=>{const w=new TrabajadorFalso(),c=new CargadorSectores({catalogo:cat,tope:3,concurrencia:1,trabajador:w,...opts});return {w,c};};
  const update=c=>c.actualizar({x:0,z:0,visibles:['visible'],radio:150});
  const tests=[
    ['prioridad visible, dependencia remota, sin recursión',()=>{const {c,w}=crear();update(c);iguales(w.envios.map(x=>x.id),['visible']);w.responder('visible');iguales(w.envios.map(x=>x.id),['visible','remoto']);w.responder('remoto');w.responder('cerca');iguales(c.estado().faltantes,[]);iguales(c.cache.size,3);comprobar(!c.cache.has('otro'),'carga recursiva');}],
    ['rechazo de presupuesto sin mutar estado',()=>{const {c}=crear({tope:1});falla(()=>update(c),'caché');iguales(c.estado().requeridos,0);}],
    ['rechazo de dependencia inexistente',()=>falla(()=>crear({catalogo:[{...cat[0],dependencias:['x']}]}),'desconocida')],
    ['peticiones deduplicadas y concurrencia',()=>{const {c,w}=crear({concurrencia:2});update(c);update(c);iguales(w.envios.map(x=>x.id),['visible','remoto']);}],
    ['respuesta obsoleta no se inserta',()=>{const {c,w}=crear();update(c);c.actualizar({x:4000,z:0,visibles:['otro'],radio:0});w.responder('visible');comprobar(!c.cache.has('visible'),'obsoleto');iguales(w.envios[1].id,'otro');}],
    ['error y reintento espaciado',()=>{let t=0;const {c,w}=crear({reloj:()=>t,reintentoMs:1000});update(c);w.error('visible');w.responder('remoto');w.responder('cerca');update(c);iguales(w.envios.length,3);t=1000;update(c);iguales(w.envios[3].id,'visible');w.responder('visible');iguales(c.estado().faltantes,[]);}],
    ['ID incorrecto no entra a caché',()=>{const {c,w}=crear();update(c);w.responder('visible',{id:'otro'});comprobar(!c.cache.has('visible'),'ID inválido');iguales(c.estado().fallos,['visible']);}],
    ['expulsión y cierre liberan recursos',()=>{const expulsados=[];const {c,w}=crear({tope:2,alExpulsar:id=>expulsados.push(id)});update(c);w.responder('visible');w.responder('remoto');c.actualizar({x:4000,z:0,visibles:['otro'],radio:0});w.responder('otro');iguales(c.cache.size,2);iguales(expulsados.length,1);c.cerrar();c.cerrar();iguales(c.cache.size,0);iguales(expulsados.length,3);comprobar(w.terminado,'worker no terminado');}],
    ['rumbo y distancia en precarga',()=>{const {c,w}=crear({catalogo:[{id:'a',x:0,z:-100,url:'a'},{id:'b',x:0,z:100,url:'b'}],tope:1});c.actualizar({x:0,z:0,radio:200});iguales(w.envios[0].id,'b');}]
  ];
  for(const [n,fn] of tests){fn();}return tests.map(([n])=>n);
}
for(const n of probar()) console.log('OK: '+n);
