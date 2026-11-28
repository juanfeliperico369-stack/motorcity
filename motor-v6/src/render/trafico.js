/* Capa visual genérica: tres lotes de instancias, geometría compartida.
 * El consumidor actualiza con estado de RedTrafico y usa huellas() para
 * registrar choques dinámicos. No altera la simulación ni el mapa. */
import * as THREE from './three.js';
export class CapaTrafico {
 constructor({tope=128}={}){
   if(!Number.isInteger(tope)||tope<1||tope>2048)throw RangeError('Tope inválido');
   this.tope=tope;this.raiz=new THREE.Group();this.raiz.name='Trafico';this.actores=[];this.cerrada=false;
   const caja=new THREE.BoxGeometry(1,1,1),mats=[new THREE.MeshStandardMaterial({color:0xffffff,roughness:.72}),new THREE.MeshStandardMaterial({color:0x7294a5,roughness:.48}),new THREE.MeshStandardMaterial({color:0x27343c,roughness:.95})];
   this.caja=caja;this.mats=mats;
   this.lotes=mats.map((m,i)=>{const o=new THREE.InstancedMesh(caja,m,tope*(i===2?4:1));o.count=0;o.frustumCulled=false;o.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.raiz.add(o);return o;});
   this.tmp=new THREE.Object3D();this.color=new THREE.Color();
 }
 actualizar(actores,{x=0,z=0,radio=400}={}){
   if(this.cerrada)throw Error('Capa cerrada');
   if(![x,z,radio].every(Number.isFinite)||radio<0)throw RangeError('Vista inválida');
   const seleccion=actores.filter(a=>Math.hypot(a.x-x,a.z-z)<=radio).sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z)||a.id.localeCompare(b.id)).slice(0,this.tope);
   const ids=new Set();
   for(const a of seleccion){if(typeof a.id!=='string'||ids.has(a.id)||![a.x,a.y,a.z,a.rumbo,a.ancho_m,a.largo_m].every(Number.isFinite)||a.ancho_m<=0||a.largo_m<=0)throw RangeError('Actor visual inválido');ids.add(a.id);}
   this.actores=seleccion.map(a=>({...a}));
   const colores=[0x13748a,0xe4aa44,0xcf604b,0xe9e1cc,0x65788a,0x579578];
   const posicion=(a,ox,oy,oz)=>[a.x+Math.cos(a.rumbo)*ox+Math.sin(a.rumbo)*oz,a.y+oy,a.z-Math.sin(a.rumbo)*ox+Math.cos(a.rumbo)*oz];
   const poner=(o,i,a,ox,oy,oz,w,h,l)=>{this.tmp.position.set(...posicion(a,ox,oy,oz));this.tmp.rotation.set(0,a.rumbo,0);this.tmp.scale.set(w,h,l);this.tmp.updateMatrix();o.setMatrixAt(i,this.tmp.matrix);};
   for(const [i,a] of seleccion.entries()){
     const w=a.ancho_m,l=a.largo_m,alto=Math.min(2.1,Math.max(1.35,l*.34));
     poner(this.lotes[0],i,a,0,alto*.34,0,w,alto*.43,l);
     const hash=[...a.id].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);
     this.lotes[0].setColorAt(i,this.color.set(colores[hash%colores.length]));
     poner(this.lotes[1],i,a,0,alto*.72,-l*.045,w*.78,alto*.40,l*.54);
     let k=0;for(const ox of [-w*.46,w*.46])for(const oz of [-l*.32,l*.32])poner(this.lotes[2],i*4+k++,a,ox,.28,oz,w*.13,.56,.56);
   }
   for(const [i,o] of this.lotes.entries()){o.count=seleccion.length*(i===2?4:1);o.instanceMatrix.needsUpdate=true;if(o.instanceColor)o.instanceColor.needsUpdate=true;}
   return {visibles:seleccion.length,omitidos:actores.length-seleccion.length,lotes:seleccion.length?3:0};
 }
 huellas(){
   return this.actores.map(a=>{const c=Math.cos(a.rumbo),s=Math.sin(a.rumbo),w=a.ancho_m/2,l=a.largo_m/2;
     return {id:'trafico:'+a.id,huella:[[-w,-l],[w,-l],[w,l],[-w,l]].map(([x,z])=>[a.x+c*x+s*z,a.z-s*x+c*z]),base_m:a.y,altura_m:Math.min(2.1,Math.max(1.35,a.largo_m*.34))};
   });
 }
 cerrar(){if(this.cerrada)return;this.cerrada=true;this.raiz.removeFromParent();for(const o of this.lotes)o.dispose();this.raiz.clear();this.caja.dispose();for(const m of this.mats)m.dispose();this.actores=[];}
}
