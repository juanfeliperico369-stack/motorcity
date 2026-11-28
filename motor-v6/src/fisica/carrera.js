/* Carrera sobre el mismo grafo métrico de la escena. Sin motor de tráfico:
 * señales de ensayo deterministas; el juego decide premios y economía. */
import { proyectarCiclo, muestraCiclo, avanzarCiclo } from './red-ciclo.js';
import { pasoArcade } from './arcade.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ang=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const smooth=t=>t*t*(3-2*t);
export function candidatoCarrera(red,pos){
  const e=proyectarCiclo(red,{...pos,nivel:pos.nivel??0});
  if(!e)return null;
  const t=red.tramos.get(e.tramo);
  if((e.sentido===1?t.largo-e.s:e.s)<1e-7){
    const n=e.sentido===1?t.hasta:t.desde;
    const ramas=red.conexiones.get(n).filter(o=>o.tramo!==e.tramo);
    const opciones=ramas.map(o=>{const tr=red.tramos.get(o.tramo);const v={...o,s:o.sentido===1?0:tr.largo};return {v,m:muestraCiclo(red,v)};}).filter(o=>o.m.nivel===(pos.nivel??0)).sort((a,b)=>Math.abs(ang(pos.rumbo,a.m.rumbo))-Math.abs(ang(pos.rumbo,b.m.rumbo)));
    if(opciones.length&&Math.abs(ang(pos.rumbo,opciones[0].m.rumbo))<Math.PI/2)return {...opciones[0].v,origen:{x:pos.x,z:pos.z}};
  }
  return e;
}
export function iniciarCarrera(red,pos){
  const e=candidatoCarrera(red,pos);if(!e)return null;
  return {fase:'entrada',t:0,origen:{x:pos.x,z:pos.z,y:pos.y,rumbo:pos.rumbo},ruta:{tramo:e.tramo,s:e.s,sentido:e.sentido},velocidad:0,distancia:0,cruces:0,carril:0,objetivoCarril:0,opciones:[],evento:'entrada',rama:null,sem:'ninguno',espera:0,rojo:false};
}
export function posicionCarrera(red,c){
  const p=muestraCiclo(red,c.ruta);
  if(c.fase==='entrada'){
    const k=smooth(clamp(c.t/.8,0,1));
    return {...p,x:c.origen.x+(p.x-c.origen.x)*k,z:c.origen.z+(p.z-c.origen.z)*k,y:c.origen.y+(p.y+.035-c.origen.y)*k,rumbo:c.origen.rumbo+ang(c.origen.rumbo,p.rumbo)*k};
  }
  const t=red.tramos.get(c.ruta.tramo),ext=Math.min(c.ruta.s,t.largo-c.ruta.s);
  const off=c.carril*smooth(clamp(ext/3,0,1));
  return {...p,x:p.x+Math.cos(p.rumbo)*off,z:p.z-Math.sin(p.rumbo)*off,y:p.y+.035};
}
export function luzCruce(nodo,t){
  if(nodo.cruce==='ninguno'||nodo.cruce==='prioridad')return 'verde';
  const hash=[...nodo.id].reduce((n,c)=>(n+c.charCodeAt(0))%12,0),u=((t+hash)%12+12)%12;
  return u<6?'verde':u<8?'ambar':'rojo';
}
export function pasoCarrera(red,prev,control,dt,perfil,tJuego){
  const c={...prev,opciones:[...prev.opciones]};
  if(c.fase==='entrada'){c.t=Math.min(.8,c.t+dt);if(c.t>=.8){c.fase='carrera';c.evento='avance';}return c;}
  if(c.fase!=='carrera')return c;
  const tr=red.tramos.get(c.ruta.tramo),n=red.nodos.get(c.ruta.sentido===1?tr.hasta:tr.desde),d=c.ruta.sentido===1?tr.largo-c.ruta.s:c.ruta.s;
  const m=muestraCiclo(red,c.ruta),lim=Math.max(0,m.ancho_m/2-.4);
  const opciones=red.conexiones.get(n.id).filter(o=>o.tramo!==tr.id).map(o=>{const r=red.tramos.get(o.tramo),e={...o,s:o.sentido===1?0:r.largo};return {...o,angulo:ang(m.rumbo,muestraCiclo(red,e).rumbo)};}).sort((a,b)=>b.angulo-a.angulo||a.tramo.localeCompare(b.tramo));
  c.opciones=d<=20?opciones:[];c.sem=d<=12?luzCruce(n,tJuego):'ninguno';
  if(control.rama&&c.opciones.some(o=>o.tramo===control.rama))c.rama=control.rama;
  if(control.lateral){c.objetivoCarril=clamp(c.objetivoCarril+control.lateral*3*dt,-lim,lim);}
  c.carril+=clamp(clamp(c.objetivoCarril,-lim,lim)-c.carril,-4*dt,4*dt);
  const permiso=luzCruce(n,tJuego)==='verde',parar=!permiso||(opciones.length>1&&!c.rama)||!opciones.length;
  // Distancia de frenada del perfil arcade, con 1 paso de margen.
  const frenada=c.velocidad*c.velocidad*.7/(2*perfil.velocidadMax)+c.velocidad*dt;
  const freno=!!control.freno||(parar&&d<=frenada+.15);
  if(!permiso&&freno)c.rojo=true;
  const mov=pasoArcade({x:0,z:0,rumbo:0,velocidad:c.velocidad},{avance:1,freno},dt,perfil);
  c.velocidad=mov.velocidad;
  const r=avanzarCiclo(red,c.ruta,mov.z,{rama:c.rama??undefined,pasoPermitido:permiso});
  c.distancia+=mov.z-r.restante_m;c.ruta=r.estado;c.evento=r.evento;
  if(r.evento==='cruce'){c.velocidad=0;c.rojo=true;c.espera+=dt;}
  else if(r.evento==='bifurcacion'||r.evento==='sin_datos'){c.velocidad=0;}
  else if(r.evento==='fin'){c.velocidad=0;c.fase='fin';}
  else if(r.evento==='transicion'){
    if(n.cruce!=='ninguno'&&c.rojo)c.cruces++;
    c.rojo=false;c.espera=0;c.rama=null;c.carril=0;c.objetivoCarril=0;c.opciones=[];c.sem='ninguno';
  }
  return c;
}
