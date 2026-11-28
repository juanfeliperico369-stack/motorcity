/* Coordinación determinista de itinerarios sobre carriles laterales.
 * Una reserva exclusiva por nodo: desde la entrada a la convergencia hasta
 * que el vehículo y su cola han salido de la transición siguiente.
 * No controla al jugador ni cruces fuera de los nodos del grafo. */
import { muestraVial, pasoTrafico } from './trafico.js';
const EPS=1e-7;
export class RedTrafico {
 constructor(red,{margen=2,limite=8.33,aceleracion=2.2,frenado=4,maxActores=128}={}){
   if(!red?.carriles||![margen,limite,aceleracion,frenado].every(Number.isFinite)||margen<0||limite<=0||aceleracion<=0||frenado<=0||!Number.isInteger(maxActores)||maxActores<1)throw RangeError('Configuración de red inválida');
   this.red=red;this.opts={margen,limite,aceleracion,frenado};this.maxActores=maxActores;this.actores=[];this.reservas=new Map();this.solicitudes=new Map();this.tick=0;this.cruces=0;
 }
 _salida(c,a){return c.transicion_m+a.largo_m/2+this.opts.margen;}
 _parada(c,a){return c.largo-c.transicion_m-a.largo_m/2;}
 agregar({id,ruta,s,velocidad=0,largo_m=4,ancho_m=1.8}){
   if(typeof id!=='string'||!id||this.actores.some(a=>a.id===id)||this.actores.length>=this.maxActores||!Array.isArray(ruta)||ruta.length<1||ruta.length>512||![s,velocidad,largo_m,ancho_m].every(Number.isFinite)||velocidad<0||velocidad>this.opts.limite||largo_m<=0||ancho_m<=0)throw RangeError('Actor o ruta inválidos');
   const cs=ruta.map(id=>this.red.carriles.get(id)),a={id,ruta:[...ruta],i:0,carril:ruta[0],s,velocidad,largo_m,ancho_m,terminado:false,estado:'marcha',distancia_m:0};
   for(let i=0;i<cs.length;i++){const c=cs[i];if(!c||ancho_m>c.ancho_m||this._salida(c,a)>this._parada(c,a)||i&&cs[i-1].hasta!==c.desde)throw RangeError('Ruta desconectada o carril insuficiente');}
   if(s<this._salida(cs[0],a)||s>this._parada(cs[0],a))throw RangeError('Alta fuera de zona segura del carril');
   if(this.actores.some(b=>b.carril===a.carril&&Math.abs(b.s-a.s)<(a.largo_m+b.largo_m)/2+this.opts.margen))throw RangeError('Alta superpuesta');
   this.actores.push(a);
 }
 quitar(id){
   const a=this.actores.find(a=>a.id===id);if(!a||!a.terminado)return false;
   this.actores=this.actores.filter(a=>a.id!==id);this.solicitudes.delete(id);return true;
 }
 _destinoLibre(a,c){
   // No introducir el morro de otro actor en la zona de salida, incluso si
   // el siguiente vehículo está parado. Reserva un corredor de salida completo.
   return this.actores.every(b=>b.id===a.id||b.carril!==c.id||b.s-b.largo_m/2>=this._salida(c,a)+a.largo_m/2+this.opts.margen-EPS);
 }
 paso(dt,{verde=()=>true,libre=()=>true}={}){
   if(!Number.isFinite(dt)||dt<=0||dt>.1)throw RangeError('dt inválido');
   this.tick++;
   const frente=new Map();
   for(const a of this.actores){const b=frente.get(a.carril);if(!b||a.s>b.s)frente.set(a.carril,a);}
   // La prioridad es la antigüedad de llegada a la línea, no el orden del array.
   for(const a of this.actores){
     const c=this.red.carriles.get(a.carril);
     if(a.terminado||a.i===a.ruta.length-1||frente.get(a.carril)!==a||a.s<this._parada(c,a)-EPS){this.solicitudes.delete(a.id);continue;}
     if(!this.solicitudes.has(a.id))this.solicitudes.set(a.id,this.tick);
   }
   const candidatos=this.actores.filter(a=>this.solicitudes.has(a.id)).sort((a,b)=>this.solicitudes.get(a.id)-this.solicitudes.get(b.id)||a.id.localeCompare(b.id));
   for(const a of candidatos){
     const c=this.red.carriles.get(a.carril),d=this.red.carriles.get(a.ruta[a.i+1]),n=c.hasta;
     if(this.reservas.has(n)||[...this.reservas.values()].some(r=>r.actor===a.id)||!this._destinoLibre(a,d)||!verde(n,a,c,d)||!libre(n,a,c,d))continue;
     this.reservas.set(n,{actor:a.id,entrada:c.id,salida:d.id,fase:'entrada'});
     this.solicitudes.delete(a.id);
   }
   // Los estacionados siguen siendo obstáculos longitudinales. Mantenerlos
   // en el paso del carril con velocidad cero en su línea final.
   const previo=new Map(this.actores.map(a=>[a.id,a]));
   const movidos=pasoTrafico(this.red,this.actores,dt,{...this.opts,permiso:(n,a)=>{const r=this.reservas.get(n);return r?.actor===a.id&&r.fase==='entrada'&&r.entrada===a.carril;}});
   this.actores=movidos.map(a=>{
     const old=previo.get(a.id),c=this.red.carriles.get(a.carril);
     a.distancia_m=old.distancia_m+a.s-old.s;
     const r=this.reservas.get(c.hasta);
     if(r?.actor===a.id&&r.fase==='entrada'&&a.s>=c.largo-EPS){
       // Ambos extremos son el mismo nodo, misma posición. Se conserva el
       // actor y su odómetro, el próximo paso arranca desde cero sin salto.
       a.i++;a.carril=r.salida;a.s=0;a.velocidad=0;a.estado='cruce';
       r.fase='salida';this.cruces++;
     }
     const actual=this.red.carriles.get(a.carril),sal=this.reservas.get(actual.desde);
     if(sal?.actor===a.id&&sal.fase==='salida'&&a.s>=this._salida(actual,a)-EPS)this.reservas.delete(actual.desde);
     if(a.i===a.ruta.length-1&&a.s>=this._parada(actual,a)-EPS){a.terminado=true;a.velocidad=0;a.estado='destino';}
     return a;
   });
   return this.estado();
 }
 estado(){return {tick:this.tick,cruces:this.cruces,reservas:[...this.reservas].map(([n,r])=>({n,...r})),actores:this.actores.map(a=>({...a,ruta:[...a.ruta],...muestraVial(this.red.carriles.get(a.carril),a.s)}))};}
}
