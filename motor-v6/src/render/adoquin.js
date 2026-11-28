/* Decoración de suelo recortada sobre los triángulos del DEM.
 * No altera alturas ni física. Las exclusiones convexas eliminan
 * pavimento debajo de la calzada; un solo lote con color por vértice. */
import * as THREE from './three.js';
const cruz=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
const EPS=1e-8;
function recortar(poly,a,b,dentro=true){
 const out=[];
 for(let i=0;i<poly.length;i++){
  const p=poly[i],q=poly[(i+1)%poly.length],u=cruz(a,b,p),v=cruz(a,b,q),ip=dentro?u>=-EPS:u<=EPS,iq=dentro?v>=-EPS:v<=EPS;
  if(ip)out.push(p);
  if(ip!==iq&&Math.abs(u-v)>EPS){const t=u/(u-v);out.push(p.map((x,k)=>x+(q[k]-x)*t));}
 }
 return out;
}
function cortar(poly,limite){
 for(let i=0;i<limite.length&&poly.length>=3;i++)poly=recortar(poly,limite[i],limite[(i+1)%limite.length]);
 return poly;
}
function restar(poly,limite){
 const partes=[];
 for(let i=0;i<limite.length&&poly.length>=3;i++){
  const a=limite[i],b=limite[(i+1)%limite.length],fuera=recortar(poly,a,b,false);
  if(fuera.length>=3)partes.push(fuera);
  poly=recortar(poly,a,b);
 }
 return partes;
}
const caja=ps=>[Math.min(...ps.map(p=>p[0])),Math.min(...ps.map(p=>p[1])),Math.max(...ps.map(p=>p[0])),Math.max(...ps.map(p=>p[1]))];
const toca=(a,b)=>a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1];
/** Polígono conservador para cada segmento vial, con margen en extremos. */
export function exclusionesViales(tramos,{margen=.15,centro,radio}={}){
 if(!Number.isFinite(margen)||margen<0)throw RangeError('Margen inválido');
 const out=[];
 for(const t of tramos){
  if(!Number.isFinite(t.ancho_m)||t.ancho_m<=0)throw RangeError('Ancho inválido');
  for(let i=1;i<t.puntos.length;i++){
   const a=t.puntos[i-1],b=t.puntos[i],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);
   if(!(l>0))throw RangeError('Segmento inválido');
   const r=t.ancho_m/2+margen,ux=dx/l,uz=dz/l;
   const p=[a[0]-ux*r,a[1]-uz*r],q=[b[0]+ux*r,b[1]+uz*r],nx=-uz*r,nz=ux*r;
   const pol=[[p[0]-nx,p[1]-nz],[q[0]-nx,q[1]-nz],[q[0]+nx,q[1]+nz],[p[0]+nx,p[1]+nz]];
   if(!centro||toca(caja(pol),[centro[0]-radio,centro[1]-radio,centro[0]+radio,centro[1]+radio]))out.push(pol);
  }
 }
 return out;
}
/** centro [x,z], relieve sectorial triangulado como MundoSectores.
 * Cada vértice [x,z,y] conserva altura exacta del triángulo original.
 * El anillo y medallón se recortan sin superponer superficies. */
export function crearAdoquin(sector,diseno,{exclusiones=[],offset=.012,maxVertices=60000}={}){
 const {relieve:r,origen:o,tamano_m:t}=sector,{centro,disco_exterior:d,anillo_medio:a,medallon_km_cero:m}=diseno;
 if(!r||!Number.isInteger(r.nx)||!Number.isInteger(r.nz)||r.nx<2||r.nz<2||r.nx>129||r.nz>129||r.alturas_m.length!==r.nx*r.nz||!r.alturas_m.every(Number.isFinite)||!o?.every(Number.isFinite)||!Number.isFinite(t)||t<=0||!centro?.every(Number.isFinite)||![d.radio_m,a.radio_interior_m,a.radio_exterior_m,m.radio_m,offset].every(Number.isFinite)||!(0<m.radio_m&&m.radio_m<a.radio_interior_m&&a.radio_interior_m<a.radio_exterior_m&&a.radio_exterior_m<d.radio_m)||offset<=0||offset>=.02||!Number.isInteger(maxVertices)||maxVertices<3)throw RangeError('Adoquín inválido');
 if(exclusiones.length>512)throw RangeError('Demasiadas exclusiones');
 const circulo=(r,n)=>Array.from({length:n},(_,i)=>[centro[0]+r*Math.cos(i*2*Math.PI/n),centro[1]+r*Math.sin(i*2*Math.PI/n)]);
 const n=d.segmentos;if(!Number.isInteger(n)||n<8||n>128)throw RangeError('Segmentos inválidos');
 const ext=circulo(d.radio_m,n),an=circulo(a.radio_exterior_m,n),inr=circulo(a.radio_interior_m,n),med=circulo(m.radio_m,m.segmentos??16);
 const exclus=exclusiones.map(p=>({p,b:caja(p)})),pos=[],col=[];
 const colores=[d.color_hex,a.color_hex,m.color_hex].map(c=>new THREE.Color(c));
 function emitir(poly,k){
  for(let i=1;i+1<poly.length;i++){
   const A=poly[0],B=poly[i],C=poly[i+1],v=cruz(A,B,C);
   if(Math.abs(v)<EPS)continue;
   if(pos.length/3+3>maxVertices)throw RangeError('Presupuesto de vértices');
   for(const p of v>0?[A,C,B]:[A,B,C]){pos.push(p[0],p[2]+offset,p[1]);col.push(colores[k].r,colores[k].g,colores[k].b);}
  }
 }
 function procesar(tri){
  if(!toca(caja(tri),caja(ext)))return;
  let ps=[cortar(tri,ext)].filter(p=>p.length>=3);
  for(const e of exclus)ps=ps.flatMap(p=>toca(caja(p),e.b)?restar(p,e.p):[p]);
  for(const p of ps){
   for(const q of restar(p,an))emitir(q,0);
   const q=cortar(p,an);
   for(const f of restar(q,inr))emitir(f,1);
   const i=cortar(q,inr);
   for(const f of restar(i,med))emitir(f,0);
   emitir(cortar(i,med),2);
  }
 }
 const punto=(i,j)=>[o[0]+i*t/(r.nx-1),o[1]+j*t/(r.nz-1),r.alturas_m[j*r.nx+i]];
 for(let j=0;j<r.nz-1;j++)for(let i=0;i<r.nx-1;i++){
  const A=punto(i,j),B=punto(i+1,j),C=punto(i,j+1),D=punto(i+1,j+1);
  procesar([A,B,C]);procesar([B,D,C]);
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));geo.computeVertexNormals();geo.computeBoundingSphere();
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const malla=new THREE.Mesh(geo,material);malla.name='Adoquin adaptado';
 return {malla,vertices:pos.length/3,cerrar(){malla.removeFromParent();geo.dispose();material.dispose();}};
}
