/* Grafo de carrera sobre polilíneas de sectores v1; metros y radianes.
 * Modelo geométrico de centro de vía, sin tráfico, mallas ni control lateral.
 * Longitud horizontal por componentes de vector: OpenStax University Physics 1 §2.3.
 */
const cruces = new Set(['ninguno','semaforo','cebra','prioridad']);
const punto = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
const idValido = id => typeof id === 'string' && id.length > 0;
const mismos = (a,b) => a[0] === b[0] && a[1] === b[1];
const acotar = (v,a,b) => Math.min(b,Math.max(a,v));
export function crearRedCiclo(sectores, { completo = false, nodosCompletos = [] } = {}) {
  const nodos = new Map(), tramos = new Map(), conexiones = new Map();
  for (const sector of sectores) for (const n of sector.nodos) {
    if (!idValido(n.id) || !punto(n.posicion) || !Number.isFinite(n.altura_m) || !cruces.has(n.cruce) || nodos.has(n.id)) throw new RangeError('Nodo inválido o repetido');
    nodos.set(n.id, {...n,posicion:[...n.posicion]}); conexiones.set(n.id,[]);
  }
  const ausentes = [], vistos = new Set(), incompletos = new Set();
  const confirmados = new Set(nodosCompletos);
  for (const id of confirmados) if (!nodos.has(id)) throw new RangeError('Nodo completo desconocido');
  for (const sector of sectores) for (const t of sector.tramos) {
    if (t.red !== 'ciclovia') continue;
    if (!idValido(t.id) || vistos.has(t.id) || !Array.isArray(t.puntos) || t.puntos.length < 2 || !t.puntos.every(punto) || !Number.isFinite(t.ancho_m) || t.ancho_m <= 0 || !Number.isFinite(t.pendiente) || !Number.isInteger(t.nivel)) throw new RangeError('Tramo inválido o repetido');
    vistos.add(t.id);
    const a=nodos.get(t.desde), b=nodos.get(t.hasta);
    if (!a || !b) { ausentes.push(t.id); if(a)incompletos.add(a.id); if(b)incompletos.add(b.id); continue; }
    if (!mismos(a.posicion,t.puntos[0]) || !mismos(b.posicion,t.puntos.at(-1))) throw new RangeError('Extremos no coinciden con nodos');
    const puntos=t.puntos.map(p=>[...p]), segmentos=[];let largo=0;
    for(let i=1;i<puntos.length;i++){
      const a=puntos[i-1],b=puntos[i],dx=b[0]-a[0],dz=b[1]-a[1],m=Math.hypot(dx,dz);
      if(!Number.isFinite(m)||m<=0||!Number.isFinite(largo+m))throw new RangeError('Segmento degenerado');
      segmentos.push({a,b,dx:dx/m,dz:dz/m,inicio:largo,largo:m});largo+=m;
    }
    const tramo={...t,puntos,segmentos,largo};
    tramos.set(t.id,tramo);
    conexiones.get(t.desde).push({tramo:t.id,sentido:1});
    conexiones.get(t.hasta).push({tramo:t.id,sentido:-1});
  }
  if(completo && ausentes.length)throw new RangeError('Red completa con extremos ausentes');
  for(const id of confirmados) if(incompletos.has(id))throw new RangeError('Nodo declarado completo con extremo ausente');
  for(const c of conexiones.values())c.sort((a,b)=>a.tramo.localeCompare(b.tramo)||a.sentido-b.sentido);
  return {nodos,tramos,conexiones,completo,ausentes,nodosCompletos:confirmados};
}
function tramoEstado(red,e){
  const t=red.tramos.get(e.tramo);
  if(!t || ![1,-1].includes(e.sentido) || !Number.isFinite(e.s) || e.s<0 || e.s>t.largo)throw new RangeError('Estado de carrera inválido');
  return t;
}
export function muestraCiclo(red,e,{anchoCarril=1}={}){
  if(!Number.isFinite(anchoCarril)||anchoCarril<=0)throw new RangeError('Ancho de carril inválido');
  const t=tramoEstado(red,e);
  const g=e.sentido===1?(t.segmentos.find(g=>e.s<g.inicio+g.largo)??t.segmentos.at(-1)):(t.segmentos.find(g=>e.s<=g.inicio+g.largo)??t.segmentos.at(-1));
  const u=acotar(e.s-g.inicio,0,g.largo), a=red.nodos.get(t.desde),b=red.nodos.get(t.hasta);
  const pos=e.s===0?a.posicion:e.s===t.largo?b.posicion:u===0?g.a:u===g.largo?g.b:[g.a[0]+u*g.dx,g.a[1]+u*g.dz];
  const y=e.s===0?a.altura_m:e.s===t.largo?b.altura_m:a.altura_m+(b.altura_m-a.altura_m)*e.s/t.largo;
  return {x:pos[0],z:pos[1],y,rumbo:Math.atan2(g.dx*e.sentido,g.dz*e.sentido),ancho_m:t.ancho_m,carriles:Math.max(1,Math.floor(t.ancho_m/anchoCarril)),pendiente:t.pendiente*e.sentido,nivel:t.nivel};
}
/** Candidato de entrada, sin modificar al jugador. Distancia hasta centro de vía.
 * Si hay puentes superpuestos, el consumidor debe pasar su nivel real.
 * El consumidor conserva origen y realiza transición lateral, no teletransporta.
 */
export function proyectarCiclo(red,{x,z,rumbo=0,nivel}){
  if(![x,z,rumbo].every(Number.isFinite))throw new RangeError('Posición inválida');
  let mejor=null;
  for(const t of red.tramos.values()){
    if(nivel!==undefined&&t.nivel!==nivel)continue;
    for(const g of t.segmentos){
      const u=acotar((x-g.a[0])*g.dx+(z-g.a[1])*g.dz,0,g.largo);
      const px=g.a[0]+u*g.dx,pz=g.a[1]+u*g.dz,d=Math.hypot(x-px,z-pz);
      if(d>t.ancho_m/2)continue;
      const alineacion=Math.sin(rumbo)*g.dx+Math.cos(rumbo)*g.dz;
      const candidato={tramo:t.id,s:g.inicio+u,sentido:alineacion<0?-1:1,distancia_m:d,origen:{x,z},alineacion:Math.abs(alineacion)};
      if(!mejor||d<mejor.distancia_m||(d===mejor.distancia_m&&(candidato.alineacion>mejor.alineacion||(candidato.alineacion===mejor.alineacion&&t.id.localeCompare(mejor.tramo)<0))))mejor=candidato;
    }
  }
  return mejor;
}
/** Un paso como máximo hasta el siguiente nodo. Devuelve distancia sobrante;
 * el integrador decide cuándo continuar. Nunca consume distancia durante espera.
 * pasoPermitido es autorización externa de tráfico; no simula semáforos.
 */
export function avanzarCiclo(red,e,metros,{rama,pasoPermitido=false}={}){
  if(!Number.isFinite(metros)||metros<0)throw new RangeError('Distancia inválida');
  const t=tramoEstado(red,e), extremo=e.sentido===1?t.largo:0;
  const d=Math.abs(extremo-e.s), recorrido=Math.min(metros,d);
  let estado={tramo:e.tramo,s:recorrido===d?extremo:e.s+e.sentido*recorrido,sentido:e.sentido};
  const restante_m=metros-recorrido;
  if(recorrido<d)return {estado,restante_m,evento:'avance',posicion:muestraCiclo(red,estado)};
  const nodo=red.nodos.get(e.sentido===1?t.hasta:t.desde);
  const opciones=red.conexiones.get(nodo.id).filter(r=>r.tramo!==t.id);
  const base={estado,restante_m,nodo:nodo.id,cruce:nodo.cruce,opciones,posicion:muestraCiclo(red,estado)};
  if(nodo.cruce!=='ninguno'&&!pasoPermitido)return {...base,evento:'cruce'};
  if(!red.completo && !red.nodosCompletos.has(nodo.id) && (rama===undefined || !opciones.some(o=>o.tramo===rama)))return {...base,evento:'sin_datos'};
  if(!opciones.length)return {...base,evento:'fin'};
  if(rama===undefined&&opciones.length>1)return {...base,evento:'bifurcacion'};
  const elegida=rama===undefined?opciones[0]:opciones.find(o=>o.tramo===rama);
  if(!elegida)throw new RangeError('Rama no conectada');
  const siguiente=red.tramos.get(elegida.tramo);
  estado={...elegida,s:elegida.sentido===1?0:siguiente.largo};
  return {...base,estado,posicion:muestraCiclo(red,estado),evento:'transicion'};
}
