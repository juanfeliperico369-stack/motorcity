/* Superficies transitables del mismo mapa: terreno, agua y rasante vial. */
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function proyectar(x,z,a,b){
 const dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz;
 const t=clamp(((x-a[0])*dx+(z-a[1])*dz)/l2);
 return {d:Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz),t};
}
export function aguaRio(cfg,x,z){
 let best=null;const ps=cfg.rio.puntos;
 for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i],q=proyectar(x,z,a,b);if(!best||q.d<best.d)best={d:q.d,y:a[2]+q.t*(b[2]-a[2])};}
 return best.d<=cfg.rio.ancho_m/2?best.y:undefined;
}
export function prepararSuperficies(sectores){
 const nodos=new Map(sectores.flatMap(s=>s.nodos.map(n=>[n.id,n]))),vias=[];
 for(const s of sectores)for(const t of s.tramos){
   const a=nodos.get(t.desde),b=nodos.get(t.hasta);
   if(!a||!b)throw Error('Extremos viales ausentes');
   const ls=t.puntos.slice(1).map((q,i)=>Math.hypot(q[0]-t.puntos[i][0],q[1]-t.puntos[i][1])),total=ls.reduce((x,y)=>x+y,0);
   let acum=0;
   for(let i=0;i<ls.length;i++){const y0=a.altura_m+(b.altura_m-a.altura_m)*acum/total;acum+=ls[i];const y1=a.altura_m+(b.altura_m-a.altura_m)*acum/total;
     vias.push({a:t.puntos[i],b:t.puntos[i+1],y0,y1,medio:t.ancho_m/2,nivel:t.nivel,id:t.id});}
 }
 return vias;
}
/** Usa terreno realmente cargado. Agua no transitable salvo vía sobre ella.
 * No elige un puente alto desde debajo si la cota actual no permite subir. */
export function superficie(cfg,vias,x,z,terreno,alturaActual){
 if(!Number.isFinite(terreno))return undefined;
 const rio=aguaRio(cfg,x,z),agua=Math.max(cfg.mar.nivel_m,rio??-Infinity);
 let deck;
 for(const v of vias){const q=proyectar(x,z,v.a,v.b);if(q.d>v.medio)continue;const y=v.y0+q.t*(v.y1-v.y0)+.035;
   if(y<=agua+.12||y<terreno-.2)continue;
   if(Number.isFinite(alturaActual)&&y>alturaActual+.7)continue;
   if(!deck||y>deck.y)deck={y,nivel:v.nivel,tramo:v.id};
 }
 if(deck)return deck;
 if(terreno<=agua+.08)return undefined;
 return {y:terreno,nivel:0,tramo:null};
}
