/* Motor City: seguimiento vial, coordenadas SI. Sin cruces automáticos. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function crearCarrilesViales(sectores){
 const nodos=new Map(),tramos=new Map(),carriles=new Map();
 for(const s of sectores){for(const n of s.nodos){if(nodos.has(n.id))throw Error('Nodo duplicado');nodos.set(n.id,n);}for(const t of s.tramos){if(tramos.has(t.id))throw Error('Tramo duplicado');tramos.set(t.id,t);}}
 for(const c of tramos.values()){
   const d=c.circulacion;if(c.red!=='ciclovia'||d?.tipo!=='lateral')continue;
   const v=tramos.get(d.vial),a=nodos.get(c.desde),b=nodos.get(c.hasta);
   if(!v||v.red!=='vial'||!a||!b||v.desde!==c.desde||v.hasta!==c.hasta||v.nivel!==c.nivel||v.puntos.length!==2||![v.ancho_m,c.ancho_m,d.offset_m,d.transicion_m,a.altura_m,b.altura_m].every(Number.isFinite))throw RangeError('Corredor lateral inválido');
   const [x,z]=v.puntos[0],dx=v.puntos[1][0]-x,dz=v.puntos[1][1]-z,l=Math.hypot(dx,dz),medio=v.ancho_m/2,resto=v.ancho_m-c.ancho_m,signo=Math.sign(d.offset_m);
   if(!signo||resto<5.2||Math.abs(Math.abs(d.offset_m)-resto/2)>1e-6||d.transicion_m<=0||l<=2*d.transicion_m+5||![x,z,dx,dz].every(Number.isFinite))throw RangeError('Ancho o transición inválidos');
   const ancho=resto/2;
   for(const sentido of [1,-1]){
     const offset=-signo*(medio-ancho*(sentido===1?.5:1.5)),id=v.id+':'+sentido;
     if(carriles.has(id))throw Error('Dos ciclovías reclaman la misma calzada');
     carriles.set(id,{id,tramo:v.id,sentido,ancho_m:ancho,offset_m:offset,x,z,dx:dx/l,dz:dz/l,largo:l,y0:a.altura_m,y1:b.altura_m,nivel:v.nivel,desde:sentido===1?v.desde:v.hasta,hasta:sentido===1?v.hasta:v.desde,transicion_m:d.transicion_m});
   }
 }
 return {carriles,nodos};
}
export function muestraVial(c,s){
 if(!Number.isFinite(s)||s<0||s>c.largo)throw RangeError('Distancia vial inválida');
 const u=c.sentido===1?s:c.largo-s,t=clamp(Math.min(u,c.largo-u)/c.transicion_m,0,1),off=c.offset_m*t;
 const deriv=u<c.transicion_m?c.offset_m/c.transicion_m:u>c.largo-c.transicion_m?-c.offset_m/c.transicion_m:0;
 return {x:c.x+c.dx*u-c.dz*off,z:c.z+c.dz*u+c.dx*off,y:c.y0+(c.y1-c.y0)*u/c.largo+.035,rumbo:Math.atan2((c.dx-c.dz*deriv)*c.sentido,(c.dz+c.dx*deriv)*c.sentido),nivel:c.nivel};
}
/** Seguimiento por carril. La reserva externa de intersecciones es obligatoria
 * para entrar en la transición final; por defecto los actores se detienen
 * antes de la convergencia. No transfiere actores ni decide rutas. */
export function pasoTrafico(red,actores,dt,{permiso=()=>false,limite=8.33,aceleracion=2.2,frenado=4,margen=2}={}){
 if(![dt,limite,aceleracion,frenado,margen].every(Number.isFinite)||dt<=0||dt>.1||limite<=0||aceleracion<=0||frenado<=0||margen<0)throw RangeError('Parámetros de tráfico inválidos');
 const grupos=new Map(),ids=new Set(),resultado=new Map();
 for(const a of actores){
   const c=red.carriles.get(a.carril);
   if(!c||typeof a.id!=='string'||!a.id||ids.has(a.id)||![a.s,a.velocidad,a.largo_m].every(Number.isFinite)||a.s<0||a.s>c.largo||a.velocidad<0||a.largo_m<=0)throw RangeError('Actor inválido');
   ids.add(a.id);if(!grupos.has(a.carril))grupos.set(a.carril,[]);grupos.get(a.carril).push(a);
 }
 for(const [id,grupo] of grupos){
   const c=red.carriles.get(id);grupo.sort((a,b)=>b.s-a.s||a.id.localeCompare(b.id));
   let delante=null,anterior=null;
   for(const a of grupo){
     if(anterior&&anterior.s-a.s<(anterior.largo_m+a.largo_m)/2-1e-7)throw RangeError('Actores inicialmente superpuestos');
     const permitido=!!permiso(c.hasta,a),stop=permitido?c.largo:Math.max(a.s,c.largo-c.transicion_m-a.largo_m/2);
     const alcance=delante?Math.max(a.s,Math.min(stop,delante.s-(delante.largo_m+a.largo_m)/2-margen)):stop;
     const espacio=Math.max(0,alcance-a.s),objetivo=Math.min(limite,Math.sqrt(2*frenado*espacio)),v=clamp(objetivo,a.velocidad-frenado*dt,a.velocidad+aceleracion*dt);
     const paso=Math.min(espacio,Math.max(0,(a.velocidad+v)*dt/2));
     const nuevo={...a,s:a.s+paso,velocidad:paso>=espacio-1e-8?0:v,estado:paso>=espacio-1e-8?(delante?'cola':permitido?'fin':'espera'):'marcha'};
     resultado.set(a.id,nuevo);delante=nuevo;anterior=a;
   }
 }
 return actores.map(a=>resultado.get(a.id));
}
