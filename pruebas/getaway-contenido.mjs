#!/usr/bin/env node
/* Auditoría automática G-H21/22/23, Node 22, sin dependencias. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const f=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const q=JSON.parse(f('contenido/paradas-carretera.json'));
const biomas=['costa','llanura','desierto','bosque','montana','nieve','lagos'];
for(const b of biomas){assert.equal(q.biomas[b]?.length,4,'4 paradas '+b);for(const x of q.biomas[b]) assert(x.nombre&&x.nombre_en&&x.ambiente&&x.tipo);}
assert.equal(new Set(biomas.flatMap(b=>q.biomas[b].map(x=>x.nombre))).size,28);
const fuente=f('js/13-planeta.js'),match=fuente.match(/^const PARADAS_RUTA = (\{.*\});$/m);
assert(match,'dataset embebido en generador de carretera');
assert.equal(JSON.stringify(JSON.parse(match[1])),JSON.stringify(q.biomas));
assert(fuente.includes('biomaP = biomas[bioma(y)]'),'la selección debe obedecer al bioma');
const historia=f('juegos/getaway/10-contenido.js');
assert(!/La valentina finca hotel/i.test(historia),'un negocio real no puede ser guarida ficticia');
assert(/gu_finca: .*ficcion: true/.test(historia),'la finca debe identificarse como ficticia');
assert(!/a través de los muros por 8 s/i.test(historia),'el visor no atraviesa paredes');
const n=[...historia.matchAll(/^\s*(\w+): \{ mundo: '[^']+', n: /gm)];
assert.equal(n.length,19,'19 referencias narrativas');
const dib=f('juegos/getaway/40-dibujo.js');
const mat=dib.match(/const LENGUAJE_SUAVE = \[[\s\S]*?\];\s*const suave = [^\n]+;/);
assert(mat,'filtro de lenguaje');
const fn=vm.runInNewContext(mat[0]+'\n suave',{leerG:()=>({suave:true})});
for(const s of ['¡Quítense, hijueputas!','Hoy no, malparidos.','¡Párese, gonorrea!','Tombos, mierda y cabrón']){
 const k=fn(s);assert(!/(hijueput|malparid|gonorrea|tombos|mierda|cabr[oó]n)/i.test(k),'se escapó: '+k);
}
const fuerte=vm.runInNewContext(mat[0]+'\n suave',{leerG:()=>({suave:false})});
assert.equal(fuerte('¡Párese, gonorrea!'),'¡Párese, gonorrea!');
console.log('G-H21/22/23: 19 lugares inventariados, 28 paradas, lenguaje suave y fuerte OK');


/* C-M36: el audio espacial es una función pura y sus límites se prueban sin navegador. */
const auCtx={MC:{},clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};
vm.runInNewContext(f('js/61-sonido.js'),auCtx);
const audio=auCtx.MC.PersecucionAudio;
assert(audio && typeof audio.plan==='function');
const cerca=audio.plan({distancia:10,velocidadRadial:-25}),lejos=audio.plan({distancia:130,velocidadRadial:25,ocluido:true});
assert(cerca.volumen>lejos.volumen && cerca.doppler>1 && lejos.doppler<1);
assert(audio.plan({distancia:20,ocluido:true}).corte < audio.plan({distancia:20}).corte);
assert(audio.motor({velocidad:22,aceleracion:1,activo:true}).volumen>0);
assert.equal(audio.motor({velocidad:22,aceleracion:1,activo:false}).volumen,0);
const muro={edificioEn:(x,y)=>x>=4&&x<=6&&Math.abs(y)<1};
assert.equal(audio.ocluido(muro,{x:0,y:0},{x:10,y:0}),true);
assert.equal(audio.ocluido(muro,{x:0,y:3},{x:10,y:3}),false);
console.log('C-M36: atenuación, Doppler, filtro y oclusión OK');
