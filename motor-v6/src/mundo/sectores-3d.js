/* Motor City 6: escena incremental de sectores v1, sin datos inventados.
 * Three.js es la misma copia fija 0.170 que utiliza el motor. Este módulo vive
 * en src/mundo/ e importa Three desde render/three.js (la única puerta), que el exportador reubica.
 */
import * as THREE from '../render/three.js';
import { CargadorSectores } from './sectores.js';
import { aplicarFachadas } from '../render/fachadas.js';

const fin = Number.isFinite;
const punto = p => Array.isArray(p) && p.length === 2 && p.every(fin);
const limite = (v,a,b) => Math.max(a,Math.min(b,v));
function caja(ps,m=0) {
  const b=[Infinity,Infinity,-Infinity,-Infinity];
  for(const [x,z] of ps){b[0]=Math.min(b[0],x-m);b[1]=Math.min(b[1],z-m);b[2]=Math.max(b[2],x+m);b[3]=Math.max(b[3],z+m);}
  return b;
}
const toca=(a,b)=>a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1];
const celda=(s,t)=>[s.x-t/2,s.z-t/2,s.x+t/2,s.z+t/2];

function relieveValido(s){
  const r=s.relieve;
  return !!r&&Number.isInteger(r.nx)&&Number.isInteger(r.nz)&&r.nx>=2&&r.nz>=2&&r.nx<=129&&r.nz<=129&&Array.isArray(r.alturas_m)&&r.alturas_m.length===r.nx*r.nz&&r.alturas_m.every(fin)&&typeof r.fuente==='string'&&!!r.fuente.trim();
}
/** Altura de la MISMA triangulación que la malla, no interpolación bilineal. */
export function alturaSector(s,x,z){
  if(!relieveValido(s)||!fin(x)||!fin(z)||!punto(s.origen)||!fin(s.tamano_m)||s.tamano_m<=0)return undefined;
  return alturaValidada(s,x,z);
}
function alturaValidada(s,x,z){
  if(!fin(x)||!fin(z))return undefined;
  const r=s.relieve,u=(x-s.origen[0])/s.tamano_m*(r.nx-1),v=(z-s.origen[1])/s.tamano_m*(r.nz-1);
  if(u<0||v<0||u>r.nx-1||v>r.nz-1)return undefined;
  const i=Math.min(r.nx-2,Math.floor(u)),j=Math.min(r.nz-2,Math.floor(v)),fx=u-i,fz=v-j,k=j*r.nx+i,h=r.alturas_m;
  const a=h[k],b=h[k+1],c=h[k+r.nx],d=h[k+r.nx+1];
  return fx+fz<=1?a+fx*(b-a)+fz*(c-a):d+(1-fx)*(c-d)+(1-fz)*(b-d);
}
function triangulo(dst,a,b,c,origen,max){
  if(dst.length/3+3>max)throw new RangeError('Límite de vértices de lote');
  for(const p of [a,b,c])dst.push(p[0]-origen[0],p[1]-origen[1],p[2]-origen[2]);
}
function geometria(dst){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(dst,3));
  g.computeVertexNormals();g.computeBoundingSphere();return g;
}
function mallaRelieve(s,origen,max){
  const r=s.relieve;
  if(r.nx*r.nz>max)throw new RangeError('Límite de vértices de relieve');
  const posiciones=[],indices=[];
  for(let j=0;j<r.nz;j++)for(let i=0;i<r.nx;i++)posiciones.push(s.origen[0]+i*s.tamano_m/(r.nx-1)-origen[0],r.alturas_m[j*r.nx+i]-origen[1],s.origen[1]+j*s.tamano_m/(r.nz-1)-origen[2]);
  for(let j=0;j<r.nz-1;j++)for(let i=0;i<r.nx-1;i++){const a=j*r.nx+i,b=a+1,c=a+r.nx,d=c+1;indices.push(a,c,b,b,c,d);}
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(posiciones,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
function cinta(t,a,b,dst,origen,max){
  const ps=t.puntos,dirs=[],dist=[0];
  if(!punto(a.posicion)||!punto(b.posicion)||!fin(a.altura_m)||!fin(b.altura_m)||!Array.isArray(ps)||ps.length<2||!ps.every(punto)||!fin(t.ancho_m)||t.ancho_m<=0)throw new Error('Tramo inválido');
  if(ps[0][0]!==a.posicion[0]||ps[0][1]!==a.posicion[1]||ps.at(-1)[0]!==b.posicion[0]||ps.at(-1)[1]!==b.posicion[1])throw new Error('Extremos de vía no coinciden');
  for(let i=1;i<ps.length;i++){
    const dx=ps[i][0]-ps[i-1][0],dz=ps[i][1]-ps[i-1][1],l=Math.hypot(dx,dz);
    if(!fin(l)||l<=0)throw new Error('Segmento degenerado');
    dirs.push([-dz/l,dx/l]);dist.push(dist.at(-1)+l);
  }
  const total=dist.at(-1),izq=[],der=[],medio=t.ancho_m/2;
  // Junta acotada al semiancho: no expande la huella de dependencias del índice.
  for(let i=0;i<ps.length;i++){
    const u=dirs[Math.max(0,i-1)],v=dirs[Math.min(dirs.length-1,i)],nx=u[0]+v[0],nz=u[1]+v[1],l=Math.hypot(nx,nz);
    if(l<1e-8)throw new Error('Retorno de 180 grados sin nodo intermedio');
    const ox=nx/l*medio,oz=nz/l*medio;
    const y=a.altura_m+(b.altura_m-a.altura_m)*dist[i]/total+(t.red==='ciclovia'?.035:.02);
    izq.push([ps[i][0]+ox,y,ps[i][1]+oz]);der.push([ps[i][0]-ox,y,ps[i][1]-oz]);
  }
  for(let i=1;i<ps.length;i++){
    triangulo(dst,izq[i-1],izq[i],der[i-1],origen,max);
    triangulo(dst,izq[i],der[i],der[i-1],origen,max);
  }
}
function edificio(o,base,dst,origen,max){
  const ps=o.huella,h=o.altura_m;
  if(!Array.isArray(ps)||ps.length<3||ps.length>512||!ps.every(punto)||!fin(base)||!fin(h)||h<=0)throw new Error('Huella/altura inválida');
  const area=ps.reduce((s,p,i)=>{const q=ps[(i+1)%ps.length];return s+(p[0]-ps[0][0])*(q[1]-ps[0][1])-(q[0]-ps[0][0])*(p[1]-ps[0][1]);},0);
  if(Math.abs(area)<1e-8)throw new Error('Huella sin área');
  const caras=THREE.ShapeUtils.triangulateShape(ps.map(p=>new THREE.Vector2(p[0]-ps[0][0],p[1]-ps[0][1])),[]);
  if(caras.length!==ps.length-2)throw new Error('Triangulación incompleta');
  const techo=p=>[p[0],base+h,p[1]],pie=p=>[p[0],base,p[1]];
  for(const [i,j,k] of caras){
    const a=ps[i],b=ps[j],c=ps[k],signo=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    triangulo(dst,techo(a),techo(signo>0?c:b),techo(signo>0?b:c),origen,max);
  }
  for(let i=0;i<ps.length;i++){
    let a=ps[i],b=ps[(i+1)%ps.length];if(area<0)[a,b]=[b,a];
    triangulo(dst,pie(a),techo(a),pie(b),origen,max);
    triangulo(dst,pie(b),techo(a),techo(b),origen,max);
  }
}
/* el color de un edificio: el de los datos, o uno de la paleta de su barrio (lo genérico varía por tono) */
const PALETA_BASE=['#3f8a4f','#5b4636','#0e6378','#e8e4c4','#ffd36b'];
function colorEdificio(o,pz){
  if(o.color)return new THREE.Color(o.color);
  const e=pz?.escenario||PALETA_BASE;
  if(!o.generico)return new THREE.Color(e[3]);
  const t=fin(o.tono)?o.tono:.5,c=new THREE.Color(t<.42?e[3]:t<.62?e[4]:t<.82?e[1]:e[2]).offsetHSL(0,0,((t*7)%1-.5)*.16);
  /* el tono es del barrio, pero la fachada siempre se lee: ni tan oscura que se pierdan las ventanas ni tan saturada que encandile */
  const h={};c.getHSL(h);return c.setHSL(h.h,Math.min(h.s,.62),Math.max(.3,Math.min(.85,h.l)));
}
function edificioColor(o,dst,origen,max,color){
  const n0=dst.p.length/3;edificio(o,o.base_m,dst.p,origen,max);
  for(let i=n0;i<dst.p.length/3;i++){dst.c.push(color.r,color.g,color.b);dst.f.push(o.base_m-origen[1],o.base_m+o.altura_m-origen[1]);}
}
/* los árboles: dos formas facetadas (copa redonda y pino), con el tronco, en instancias */
let ARBOLES=null;
function formasArbol(){
  if(ARBOLES)return ARBOLES;
  const unir=(partes)=>{const pos=[],col=[];for(const [g,c] of partes){const n=g.index?g.toNonIndexed():g,a=n.attributes.position.array;for(let i=0;i<a.length;i+=3){pos.push(a[i],a[i+1],a[i+2]);col.push(c.r,c.g,c.b);}n.dispose();g.dispose();}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();g.computeBoundingSphere();return g;};
  const tronco=()=>new THREE.CylinderGeometry(.13,.2,1.8,5).translate(0,.9,0),cafe=new THREE.Color('#6b4a32'),verde=new THREE.Color('#ffffff');
  ARBOLES=[unir([[tronco(),cafe],[new THREE.IcosahedronGeometry(1.7,0).translate(0,3.1,0),verde]]),unir([[tronco(),cafe],[new THREE.ConeGeometry(1.5,4.2,7).translate(0,3.5,0),verde]])];
  return ARBOLES;
}
function soltar(g){
  g.removeFromParent();
  // Los árboles en instancias comparten su forma entre sectores: se sueltan sus instancias, no la forma.
  g.traverse(o=>{if(o.isInstancedMesh){o.dispose();return;}if(o.geometry)o.geometry.dispose();});
}

/** Escena por lotes: carga de datos separada de construcción GPU.
 * Índice completo v1; los sectores residentes son inmutables durante su vida.
 * Llamar actualizar con posición global y procesar una vez por frame.
 */
export class MundoSectores {
  constructor({indice,origenRender=[0,0,0],maxVerticesLote=120000,paletas=new Map(),opcionesCarga={},alCrearMalla=null,generico=null}){
    if(!indice||indice.version!==1||!fin(indice.tamano_m)||indice.tamano_m<250||indice.tamano_m>500||!Array.isArray(indice.sectores)||!indice.sectores.length||!Array.isArray(origenRender)||origenRender.length!==3||!origenRender.every(fin)||!Number.isInteger(maxVerticesLote)||maxVerticesLote<3)throw new RangeError('Índice u opciones de escena inválidos');
    this.indice=indice;this.origen=[...origenRender];this.maxVerticesLote=maxVerticesLote;this.alCrearMalla=alCrearMalla;
    // Lo genérico (mundo/generico.js): una función ({sector,vecinos,celda}) => {objetos,arboles}, una vez por versión de cada sector.
    this.generico=generico;this.genericos=new Map();
    this.catalogo=new Map(indice.sectores.map(s=>[s.id,s]));
    this.raiz=new THREE.Group();this.raiz.name='MundoSectoresV1';
    this.materiales={suelo:new THREE.MeshStandardMaterial({color:0x879a72,roughness:1}),vial:new THREE.MeshStandardMaterial({color:0x56585e,roughness:1}),ciclovia:new THREE.MeshStandardMaterial({color:0x398451,roughness:.9}),edificio:aplicarFachadas(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.85})),arbol:new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.95,flatShading:true})};
    this.paletas=paletas;this.materialesZona=new Map();this.lotes=new Map();this.versiones=new Map();this.secuencia=0;this.visibles=[];this.cola=[];this.errores=[];this.omisiones=[];this.faltantes=[];this.sucio=true;this.cerrado=false;
    const {alCargar,alExpulsar,...opts}=opcionesCarga;
    this.revision=0; // sube con cada sector que entra o sale: el juego compara un número en vez de armar una firma cada cuadro
    this.cargador=new CargadorSectores({...opts,catalogo:indice.sectores,alCargar:(id,s)=>{this.versiones.set(id,++this.secuencia);this.revision++;this.sucio=true;alCargar?.(id,s);},alExpulsar:(id,s)=>{this.versiones.delete(id);this.revision++;this.sucio=true;alExpulsar?.(id,s);}});
  }
  actualizar({x,z,rumbo=0,radio=500,radioVisible=160,visibles}){
    if(this.cerrado||![x,z,rumbo,radio,radioVisible].every(fin)||radioVisible<0)throw new RangeError('Escena cerrada o posición inválida');
    const t=this.indice.tamano_m;
    // Lo visible, del más cercano al más lejano, mientras quepa con sus dependencias en la caché del cargador: con la cámara
    // de lejos el radio crece, y los sectores más lejanos esperan en vez de romper la carga (this.recortados los cuenta).
    let ids;
    if(visibles)ids=[...new Set(visibles)].sort();
    else{
      const dist=s=>{const b=celda(s,t);return Math.hypot(Math.max(b[0]-x,0,x-b[2]),Math.max(b[1]-z,0,z-b[3]));};
      const cand=this.indice.sectores.map(s=>[s,dist(s)]).filter(([,d])=>d<=radioVisible).sort((a,b)=>a[1]-b[1]||a[0].id.localeCompare(b[0].id));
      const elegidos=new Set(),tope=this.cargador.tope;ids=[];
      for(const [s] of cand){const nuevos=[s.id,...(s.dependencias||[])].filter(d=>!elegidos.has(d));if(elegidos.size+nuevos.length>tope)continue;for(const d of nuevos)elegidos.add(d);ids.push(s.id);}
      this.recortados=cand.length-ids.length;ids.sort();
    }
    this.cargador.actualizar({x,z,rumbo,radio,visibles:ids});
    if(ids.join('\0')!==this.visibles.join('\0')){this.visibles=ids;this.sucio=true;}
  }
  _planificar(){
    const datos=this.cargador.cache,t=this.indice.tamano_m,validas=[],propietarios=new Set();
    this.errores=[];this.omisiones=[];this.faltantes=[];
    for(const id of this.visibles){
      const c=this.catalogo.get(id),req=[id,...(c.dependencias||[])];
      if(req.some(d=>!datos.has(d))){this.faltantes.push(id);continue;}
      validas.push(c);for(const d of req)propietarios.add(d);
    }
    // Lo genérico de cada celda visible, con sus vecinos cargados; se rehace solo si cambia la versión de alguno.
    for(const id of [...this.genericos.keys()])if(!datos.has(id)){this.genericos.delete(id);this.revision++;}
    if(this.generico)for(const c of validas){
      const deps=c.dependencias||[],firma=[c.id,...deps].map(d=>this.versiones.get(d)).join(':'),previo=this.genericos.get(c.id);
      if(previo&&previo.firma===firma)continue;
      let r;try{r=this.generico({sector:datos.get(c.id),vecinos:deps.map(d=>datos.get(d)),celda:celda(c,t)})||{};}catch(e){r={};this.errores.push({id:'generico:'+c.id,error:String(e.message||e)});}
      this.genericos.set(c.id,{firma,objetos:Array.isArray(r.objetos)?r.objetos:[],arboles:Array.isArray(r.arboles)?r.arboles:[]});this.revision++;
    }
    const nodos=new Map(),planes=new Map(),idsTramo=new Set(),idsObjeto=new Set(),cajas=validas.map(s=>celda(s,t));
    for(const id of propietarios){
      const s=datos.get(id),c=this.catalogo.get(id);
      if(!s||s.id!==id||s.tamano_m!==t||!punto(s.origen)||s.origen[0]+t/2!==c.x||s.origen[1]+t/2!==c.z)throw new Error('Sector no coincide con índice: '+id);
      for(const n of s.nodos){if(nodos.has(n.id))throw new Error('Nodo global duplicado: '+n.id);nodos.set(n.id,{n,id});}
    }
    // Terrain only for visible cells; roads and objects owned by dependencies
    // are emitted once, when their conservative box intersects a ready cell.
    for(const c of validas){
      const s=datos.get(c.id);
      if(!relieveValido(s)){this.omisiones.push({id:c.id,tipo:'relieve_sin_datos'});continue;}
      planes.set('suelo:'+s.id,{tipo:'suelo',s,zona:s.zona,firma:String(this.versiones.get(s.id))});
    }
    for(const id of propietarios){
      const s=datos.get(id),partes={vial:[],ciclovia:[],edificio:[]},firmas={vial:[],ciclovia:[],edificio:[]};
      for(const tramo of s.tramos){
        if(idsTramo.has(tramo.id))throw new Error('Tramo global duplicado: '+tramo.id);idsTramo.add(tramo.id);
        const limites=caja(tramo.puntos,tramo.ancho_m/2);
        if(!cajas.some(b=>toca(b,limites)))continue;
        const a=nodos.get(tramo.desde),b=nodos.get(tramo.hasta);
        if(!a||!b){this.omisiones.push({id:tramo.id,tipo:'extremos_sin_datos'});continue;}
        if(!['vial','ciclovia'].includes(tramo.red))throw new Error('Red desconocida');
        partes[tramo.red].push({tramo,a:a.n,b:b.n});firmas[tramo.red].push([tramo.id,this.versiones.get(a.id),this.versiones.get(b.id)]);
      }
      for(const o of s.objetos){
        if(idsObjeto.has(o.id))throw new Error('Objeto global duplicado: '+o.id);idsObjeto.add(o.id);
        const limites=caja(o.huella);
        if(!cajas.some(b=>toca(b,limites)))continue;
        // Altura de edificio relativa a su base explícita. No adivinar niveles.
        if(!fin(o.altura_m)||o.altura_m<=0||!fin(o.base_m)){this.omisiones.push({id:o.id,tipo:'edificio_sin_alturas'});continue;}
        partes.edificio.push(o);firmas.edificio.push(o.id);
      }
      const gen=this.genericos.get(id);
      if(gen&&validas.some(c=>c.id===id)){
        for(const o of gen.objetos){if(idsObjeto.has(o.id))throw new Error('Objeto global duplicado: '+o.id);idsObjeto.add(o.id);partes.edificio.push(o);}
        firmas.edificio.push('generico:'+gen.firma);
        if(gen.arboles.length)planes.set('arboles:'+id,{tipo:'arboles',zona:s.zona,partes:gen.arboles,firma:gen.firma});
      }
      for(const tipo of Object.keys(partes))if(partes[tipo].length)planes.set(tipo+':'+id,{tipo,zona:s.zona,partes:partes[tipo],firma:JSON.stringify([this.versiones.get(id),firmas[tipo]])});
    }
    for(const [k,l] of this.lotes)if(planes.get(k)?.firma!==l.firma){soltar(l.grupo);this.lotes.delete(k);}
    this.cola=[...planes].filter(([k])=>!this.lotes.has(k));
  }
  _crear(k,p){
    const grupo=new THREE.Group();grupo.name=k;
    let g;
    try{
      const pz=this.paletas.get(p.zona);
      if(p.tipo==='arboles'){this._crearArboles(k,p,grupo,pz);return;}
      if(p.tipo==='suelo')g=mallaRelieve(p.s,this.origen,this.maxVerticesLote);
      else if(p.tipo==='edificio'){
        const dst={p:[],c:[],f:[]};
        for(const v of p.partes)edificioColor(v,dst,this.origen,this.maxVerticesLote,colorEdificio(v,pz));
        g=geometria(dst.p);g.setAttribute('color',new THREE.Float32BufferAttribute(dst.c,3));g.setAttribute('aFachada',new THREE.Float32BufferAttribute(dst.f,2));
      }else{
        const dst=[];
        for(const v of p.partes)cinta(v.tramo,v.a,v.b,dst,this.origen,this.maxVerticesLote);
        g=geometria(dst);
      }
      let material=this.materiales[p.tipo];
      if(pz&&p.tipo==='suelo'){const key=p.zona+':'+p.tipo;if(!this.materialesZona.has(key)){const mat=material.clone();mat.color.set(pz.escenario[0]);this.materialesZona.set(key,mat);}material=this.materialesZona.get(key);}
      const m=new THREE.Mesh(g,material);m.receiveShadow=true;grupo.add(m);
      // Aviso al juego (p. ej. la transparencia de render/oclusion.js en los edificios); un fallo suyo no tumba el lote.
      try{this.alCrearMalla?.(p.tipo,m,k);}catch(e){this.errores.push({id:k,error:'alCrearMalla: '+String(e.message||e)});}
      const vertices=g.attributes.position.count,triangulos=(g.index?.count??vertices)/3;
      const bytes=Object.values(g.attributes).reduce((s,a)=>s+a.array.byteLength,0)+(g.index?.array.byteLength??0);
      this.raiz.add(grupo);this.lotes.set(k,{grupo,firma:p.firma,vertices,triangulos,bytes});
    }catch(e){g?.dispose();grupo.removeFromParent();throw e;}
  }
  _crearArboles(k,p,grupo,pz){
    const formas=formasArbol(),verdes=(pz?.escenario?[pz.escenario[0]]:['#3f8a4f']).map(c=>new THREE.Color(c)),tmp=new THREE.Object3D(),col=new THREE.Color();
    let n=0;
    for(const tipo of [0,1]){
      const lista=p.partes.filter(a=>a.tipo===tipo);if(!lista.length)continue;
      const im=new THREE.InstancedMesh(formas[tipo],this.materiales.arbol,lista.length);im.name='arboles-'+tipo;
      lista.forEach((a,i)=>{tmp.position.set(a.x-this.origen[0],a.y-this.origen[1],a.z-this.origen[2]);tmp.rotation.set(0,(a.x*12.9898+a.z*78.233)%6.283,0);tmp.scale.setScalar(a.escala);tmp.updateMatrix();im.setMatrixAt(i,tmp.matrix);
        col.copy(verdes[0]).offsetHSL(((a.x*.37+a.z*.11)%1-.5)*.04,.05,((a.x*.53+a.z*.29)%1-.5)*.12-.14-(tipo?.06:0));im.setColorAt(i,col);   /* más oscuro que el suelo, para que se separe */});
      im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.computeBoundingSphere();
      grupo.add(im);n+=lista.length;
    }
    this.raiz.add(grupo);this.lotes.set(k,{grupo,firma:p.firma,vertices:0,triangulos:0,bytes:n*64,instancias:n,compartida:true});
  }
  /** Todos los edificios de los sectores cargados, de los datos y genéricos: un solo registro para la cámara y los choques. */
  *objetos(){
    for(const s of this.cargador.cache.values())for(const o of s.objetos)yield o;
    for(const g of this.genericos.values())for(const o of g.objetos)yield o;
  }
  /** Los árboles genéricos (para que el juego los haga chocar). */
  *arboles(){for(const g of this.genericos.values())for(const a of g.arboles)yield a;}
  procesar({maxLotes=1}={}){
    if(this.cerrado||!Number.isInteger(maxLotes)||maxLotes<1)throw new RangeError('Presupuesto de lotes inválido');
    if(this.sucio){
      this.sucio=false;
      try{this._planificar();}catch(e){for(const l of this.lotes.values())soltar(l.grupo);this.lotes.clear();this.cola=[];this.errores.push({id:'plan',error:String(e.message||e)});}
    }
    let hechos=0;
    while(hechos<maxLotes&&this.cola.length){const [k,p]=this.cola.shift();try{this._crear(k,p);}catch(e){this.errores.push({id:k,error:String(e.message||e)});}hechos++;}
    return this.estado();
  }
  altura(x,z){
    // Preferir el suelo visible de celda semiabierta; el borde externo es válido.
    const t=this.indice.tamano_m,candidatos=this.visibles.map(id=>this.catalogo.get(id)).filter(c=>this.lotes.has('suelo:'+c.id));
    const dentro=c=>x>=c.x-t/2&&x<c.x+t/2&&z>=c.z-t/2&&z<c.z+t/2;
    for(const c of [...candidatos.filter(dentro),...candidatos.filter(c=>!dentro(c))]){
      const s=this.cargador.cache.get(c.id);if(!s)continue;
      const h=alturaValidada(s,x,z);if(h!==undefined)return h;
    }
    return undefined;
  }
  estado(){
    const carga=this.cargador.estado(),l=[...this.lotes.values()];
    return {carga,visibles:[...this.visibles],faltantesDatos:[...this.faltantes],pendientesLotes:this.cola.length,lotes:l.length,vertices:l.reduce((n,v)=>n+v.vertices,0),triangulos:l.reduce((n,v)=>n+v.triangulos,0),bytesGeometria:l.reduce((n,v)=>n+v.bytes,0),omisiones:this.omisiones.map(o=>({...o})),errores:this.errores.map(e=>({...e})),listo:!this.cerrado&&!this.sucio&&!carga.fatal&&!carga.faltantes.length&&!this.faltantes.length&&!this.cola.length&&!this.errores.length&&!this.omisiones.length};
  }
  cerrar(){
    if(this.cerrado)return;
    this.cerrado=true;this.cargador.cerrar();
    for(const l of this.lotes.values())soltar(l.grupo);
    this.lotes.clear();this.cola=[];this.visibles=[];this.faltantes=[];this.omisiones=[];this.raiz.removeFromParent();
    for(const mat of [...Object.values(this.materiales),...this.materialesZona.values()])mat.dispose();this.materialesZona.clear();
  }
}
