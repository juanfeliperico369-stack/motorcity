/* Indicadores físicos de cruce. El reloj es el mismo de pasoCarrera.
 * Un indicador por nodo, no fases direccionales. No otorga por sí solo
 * una reserva de intersección. No usar luces puntuales por poste. */
import * as THREE from './three.js';
import {luzCruce} from '../fisica/carrera.js';
const colores={verde:0x48b879,ambar:0xffc149,rojo:0xe6534d};
const fases=['rojo','ambar','verde'];
export function permisoSemaforo(nodos,t,nodo){
 if(!Number.isFinite(t)||!nodos.has(nodo))return false;
 return luzCruce(nodos.get(nodo),t)==='verde';
}
export class IndicadoresCruce{
 constructor(nodos,piezas,{tope=256}={}){
  if(!Number.isInteger(tope)||tope<1||tope>2048||!Array.isArray(piezas)||piezas.length>tope)throw RangeError('Capacidad inválida');
  const ids=new Set();
  for(const p of piezas){
   if(typeof p.id!=='string'||ids.has(p.id)||nodos.get(p.nodo)?.cruce!=='semaforo'||![p.x,p.y,p.z,p.rumbo,p.altura_m,p.ancho_m,p.fondo_m].every(Number.isFinite)||Math.min(p.altura_m,p.ancho_m,p.fondo_m)<=0||p.huella?.length!==4||p.huella.some(q=>q.length!==2||!q.every(Number.isFinite)))throw RangeError('Indicador inválido');
   ids.add(p.id);
  }
  this.nodos=nodos;this.piezas=piezas.map(p=>({...p,huella:p.huella.map(q=>[...q])}));this.raiz=new THREE.Group();this.raiz.name='Indicadores de cruce';
  this.geo=new THREE.BoxGeometry(1,1,1);this.mats=[new THREE.MeshStandardMaterial({color:0x34474e}),new THREE.MeshBasicMaterial({color:0xffffff})];
  this.postes=new THREE.InstancedMesh(this.geo,this.mats[0],Math.max(1,piezas.length*2));this.luces=new THREE.InstancedMesh(this.geo,this.mats[1],Math.max(1,piezas.length*3));this.postes.count=piezas.length*2;this.luces.count=piezas.length*3;this.raiz.add(this.postes,this.luces);
  const tmp=new THREE.Object3D();
  const poner=(l,i,p,y,z,w,h,d)=>{tmp.position.set(p.x+Math.sin(p.rumbo)*z,p.y+y,p.z+Math.cos(p.rumbo)*z);tmp.rotation.set(0,p.rumbo,0);tmp.scale.set(w,h,d);tmp.updateMatrix();l.setMatrixAt(i,tmp.matrix);};
  for(const [i,p] of this.piezas.entries()){
   const h=p.altura_m,w=p.ancho_m,d=p.fondo_m;
   poner(this.postes,i*2,p,h*.40,0,w*.22,h*.8,d*.22);
   poner(this.postes,i*2+1,p,h*.85,0,w,h*.30,d*.8);
   for(let j=0;j<3;j++)poner(this.luces,i*3+j,p,h*(.95-j*.10),d*.43,w*.67,h*.065,d*.10);
  }
  this.postes.instanceMatrix.needsUpdate=true;this.luces.instanceMatrix.needsUpdate=true;this.color=new THREE.Color();this.estados=new Map();this.cerrado=false;this.actualizar(0);
 }
 actualizar(t){
  if(this.cerrado||!Number.isFinite(t))throw RangeError('Reloj inválido');
  let cambios=0;
  for(const [i,p] of this.piezas.entries()){
   const fase=luzCruce(this.nodos.get(p.nodo),t);
   if(this.estados.get(p.nodo)===fase)continue;
   this.estados.set(p.nodo,fase);cambios++;
   for(const [j,f] of fases.entries())this.luces.setColorAt(i*3+j,this.color.set(f===fase?colores[f]:0x292f32));
  }
  if(cambios&&this.luces.instanceColor)this.luces.instanceColor.needsUpdate=true;
  return {cambios,estados:[...this.estados].map(([nodo,fase])=>({nodo,fase}))};
 }
 huellas(){return this.piezas.map(p=>({id:p.id,huella:p.huella.map(q=>[...q]),base_m:p.y,altura_m:p.altura_m}));}
 cerrar(){if(this.cerrado)return;this.cerrado=true;this.raiz.removeFromParent();this.postes.dispose();this.luces.dispose();this.raiz.clear();this.geo.dispose();for(const m of this.mats)m.dispose();}
}
