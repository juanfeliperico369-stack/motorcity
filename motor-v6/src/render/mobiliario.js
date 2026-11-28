/* Mobiliario urbano por instancias. Coordenadas y dimensiones del compilador,
 * sin dependencia de Orbe. Diseño de formas técnicas original, provisional.
 * La huella física se registra independientemente de lo que se dibuja. */
import * as THREE from './three.js';
export class MobiliarioUrbano{
 constructor({tope=256,metal=0x354c51,madera=0xa97c53,luz=0xffdf9b}={}){
  if(!Number.isInteger(tope)||tope<1||tope>2048)throw RangeError('Tope inválido');
  this.tope=tope;this.raiz=new THREE.Group();this.raiz.name='Mobiliario urbano';
  this.geo=[new THREE.BoxGeometry(1,1,1),new THREE.CylinderGeometry(.5,.5,1,8),new THREE.BoxGeometry(1,1,1)];
  this.mats=[new THREE.MeshStandardMaterial({color:madera,roughness:.85}),new THREE.MeshStandardMaterial({color:metal,roughness:.75}),new THREE.MeshStandardMaterial({color:luz,emissive:luz,emissiveIntensity:.24,roughness:.65})];
  this.lotes=this.mats.map((m,i)=>{const o=new THREE.InstancedMesh(this.geo[i],m,tope*(i===0?2:i===1?4:1));o.count=0;o.frustumCulled=false;this.raiz.add(o);return o;});
  this.tmp=new THREE.Object3D();this.piezas=[];this.cerrado=false;
 }
 cargar(piezas){
  if(this.cerrado)throw Error('Mobiliario cerrado');
  if(!Array.isArray(piezas)||piezas.length>this.tope)throw RangeError('Inventario excede capacidad');
  const ids=new Set();
  for(const p of piezas){
   if(typeof p.id!=='string'||!p.id||ids.has(p.id)||!['banca','farol'].includes(p.tipo)||![p.x,p.y,p.z,p.rumbo,p.ancho_m,p.fondo_m,p.altura_m].every(Number.isFinite)||Math.min(p.ancho_m,p.fondo_m,p.altura_m)<=0||!Array.isArray(p.huella)||p.huella.length!==4||p.huella.some(q=>q.length!==2||!q.every(Number.isFinite)))throw RangeError('Pieza inválida');
   ids.add(p.id);
  }
  this.piezas=piezas.map(p=>({...p,huella:p.huella.map(q=>[...q])}));
  const n=[0,0,0];
  const poner=(i,p,x,y,z,w,h,l)=>{
   const c=Math.cos(p.rumbo),s=Math.sin(p.rumbo),o=this.tmp;
   o.position.set(p.x+c*x+s*z,p.y+y,p.z-s*x+c*z);o.rotation.set(0,p.rumbo,0);o.scale.set(w,h,l);o.updateMatrix();this.lotes[i].setMatrixAt(n[i]++,o.matrix);
  };
  for(const p of this.piezas){
   const w=p.ancho_m,l=p.fondo_m,h=p.altura_m;
   if(p.tipo==='banca'){
    poner(0,p,0,h*.46,0,w,h*.12,l*.86);
    poner(0,p,0,h*.79,-l*.39,w,h*.37,l*.18);
    for(const x of [-w*.36,w*.36])for(const z of [-l*.31,l*.31])poner(1,p,x,h*.23,z,Math.min(.12,w*.1),h*.46,Math.min(.12,l*.2));
   }else{
    poner(1,p,0,h*.43,0,w*.29,h*.86,l*.29);
    poner(1,p,0,h*.10,0,w*.72,h*.2,l*.72);
    poner(2,p,0,h*.925,0,w*.88,h*.13,l*.88);
    poner(1,p,0,h*.99,0,w,.02*h,l);
   }
  }
  for(let i=0;i<3;i++){this.lotes[i].count=n[i];this.lotes[i].instanceMatrix.needsUpdate=true;}
  return {piezas:this.piezas.length,lotes:n.filter(x=>x>0).length,instancias:n};
 }
 huellas(){return this.piezas.map(p=>({id:p.id,huella:p.huella.map(q=>[...q]),base_m:p.y,altura_m:p.altura_m}));}
 cerrar(){if(this.cerrado)return;this.cerrado=true;this.raiz.removeFromParent();for(const o of this.lotes)o.dispose();this.raiz.clear();for(const o of [...this.geo,...this.mats])o.dispose();this.piezas=[];}
}
