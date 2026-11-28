/* Colisión dinámica conservadora, independiente de la capa de dibujo.
 * Los discos circunscritos incluyen todo el vehículo incluso cuando gira.
 * La prueba usa el segmento relativo de dos centros y sus rangos de altura.
 * No depende de FPS, visibilidad ni de lotes GPU. */
import { muestraVial } from './trafico.js';
const fin=Number.isFinite;
const radio=a=>Math.hypot(a.ancho_m,a.largo_m)/2;
const alto=a=>Math.min(2.1,Math.max(1.35,a.largo_m*.34));
function cuerpo(a){
 if(!a||![a.x,a.y,a.z,a.radio,a.alto].every(fin)||a.radio<0||a.alto<=0)throw RangeError('Cuerpo dinámico inválido');
 return a;
}
export function choqueRelativo(a0,a1,b0,b1){
 [a0,a1,b0,b1].forEach(cuerpo);
 if(Math.max(a0.y+a0.alto,a1.y+a1.alto)<Math.min(b0.y,b1.y)||Math.max(b0.y+b0.alto,b1.y+b1.alto)<Math.min(a0.y,a1.y))return false;
 const x=a0.x-b0.x,z=a0.z-b0.z,dx=a1.x-b1.x-x,dz=a1.z-b1.z-z,den=dx*dx+dz*dz;
 const u=den?Math.max(0,Math.min(1,-(x*dx+z*dz)/den)):0;
 return Math.hypot(x+u*dx,z+u*dz)<=Math.max(a0.radio,a1.radio)+Math.max(b0.radio,b1.radio);
}
export function cuerpoVehiculo(a){
 if(!a||![a.ancho_m,a.largo_m].every(fin)||a.ancho_m<=0||a.largo_m<=0)throw RangeError('Dimensiones inválidas');
 return cuerpo({...a,radio:radio(a),alto:alto(a)});
}
/** Evaluar movimiento del jugador ANTES del paso de tráfico. No usa el filtro visual. */
export function bloqueaJugador(actores,desde,hasta){
 cuerpo(desde);cuerpo(hasta);
 for(const a of actores){const b=cuerpoVehiculo(a);if(choqueRelativo(desde,hasta,b,b))return a.id;}
 return null;
}
/** Después de mover (o detener) el jugador, reservar su posición durante
 * todo el paso de tráfico. Cada actor se detiene si invade el disco. */
export function pasoProtegidoJugador(sim,dt,jugador,opciones={}){
 cuerpo(jugador);
 const previo=sim.estado();
 const ocupados=new Map(previo.actores.map(a=>[a.id,cuerpoVehiculo(a)]));
 const anterior=opciones.autorizarPaso??(()=>true);
 return sim.paso(dt,{...opciones,autorizarPaso:(a,b,c)=>{
   if(!anterior(a,b,c))return false;
   const p=cuerpoVehiculo({...a,...muestraVial(c,a.s)}),q=cuerpoVehiculo({...b,...muestraVial(c,b.s)});
   if(choqueRelativo(p,q,jugador,jugador))return false;
   // Conservador entre corredores diferentes. Actualizar la ocupación
   // de cada candidato aceptado, y proteger los anteriores barridos.
   for(const [id,o] of ocupados){
     if(id===a.id||o.carril===a.carril)continue;
     if(choqueRelativo(p,q,o,o))return false;
   }
   ocupados.set(a.id,q);
   return true;
 }});
}
