/* Motor City 6: carga de sectores y dependencias directas; coordenadas SI. */
export class CargadorSectores {
  constructor({catalogo,baseUrl,tope=32,concurrencia=2,trabajador,alCargar=()=>{},alError=()=>{},alExpulsar=()=>{},reloj=()=>Date.now(),reintentoMs=1000}){
    if(!Number.isInteger(tope)||tope<1||!Number.isInteger(concurrencia)||concurrencia<1||!Number.isFinite(reintentoMs)||reintentoMs<0)throw new RangeError('Límites inválidos');
    this.catalogo=new Map();
    for(const s of catalogo){
      if(this.catalogo.has(s.id)||typeof s.id!=='string'||!s.id||typeof s.url!=='string'||!s.url||!Number.isFinite(s.x)||!Number.isFinite(s.z)||!Array.isArray(s.dependencias??[]))throw new TypeError('Catálogo inválido');
      const deps=[...new Set(s.dependencias??[])];
      if(deps.some(d=>typeof d!=='string'||d===s.id))throw new TypeError('Dependencia inválida');
      this.catalogo.set(s.id,{...s,url:baseUrl?new URL(s.url,baseUrl).href:s.url,dependencias:deps});
    }
    for(const s of this.catalogo.values())for(const d of s.dependencias)if(!this.catalogo.has(d))throw new RangeError('Dependencia desconocida: '+d);
    Object.assign(this,{tope,concurrencia,alCargar,alError,alExpulsar,reloj,reintentoMs});
    this.cache=new Map();this.pendientes=new Map();this.fallos=new Map();this.cola=[];this.deseados=new Set();this.requeridos=new Set();this.cerrado=false;
    this.trabajador=trabajador||new Worker(new URL('./mundo/trabajador-sectores.js',import.meta.url),{type:'module'});
    this.recibir=e=>this._recibir(e.data);
    this.trabajador.addEventListener('message',this.recibir);
  }
  actualizar({x,z,rumbo=0,visibles=[],radio=500}){
    if(this.cerrado)throw new Error('Cargador cerrado');
    if(![x,z,rumbo,radio].every(Number.isFinite)||radio<0)throw new RangeError('Posición o radio inválido');
    const vista=new Set(visibles),requeridos=new Set(vista);
    for(const id of vista){
      const s=this.catalogo.get(id);if(!s)throw new RangeError('Sector desconocido: '+id);
      for(const d of s.dependencias)requeridos.add(d);
    }
    if(requeridos.size>this.tope)throw new RangeError('La caché no alcanza para visibles y dependencias');
    const candidatos=[...this.catalogo.values()].map(s=>{
      const dx=s.x-x,dz=s.z-z,distancia=Math.hypot(dx,dz);
      return {s,distancia,prioridad:distancia-(dx*Math.sin(rumbo)+dz*Math.cos(rumbo))*.35};
    }).filter(c=>requeridos.has(c.s.id)||c.distancia<=radio)
      .sort((a,b)=>Number(requeridos.has(b.s.id))-Number(requeridos.has(a.s.id))||Number(vista.has(b.s.id))-Number(vista.has(a.s.id))||a.prioridad-b.prioridad||a.s.id.localeCompare(b.s.id)).slice(0,this.tope);
    this.requeridos=requeridos;this.deseados=new Set(candidatos.map(c=>c.s.id));
    for(const id of this.fallos.keys())if(!this.deseados.has(id))this.fallos.delete(id);
    for(const {s} of candidatos)if(this.cache.has(s.id))this.obtener(s.id);
    const ahora=this.reloj();
    this.cola=candidatos.map(c=>c.s).filter(s=>!this.cache.has(s.id)&&!this.pendientes.has(s.id)&&(!this.fallos.has(s.id)||ahora>=this.fallos.get(s.id)));
    this._despachar();
  }
  _despachar(){
    while(!this.cerrado&&this.pendientes.size<this.concurrencia&&this.cola.length){
      const s=this.cola.shift();this.pendientes.set(s.id,s);
      try{this.trabajador.postMessage({id:s.id,url:s.url});}
      catch(e){this.pendientes.delete(s.id);this.fallos.set(s.id,this.reloj()+this.reintentoMs);this.alError(s.id,String(e.message||e));}
    }
  }
  _recibir({id,sector,error}){
    if(!this.pendientes.has(id)||this.cerrado)return;
    this.pendientes.delete(id);
    try{
      if(error||!sector||sector.id!==id){
        if(this.deseados.has(id)){this.fallos.set(id,this.reloj()+this.reintentoMs);this.alError(id,error||'ID de sector no coincide');}
      }else if(this.deseados.has(id)){
        this.fallos.delete(id);
        if(!this.cache.has(id)&&this.cache.size>=this.tope){
          const expulsar=[...this.cache.keys()].find(k=>!this.deseados.has(k));
          if(expulsar===undefined)throw new Error('Invariante de caché violada');
          const anterior=this.cache.get(expulsar);this.cache.delete(expulsar);this.alExpulsar(expulsar,anterior);
        }
        this.cache.set(id,sector);this.alCargar(id,sector);
      }
    }finally{this._despachar();}
  }
  obtener(id){if(!this.cache.has(id))return undefined;const v=this.cache.get(id);this.cache.delete(id);this.cache.set(id,v);return v;}
  estado(){
    const faltantes=[...this.requeridos].filter(id=>!this.cache.has(id));
    return {requeridos:this.requeridos.size,faltantes,pendientes:this.pendientes.size,cola:this.cola.length,cache:this.cache.size,fallos:[...this.fallos.keys()]};
  }
  cerrar(){
    if(this.cerrado)return;
    this.cerrado=true;this.cola=[];this.pendientes.clear();this.fallos.clear();this.deseados.clear();this.requeridos.clear();
    this.trabajador.removeEventListener('message',this.recibir);this.trabajador.terminate();
    const anteriores=[...this.cache];this.cache.clear();for(const [id,sector] of anteriores)this.alExpulsar(id,sector);
  }
}
