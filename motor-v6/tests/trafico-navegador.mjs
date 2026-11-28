import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const dir=resolve(process.argv[2]),root=new URL('../../',import.meta.url);
const idx=JSON.parse(await readFile(join(dir,'indice.json'),'utf8')),ss=await Promise.all(idx.sectores.map(async c=>JSON.parse(await readFile(join(dir,c.url),'utf8'))));
const server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://localhost').pathname;
 if(p==='/'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><style>body{margin:0}output{position:fixed;left:10px;top:10px;background:white;padding:8px;font:16px system-ui}</style><canvas></canvas><output></output><script type="module" src="/motor-v6/tests/trafico-banco.js"></script>');}
 if(p==='/topologia.json'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(ss.map(s=>({nodos:s.nodos,tramos:s.tramos}))));}
 if(/^\/(motor-v6\/(src|tests)|js\/vendor)\/[a-zA-Z0-9_./-]+\.js$/.test(p)&&!p.includes('..')){res.setHeader('Content-Type','text/javascript');return res.end(await readFile(new URL(p.slice(1),root)));}
 res.writeHead(404);res.end();
 }catch(e){res.writeHead(500);res.end(String(e));}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],...(process.env.MC_CHROMIUM?{executablePath:process.env.MC_CHROMIUM}:{})});
 const page=await browser.newPage({viewport:{width:412,height:860},isMobile:true,hasTouch:true});const errores=[];page.on('pageerror',e=>errores.push(String(e)));
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.waitForFunction(()=>window.bancoTrafico?.estado().drawCalls>=5,undefined,{timeout:20000});
 const estado=()=>page.evaluate(()=>window.bancoTrafico.estado());
 const ini=await estado();assert.deepEqual(ini.instancias,[1,1,4]);assert.ok(ini.triangulos>60);
 await page.waitForFunction(()=>window.bancoTrafico.estado().trafico.actores[0].estado==='obstaculo',undefined,{timeout:20000});
 const espera=await estado();assert.equal(espera.trafico.actores[0].velocidad,0);assert.equal(espera.trafico.cruces,0);
 // El jugador bloquea la vía. Apartarlo lateralmente usando entrada real.
 const eje=espera.eje,tecla=eje==='z'?'ArrowDown':'ArrowRight';
 await page.keyboard.down(tecla);await page.waitForFunction(({eje,valor})=>window.bancoTrafico.estado().jugador[eje]>valor+8,{eje,valor:espera.jugador[eje]},{timeout:10000});await page.keyboard.up(tecla);
 await page.waitForFunction(s=>window.bancoTrafico.estado().trafico.actores[0].s>s+3,espera.trafico.actores[0].s,{timeout:10000});
 await page.keyboard.press('KeyP');const pausa=await estado();await page.evaluate(()=>new Promise(r=>{let n=0;const f=()=>++n>15?r():requestAnimationFrame(f);requestAnimationFrame(f);}));
 const congelado=await estado();assert.equal(congelado.pasos,pausa.pasos);assert.equal(congelado.trafico.actores[0].s,pausa.trafico.actores[0].s);
 await page.keyboard.press('KeyP');await page.keyboard.press('KeyG');
 await page.waitForFunction(()=>window.bancoTrafico.estado().trafico.cruces===1,undefined,{timeout:45000});
 const fin=await estado();assert.equal(fin.verde,true);assert.deepEqual(errores,[]);
 if(process.env.MC_CAPTURAS){await mkdir(process.env.MC_CAPTURAS,{recursive:true});await page.screenshot({path:join(process.env.MC_CAPTURAS,'trafico-orbe.png')});}
 await page.evaluate(()=>window.bancoTrafico.cerrar());
 console.log('OK: WebGL Orbe, coche instanciado, jugador bloquea vía, teclado libera, pausa, verde y cruce',JSON.stringify({inicio:ini.trafico.actores[0].s,espera:espera.trafico.actores[0].s,cruces:fin.trafico.cruces,drawCalls:fin.drawCalls,instancias:fin.instancias}));
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
