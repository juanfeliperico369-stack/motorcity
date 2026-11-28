/* Composición de vida urbana, sin acoplar al juego ni a la interfaz.
 * Coordenadas globales SI; el dueño de la escena suministra terreno,
 * reloj fijo, cuerpo del jugador, permisos externos y ciclo de vida. */
import * as THREE from '../render/three.js';
import {crearCarrilesViales,muestraVial} from '../fisica/trafico.js';
import {RedTrafico} from '../fisica/red-trafico.js';
import {RutasViales} from '../fisica/rutas-viales.js';
import {bloqueaJugador,pasoProtegidoJugador,cuerpoVehiculo,choqueRelativo} from '../fisica/choques-trafico.js';
import {chocaHuella} from '../fisica/huellas.js';
import {CapaTrafico} from '../render/trafico.js';
import {MobiliarioUrbano} from '../render/mobiliario.js';
import {IndicadoresCruce,permisoSemaforo} from '../render/semaforos.js';
import {crearAdoquin,exclusionesViales} from '../render/adoquin.js';

export class VidaUrbana{
 constructor({topologia,inventario,maxActores=16}){
  if(!inventario||inventario.version!==1||!Array.isArray(topologia)||!Array.isArray(inventario.piezas)||!Array.isArray(inventario.semaforos))throw RangeError('Inventario urbano inválido');
  this.red=crearCarrilesViales(topologia);this.sim=new RedTrafico(this.red,{maxActores});this.plan=new RutasViales(this.red);
  this.raiz=new THREE.Group();this.raiz.name='Vida urbana';this.inventario=inventario;this.tramos=topologia.flatMap(s=>s.tramos);
  this.coches=new CapaTrafico({tope:maxActores});this.muebles=new MobiliarioUrbano();this.senales=new IndicadoresCruce(this.red.nodos,inventario.semaforos);
  this.muebles.cargar(inventario.piezas);
  this.raiz.add(this.coches.raiz,this.muebles.raiz,this.senales.raiz);
  this.obstaculos=[...this.muebles.huellas(),...this.senales.huellas()];
  this.adoquin=null;this.sector=null;this.actual=this.sim.estado();this.reloj=0;this.cerrada=false;
 }
 // Llamar con el sector de la plaza cuando su suelo esté listo, null
 // cuando salga de escena. No reconstruye por cuadro.
 sincronizarPlaza(sector){
  if(this.cerrada)throw Error('Vida urbana cerrada');
  if(sector===this.sector)return;
  if(sector&&sector.id!==this.inventario.sector)throw RangeError('Sector de plaza incorrecto');
  this.adoquin?.cerrar();this.adoquin=null;this.sector=null;
  if(!sector)return;
  const d=this.inventario.adoquin;
  const exclusiones=exclusionesViales(this.tramos,{centro:d.centro,radio:d.disco_exterior.radio_m});
  this.adoquin=crearAdoquin(sector,d,{exclusiones});this.raiz.add(this.adoquin.malla);this.sector=sector;
 }
 agregar({id,inicio,destino,s,jugador,velocidad=0}){
  if(this.cerrada)throw Error('Vida urbana cerrada');
  const p=this.plan.buscar(inicio,destino);if(!p)return false;
  const c=this.red.carriles.get(inicio),a=cuerpoVehiculo({...muestraVial(c,s),ancho_m:1.8,largo_m:4});
  if(jugador&&choqueRelativo(a,a,jugador,jugador))return false;
  if(this.actual.actores.some(o=>choqueRelativo(a,a,cuerpoVehiculo(o),cuerpoVehiculo(o))))return false;
  this.sim.agregar({id,ruta:p.ruta,s,velocidad});this.actual=this.sim.estado();return true;
 }
 bloquear(desde,hasta){
  const id=bloqueaJugador(this.actual.actores,desde,hasta);if(id)return {tipo:'trafico',id};
  for(const o of this.obstaculos){
   if(Math.max(desde.y+desde.alto,hasta.y+hasta.alto)<o.base_m||Math.min(desde.y,hasta.y)>o.base_m+o.altura_m)continue;
   if(chocaHuella([desde.x,desde.z],[hasta.x,hasta.z],o.huella,Math.max(desde.radio,hasta.radio)))return {tipo:'mobiliario',id:o.id};
  }
  return null;
 }
 paso(dt,t,jugador,{libre=()=>true,autorizarPaso=()=>true}={}){
  if(this.cerrada||!Number.isFinite(t)||t<this.reloj-1e-7)throw RangeError('Reloj no monotónico');
  this.reloj=t;this.actual=pasoProtegidoJugador(this.sim,dt,jugador,{verde:n=>permisoSemaforo(this.red.nodos,t,n),libre,autorizarPaso});
  return this.actual;
 }
 dibujar({x,z,radio=250}){
  if(this.cerrada)throw Error('Vida urbana cerrada');
  const coches=this.coches.actualizar(this.actual.actores,{x,z,radio});
  const senales=this.senales.actualizar(this.reloj);
  return {coches,senales,adoquin:this.adoquin?.vertices??0,muebles:this.muebles.piezas.length,obstaculos:this.obstaculos.length};
 }
 quitar(id){const ok=this.sim.quitar(id);if(ok)this.actual=this.sim.estado();return ok;}
 cerrar(){if(this.cerrada)return;this.cerrada=true;this.adoquin?.cerrar();this.adoquin=null;this.sector=null;this.coches.cerrar();this.muebles.cerrar();this.senales.cerrar();this.raiz.removeFromParent();this.raiz.clear();}
}
