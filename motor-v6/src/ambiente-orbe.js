import * as THREE from '../../js/vendor/three-0.170.0.module.min.js';
export function crearAmbiente(cfg,sectores){
 const g=new THREE.Group();g.name='Agua e infraestructura';
 const agua=new THREE.MeshStandardMaterial({color:0x2f7fb0,roughness:.42,metalness:.12,side:THREE.DoubleSide});
 const mar=new THREE.Mesh(new THREE.PlaneGeometry(5000,4000),agua);mar.rotation.x=-Math.PI/2;mar.position.set(1500,cfg.mar.nivel_m,1000);g.add(mar);
 const ps=cfg.rio.puntos,verts=[],ix=[],w=cfg.rio.ancho_m/2;
 for(let i=0;i<ps.length;i++){const p=ps[i],a=ps[Math.max(i-1,0)],b=ps[Math.min(i+1,ps.length-1)],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);
   verts.push(p[0]-dz/l*w,p[2],p[1]+dx/l*w,p[0]+dz/l*w,p[2],p[1]-dx/l*w);
   if(i){const k=i*2;ix.push(k-2,k,k-1,k,k+1,k-1);}
 }
 const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));rg.setIndex(ix);rg.computeVertexNormals();g.add(new THREE.Mesh(rg,agua));
 const tr=sectores.flatMap(s=>s.tramos).find(t=>t.id===cfg.puente.tramo),ns=new Map(sectores.flatMap(s=>s.nodos.map(n=>[n.id,n])));
 const a=ns.get(tr.desde),b=ns.get(tr.hasta),x=a.posicion[0],z0=a.posicion[1],z1=b.posicion[1],len=Math.abs(z1-z0),zm=(z0+z1)/2,ym=(a.altura_m+b.altura_m)/2;
 const acero=new THREE.MeshStandardMaterial({color:0x4a4f58,roughness:.7}),pilar=new THREE.MeshStandardMaterial({color:0xb9b6a6,roughness:.95});
 function box(w,h,l,x,y,z,mat){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,l),mat);o.position.set(x,y,z);g.add(o);return o;}
 const inclin=Math.atan2(b.altura_m-a.altura_m,z1-z0);
 const base=box(cfg.puente.ancho_m,1.15,len,x,ym-.60,zm,acero);base.rotation.x=-inclin;
 for(const lado of [-1,1]){
   const xx=x+lado*(cfg.puente.ancho_m/2-.12);
   const rail=box(.22,.32,len,xx,ym+cfg.puente.baranda_m,zm,acero);rail.rotation.x=-inclin;
   for(let d=0;d<=len;d+=10){const t=d/len;box(.18,1.12,.18,xx,a.altura_m+(b.altura_m-a.altura_m)*t+.56,z0+(z1-z0)*t,acero);}
 }
 for(const t of [.18,.82]){const z=z0+(z1-z0)*t,y=a.altura_m+(b.altura_m-a.altura_m)*t;
   box(6,y,3,x,y/2-.5,z,pilar);
   for(const lado of [-1,1])box(.7,12,.9,x+lado*5,y+6,z,acero);
   box(10.7,.65,.65,x,y+11.5,z,acero);
 }
 // Tirantes como barras delgadas, fuera de la calzada.
 function barra(a,b){const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u),o=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,d.length(),5),acero);o.position.copy(u.add(v).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());g.add(o);}
 for(const t of [.18,.82])for(const lado of [-1,1]){const z=z0+(z1-z0)*t,y=a.altura_m+(b.altura_m-a.altura_m)*t;for(const dt of [-.15,.15])barra([x+lado*5,y+11,z],[x+lado*4.9,a.altura_m+(b.altura_m-a.altura_m)*(t+dt)+.9,z0+(z1-z0)*(t+dt)]);}
 return g;
}
