/* Planificador determinista para una red pequeña. Estado: último carril,
 * para respetar sentidos y excluir giros en U salvo autorización explícita.
 * La ruta no reserva cruces ni mueve actores. */
export class RutasViales{
 constructor(red,{largo_m=4,ancho_m=1.8,margen=2}={}){
  if(!red?.carriles||![largo_m,ancho_m,margen].every(Number.isFinite)||largo_m<=0||ancho_m<=0||margen<0)throw RangeError('Perfil inválido');
  this.carriles=new Map();this.salidas=new Map();
  for(const c of red.carriles.values()){
   if(c.ancho_m<ancho_m||c.largo<2*c.transicion_m+largo_m+margen)continue;
   this.carriles.set(c.id,c);
   if(!this.salidas.has(c.desde))this.salidas.set(c.desde,[]);
   this.salidas.get(c.desde).push(c);
  }
  for(const cs of this.salidas.values())cs.sort((a,b)=>a.id.localeCompare(b.id));
 }
 buscar(inicio,destino,{permitirU=false,coste=c=>c.largo,permitir=()=>true}={}){
  const origen=this.carriles.get(inicio),fin=this.carriles.get(destino);
  if(!origen||!fin||!permitir(origen)||!permitir(fin))return null;
  if(inicio===destino)return {ruta:[inicio],coste:0};
  const dist=new Map([[inicio,0]]),prev=new Map(),pendientes=new Set([inicio]),visitados=new Set();
  while(pendientes.size){
   const id=[...pendientes].sort((a,b)=>dist.get(a)-dist.get(b)||a.localeCompare(b))[0];
   pendientes.delete(id);if(visitados.has(id))continue;visitados.add(id);
   if(id===destino){const ruta=[id];while(prev.has(ruta[0]))ruta.unshift(prev.get(ruta[0]));return {ruta,coste:dist.get(id)};}
   const c=this.carriles.get(id);
   for(const d of this.salidas.get(c.hasta)||[]){
    if(visitados.has(d.id)||!permitir(d)||(!permitirU&&c.tramo===d.tramo))continue;
    const k=coste(d,c);if(!Number.isFinite(k)||k<0)throw RangeError('Coste inválido');
    const n=dist.get(id)+k;
    if(n<(dist.get(d.id)??Infinity)){dist.set(d.id,n);prev.set(d.id,id);pendientes.add(d.id);}
   }
  }
  return null;
 }
}
