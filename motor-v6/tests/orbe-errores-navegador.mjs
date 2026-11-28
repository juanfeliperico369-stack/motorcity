/* Ejecutar con una salida del empaquetador de Run City y el Chromium disponible:
 * MC_CHROMIUM=/usr/bin/chromium node motor-v6/tests/orbe-errores-navegador.mjs /tmp/orbe-paquete */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const raiz=resolve(process.argv[2]||'build-orbe');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.rcs':'application/octet-stream','.webmanifest':'application/manifest+json','.png':'image/png'};
let modo='normal';
const server=createServer(async(req,res)=>{try{
  const p=new URL(req.url,'http://localhost').pathname;
  if(p==='/favicon.ico'){res.writeHead(204);res.end();return;}
  if(modo==='http'&&/\/datos\/orbe\/[^/]+\.(?:json|rcs)$/.test(p)&&!/\/(?:indice|red-ciclo|ambiente|paletas)\.json$/.test(p)){res.writeHead(503);res.end();return;}
  if(modo==='worker'&&p.endsWith('/trabajador-sectores.js')){res.setHeader('Content-Type','text/javascript');res.end('throw new Error("fallo simulado del trabajador")');return;}
  const f=resolve(raiz,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(raiz+sep)){res.writeHead(403);res.end();return;}
  res.setHeader('Content-Type',mime[extname(f)]||'application/octet-stream');res.end(await readFile(f));
}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],...(process.env.MC_CHROMIUM?{executablePath:process.env.MC_CHROMIUM}:{})});
  const url='http://127.0.0.1:'+server.address().port+'/motor-v6/orbe.html';
  for(const falla of ['worker','http'].filter(f=>!process.env.TEST_CASO||process.env.TEST_CASO===f)){
    modo=falla;const page=await browser.newPage({viewport:{width:412,height:860}}),errores=[];
    page.on('pageerror',e=>errores.push(String(e)));
    await page.addInitScript(()=>window.addEventListener('error',()=>{window.errorEnPagina=true;}));
    await page.goto(url);
    await page.waitForFunction(tipo=>{const e=window.RUN_CITY_MOTOR?.estado().carga?.carga;return window.errorEnPagina || (tipo==='http'?e?.fallos?.length>0:!!e?.fatal);},falla,{timeout:30000});
    assert.deepEqual(errores,[]);
    const aviso=page.locator('#aviso');
    await aviso.waitFor({state:'visible',timeout:5000});
    await page.waitForFunction(()=>document.querySelector('#aviso').textContent.includes('No se pudo cargar'),undefined,{timeout:5000});
    const texto=await aviso.textContent();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert.equal(await aviso.textContent(),texto);assert.deepEqual(errores,[]);
    console.log('OK: falla '+falla+' informada sin excepción en página');
    await page.close();
  }
  if(!process.env.TEST_CASO || process.env.TEST_CASO==='audio') {
  modo='normal';const page=await browser.newPage({viewport:{width:412,height:860}}),errores=[];
  page.on('pageerror',e=>errores.push(String(e)));
  await page.addInitScript(()=>{
    const WorkerOriginal=window.Worker;
    window.Worker=class extends WorkerOriginal { constructor(...args){super(...args);window.workerPrueba=this;} };
    const Audio=window.AudioContext||window.webkitAudioContext, original=Audio.prototype.createGain;
    window.gananciasPrueba=[];
    Audio.prototype.createGain=function(){const nodo=original.call(this),set=nodo.gain.setTargetAtTime.bind(nodo.gain);nodo.gain.setTargetAtTime=(v,t,c)=>{window.gananciasPrueba.push(v);return set(v,t,c);};return nodo;};
  });
  await page.goto(url);await page.waitForFunction(()=>window.RUN_CITY_MOTOR?.estado().listo,undefined,{timeout:30000});
  await page.locator('#ajustes').click();await page.locator('#sonido').click();
  await page.waitForFunction(()=>window.RUN_CITY_MOTOR.estado().sonido,undefined,{timeout:5000});
  await page.keyboard.down('KeyW');await page.waitForFunction(()=>window.gananciasPrueba.some(v=>v>0),undefined,{timeout:10000});
  const resultado=await page.evaluate(()=>{
    window.gananciasPrueba.length=0;
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
    document.dispatchEvent(new Event('visibilitychange'));
    return {pausa:window.RUN_CITY_MOTOR.estado().pausa,ganancia:window.gananciasPrueba.slice()};
  });
  assert.equal(resultado.pausa,true);assert.deepEqual(resultado.ganancia,[0]);assert.deepEqual(errores,[]);
  await page.evaluate(()=>{delete document.hidden;});
  await page.keyboard.up('KeyW');
  await page.locator('#pausa').click();
  await page.keyboard.down('KeyW');
  await page.waitForFunction(()=>window.RUN_CITY_MOTOR.estado().velocidad>1,undefined,{timeout:10000});
  const antesFalla=await page.evaluate(()=>{
    const anterior=window.RUN_CITY_MOTOR.estado();
    window.workerPrueba.dispatchEvent(new ErrorEvent('error',{message:'fallo simulado después de iniciar'}));
    return {x:anterior.x,z:anterior.z};
  });
  await page.waitForFunction(()=>!window.RUN_CITY_MOTOR.estado().listo&&document.querySelector('#aviso').textContent.includes('No se pudo cargar'),undefined,{timeout:5000});
  const detenido=await page.evaluate(()=>window.RUN_CITY_MOTOR.estado());
  assert.equal(detenido.x,antesFalla.x);assert.equal(detenido.z,antesFalla.z);assert.equal(detenido.velocidad,0);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const trasCuadros=await page.evaluate(()=>window.RUN_CITY_MOTOR.estado());
  assert.equal(trasCuadros.x,detenido.x);assert.equal(trasCuadros.z,detenido.z);assert.deepEqual(errores,[]);
  await page.close();console.log('OK: ocultar programa ganancia cero sin esperar otro cuadro');
  }
}finally{try{if(browser)await browser.close();}finally{await new Promise(resolve=>server.close(resolve));}}
