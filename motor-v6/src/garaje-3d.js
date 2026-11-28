/* Representaciones originales, facetadas, sin marcas. Todos los
 * materiales y geometrías son compartidos dentro del garaje. */
import * as THREE from '../../js/vendor/three-0.170.0.module.min.js';
import { VEHICULOS } from './vehiculos.js';
export function crearGaraje(){
 const modelos=new Map(),geos=new Map();
 const mat=(color)=>new THREE.MeshStandardMaterial({color,roughness:.85});
 const tinta=mat(0x24353f),teal=mat(0x176f87),crema=mat(0xeee1ba),piel=mat(0xc88e66),coral=mat(0xd36a4e),metal=mat(0x8699a1),oro=mat(0xc49a2c),vidrio=mat(0x8bbccc);
 function caja(g,x,y,z,a,h,l,m){const k=[a,h,l].join(':');let geo=geos.get(k);if(!geo){geo=new THREE.BoxGeometry(a,h,l);geos.set(k,geo);}const mesh=new THREE.Mesh(geo,m);mesh.position.set(x,y,z);g.add(mesh);return mesh;}
 function rueda(g,x,y,z,r=.31,w=.055){const k='r:'+r+':'+w;let geo=geos.get(k);if(!geo){geo=new THREE.CylinderGeometry(r,r,w,12);geos.set(k,geo);}const o=new THREE.Mesh(geo,tinta);o.rotation.z=Math.PI/2;o.position.set(x,y,z);g.add(o);return o;}
 function barra(g,a,b,r=.035,m=metal){const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),6),m);o.position.copy(u.add(v).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());g.add(o);}
 const cabeza=new THREE.SphereGeometry(.19,8,6);
 function persona(g,base=0,sentado=false){const cuerpo=new THREE.Group();g.add(cuerpo);const h=sentado?.75:1.07;caja(cuerpo,0,base+h,0,.35,.43,.23,teal);const c=new THREE.Mesh(cabeza,piel);c.position.set(0,base+h+.38,0);cuerpo.add(c);caja(cuerpo,0,base+h,-.17,.31,.34,.14,crema);for(const x of [-.13,.13]){caja(cuerpo,x,base+(sentado?.44:.37),sentado?.16:0,.14,sentado?.38:.64,.15,tinta);caja(cuerpo,x,base+.065,sentado?.29:.045,.18,.13,.3,tinta);}return cuerpo;}
 for(const v of VEHICULOS){const g=new THREE.Group();g.name=v.id;const t=v.tipo;
   if(t==='pie')persona(g);
   else if(t==='quad'||t==='inline'){persona(g,.10);for(const x of [-.13,.13]){caja(g,x,.08,0,.17,.10,.32,coral);for(const z of [-.11,.11])for(const dx of t==='quad'?[-.07,.07]:[0])rueda(g,x+dx,.055,z,.055,.035);}}
   else if(t==='tabla'||t==='long'){persona(g,.16);caja(g,0,.13,0,.25,.065,v.largo,oro);for(const x of [-.15,.15])for(const z of [-v.largo*.32,v.largo*.32])rueda(g,x,.065,z,.065,.05);}
   else if(t==='uni'||t==='euc'){const r=t==='uni'?.34:.28;rueda(g,0,r,0,r,.15);persona(g,t==='uni'?.55:.13,t==='uni');if(t==='uni')barra(g,[0,r,0],[0,.85,0],.04);else caja(g,0,.38,0,.22,.35,.26,coral);}
   else if(t==='scooter'||t==='escooter'){persona(g,.18);for(const z of [-.42,.42])rueda(g,0,.11,z,.11,.07);caja(g,0,.17,-.05,.2,.09,.72,teal);barra(g,[0,.17,.42],[0,1.16,.42],.035);barra(g,[-.23,1.16,.42],[.23,1.16,.42],.035);if(t==='escooter')caja(g,0,.25,-.08,.17,.13,.42,tinta);}
   else if(t==='auto'||t==='camion'){const l=v.largo,w=v.ancho,r=t==='camion'?.47:.35;
     for(const x of [-w*.48,w*.48])for(const z of [-l*.32,l*.32])rueda(g,x,r,z,r,.22);
     caja(g,0,r+.19,0,w,.43,l,teal);caja(g,0,r+.75,l*.19,w*.84,.7,l*.36,vidrio);
     if(t==='camion')caja(g,0,1.55,-l*.16,w*.94,1.8,l*.58,crema);else caja(g,0,1.4,0,.65,.15,.7,crema);
     for(const x of [-w*.34,w*.34]){caja(g,x,r+.25,l/2+.012,.22,.16,.03,crema);caja(g,x,r+.25,-l/2-.012,.2,.14,.03,coral);}
   }else if(t==='jetpack'){persona(g);for(const x of [-.2,.2]){caja(g,x,1.05,-.24,.16,.52,.22,metal);caja(g,x,.72,-.24,.12,.15,.17,oro);}}
   else{const l=v.largo,r=t==='moto'||t==='moped'?.32:.30;
     rueda(g,0,r,l*.36,r,.07);if(t==='trike'){for(const x of [-.43,.43])rueda(g,x,r,-l*.3,r,.07);}else rueda(g,0,r,-l*.36,r,.07);
     barra(g,[0,r,-l*.34],[0,.75,0],.045,teal);barra(g,[0,.75,0],[0,r,l*.34],.04,teal);barra(g,[0,r,l*.34],[0,1.01,l*.25],.045);barra(g,[-.25,1.01,l*.25],[.25,1.01,l*.25],.035);
     caja(g,0,.77,-.16,.24,.09,.27,tinta);persona(g,.35,true);
     if(['ebike','moped','moto'].includes(t))caja(g,0,.55,0,.25,.22,.46,metal);
     if(t==='trike'||t==='moto'||t==='ciclo')caja(g,0,.64,-l*.34,t==='trike'?.82:.36,.27,t==='trike'?.64:.34,crema);
   }
   modelos.set(v.id,g);
 }
 return modelos;
}
