import assert from 'node:assert/strict';
import {crearAdoquin,exclusionesViales} from '../src/render/adoquin.js';
import {alturaSector} from '../src/mundo/sectores-3d.js';
const sector={origen:[0,0],tamano_m:100,relieve:{nx:3,nz:3,alturas_m:[0,4,1,2,9,3,1,3,8],fuente:'ensayo'}};
const d={centro:[50,50],disco_exterior:{radio_m:34,segmentos:32,color_hex:'#D9D2B0'},anillo_medio:{radio_interior_m:17.5,radio_exterior_m:22.5,color_hex:'#CFC6A4'},medallon_km_cero:{radio_m:5.2,segmentos:16,color_hex:'#0E6378'}};
const ex=exclusionesViales([{ancho_m:10,puntos:[[0,50],[100,50]]}],{centro:d.centro,radio:34});
const a=crearAdoquin(sector,d,{exclusiones:ex});
assert.ok(a.vertices>100&&a.vertices<60000);
const p=a.malla.geometry.attributes.position;
for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);assert.ok(Math.abs(y-alturaSector(sector,x,z)-.012)<.0001);assert.ok(Math.abs(z-50)>=5.1499);assert.ok(Math.hypot(x-50,z-50)<=34.00001);}
assert.equal(a.malla.geometry.attributes.color.count,p.count);
a.cerrar();assert.throws(()=>crearAdoquin(sector,d,{maxVertices:3}),/Presupuesto/);
console.log('OK: adoquín sobre triángulos DEM, sin invasión vial, un lote, '+p.count+' vértices');
