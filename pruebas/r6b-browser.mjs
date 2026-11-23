#!/usr/bin/env node
/* R6-b · humo en Chromium: mismo archivo offline, worker Blob y respaldo normal. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const archivo=path.join(root,'dist/juegos/getaway.html');
assert(fs.existsSync(archivo),'Falta construir dist/juegos/getaway.html');
const html=fs.readFileSync(archivo,'utf8');
assert(html.includes('mc-r6b-guatape'),'R6-b Guatapé no está empaquetado');
assert(html.includes('mc-r6b-medellin'),'R6-b Medellín no está empaquetado');
const navegador=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await navegador.newPage({viewport:{width:412,height:860},hasTouch:true});
const errores=[],red=[];
page.on('pageerror',e=>errores.push(e.message));
page.on('request',r=>{if(!r.isNavigationRequest()&&!/^(file|data|blob):/.test(r.url()))red.push(r.url());});
try{
  const url=process.env.MC_PRUEBAS_URL?
    new URL('dist/juegos/getaway.html',process.env.MC_PRUEBAS_URL).href:pathToFileURL(archivo).href;
  await page.goto(url+'?portada',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.TURNO_LISTO&&window.TURNO?.planeta,{timeout:40000});
  await page.click('#bLibre');
  await page.click('#ciudades [data-c="guatape"]');
  await page.waitForFunction(()=>TURNO?.id==='guatape'&&!TURNO.transicion&&TURNO.cuerpo&&TURNO.vistas,{timeout:90000});
  await page.evaluate(()=>{
    const G=TURNO;MC.opciones.graficos='realistas';G.vistas.motor3d='gl';
    G.vistas.auto=false;G.vistas.calidad=1;G.vistas.reiniciarGL();
    G.vistaId='dron';G.vistas.usar('dron',G.E);
  });
  await page.waitForFunction(()=>{
    const g=TURNO?.vistas?.gl;
    return !!g?.tres&&!!g.ok&&MC.R6B.estadisticas(g).sectores>=1;
  },{timeout:90000});
  const etapa=await page.evaluate(()=>{
    const G=TURNO,g=G.vistas.gl,s=MC.R6B.estadisticas(g);
    return {ciudad:G.id,tres:g.tres,ready:s.regiones,sectores:s.sectores,worker:s.worker,
      bytes:s.bytes,subidos:s.subidos,fallos:s.fallos};
  });
  assert(etapa.worker&&etapa.sectores>=1&&etapa.ready>=1,'R6-b no transfirió sectores desde Worker Blob');
  assert(etapa.sectores<=6,'La caché R6-b excedió 6 sectores');
  await page.evaluate(()=>{
    MC.R6B.activo=false;TURNO.vistas.reiniciarGL();
    TURNO.vistaId='tercera';TURNO.vistas.usar('tercera',TURNO.E);
  });
  await page.waitForFunction(()=>TURNO?.vistas?.gl?.tres&&TURNO.vistas.gl.mvp,{timeout:30000});
  const respaldo=await page.evaluate(()=>{
    const G=TURNO,g=G.vistas.gl;
    return {mvp:!!g.mvp,tres:!!g.tres,trabajador:!!g._r6b};
  });
  assert(respaldo.mvp&&respaldo.tres&&!respaldo.trabajador,'Fallback procedural no funciona');
  assert.equal(red.length,0,'El HTML offline hizo solicitudes externas: '+red.join(','));
  assert.equal(errores.length,0,'Errores en Chromium: '+errores.join(','));
  console.log('✓ R6-b Worker Blob, sectores, LRU y respaldo 3D sin internet: '+JSON.stringify({etapa,respaldo}));
}finally{await navegador.close();}
