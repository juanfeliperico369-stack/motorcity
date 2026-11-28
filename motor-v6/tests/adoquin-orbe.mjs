import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {crearAdoquin,exclusionesViales} from '../src/render/adoquin.js';
import {alturaSector} from '../src/mundo/sectores-3d.js';
const dir=process.argv[2],idx=JSON.parse(fs.readFileSync(path.join(dir,'indice.json')));
const ss=idx.sectores.map(c=>JSON.parse(fs.readFileSync(path.join(dir,c.url))));
const s=ss.find(s=>s.id==='C2'),d=JSON.parse(fs.readFileSync(process.argv[3])).adoquin;
const ex=exclusionesViales(ss.flatMap(s=>s.tramos),{centro:d.centro,radio:d.disco_exterior.radio_m});
const a=crearAdoquin(s,d,{exclusiones:ex}),p=a.malla.geometry.attributes.position;
assert.ok(a.vertices>100&&a.vertices<=60000);
const distancia=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],u=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-u*dx,z-a[1]-u*dz);};
let min=Infinity,err=0;
const ts=ss.flatMap(s=>s.tramos).flatMap(t=>t.puntos.slice(1).map((b,i)=>({a:t.puntos[i],b,r:t.ancho_m/2})));
for(let i=0;i<p.count;i+=3){
 for(const [x,z,y] of [[p.getX(i),p.getZ(i),p.getY(i)],[(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3,(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3]]){
  const e=Math.abs(y-alturaSector(s,x,z)-.012);err=Math.max(err,e);assert.ok(e<.001,'relieve');
  const d=Math.min(...ts.map(t=>distancia(x,z,t.a,t.b)-t.r));min=Math.min(min,d);assert.ok(d>.149,'vía invadida');
 }
}
assert.equal(p.count,a.malla.geometry.attributes.color.count);a.cerrar();
console.log('OK: adoquín C2, '+p.count+' vértices, '+ex.length+' exclusiones, error máximo '+err.toFixed(6)+' m, margen mínimo '+min.toFixed(3)+' m, un lote');
