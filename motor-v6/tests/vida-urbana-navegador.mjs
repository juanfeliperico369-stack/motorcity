import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const dir=resolve(process.argv[2]),inventario=await readFile(process.argv[3]),root=new URL('../../',import.meta.url);
const idx=JSON.parse(await readFile(join(dir,'indice.json'),'utf8')),ss=await Promise.all(idx.sectores.map(async c=>JSON.parse(await readFile(join(dir,c.url),'utf8'))));
const server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://localhost').pathname;
 if(p==='/'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><style>body{margin:0}output{position:fixed;left:10px;top:10px;background:white;padding:8px;font:16px system-ui}</style><canvas></canvas><output></output><script type="module" src="/motor-v6/tests/vida-urbana-banco.js"></script>');}
 if(p==='/topologia.json'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(ss.map(s=>({nodos:s.nodos,tramos:s.tramos}))));}
 if(p==='/inventario.json'){res.setHeader('Content-Type','application/json');return res.end(inventario);}
 if(/^\/datos\/(indice|[A-F][1-4])\.json$/.test(p)){res.setHeader('Content-Type','application/json');return res.end(await readFile(join(dir,p.slice(7))));}
 if(/^\/(motor-v6\/(src|tests)|js\/vendor)\/[a-zA-Z0-9_./-]+\.js$/.test(p)&&!p.includes('..')){res.setHeader('Content-Type','text/javascript');return res.end(await readFile(new URL(p.slice(1),root)));}
 res.writeHead(404);res.end();
 }catch(e){res.writeHead(500);res.end(String(e));}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],...(process.env.MC_CHROMIUM?{executablePath:process.env.MC_CHROMIUM}:{})});
 const page=await browser.newPage({viewport:{width:412,height:860},isMobile:true,hasTouch:true});const errores=[];page.on('pageerror',e=>errores.push(String(e)));
 await page.goto('http://127.0.0.1:'+server.address().port);
 const estado=()=>page.evaluate(()=>window.bancoVida.estado());
 try{await page.waitForFunction(()=>{const e=window.bancoVida?.estado();return e?.mundo.listo&&e.plaza&&e.drawCalls>10;},undefined,{timeout:30000});}
 catch(e){console.error('inicio',await page.evaluate(()=>window.bancoVida?.estado()),errores);throw e;}
 const ini=await estado();assert.equal(ini.visual.muebles,27);assert.equal(ini.visual.senales.estados.length,11);assert.equal(ini.visual.obstaculos,38);assert.equal(ini.visual.adoquin,2463);assert.equal(ini.visual.coches.visibles,1);
 await page.waitForFunction(()=>window.bancoVida.estado().trafico.actores[0].estado==='obstaculo',undefined,{timeout:35000});
 const espera=await estado();assert.equal(espera.trafico.actores[0].velocidad,0);
 const eje=espera.eje,signo=espera.jugador[eje]>=espera.trafico.actores[0][eje]?1:-1;
 const tecla=eje==='z'?(signo===1?'ArrowDown':'ArrowUp'):(signo===1?'ArrowRight':'ArrowLeft');
 await page.keyboard.down(tecla);
 try{await page.waitForFunction(({eje,valor,signo})=>signo*(window.bancoVida.estado().jugador[eje]-valor)>8,{eje,valor:espera.jugador[eje],signo},{timeout:30000});}
 catch(e){console.error('salida',await estado(),errores);throw e;}finally{await page.keyboard.up(tecla);}
 await page.waitForFunction(s=>window.bancoVida.estado().trafico.actores[0].s>s+3,espera.trafico.actores[0].s,{timeout:35000});
 await page.keyboard.press('KeyP');const pausa=await estado();
 await page.evaluate(()=>new Promise(r=>{let n=0;const f=()=>++n>8?r():requestAnimationFrame(f);requestAnimationFrame(f);}));
 const congelado=await estado();assert.equal(congelado.reloj,pausa.reloj);assert.equal(congelado.trafico.tick,pausa.trafico.tick);assert.deepEqual(congelado.visual.senales.estados,pausa.visual.senales.estados);
 await page.keyboard.press('KeyP');
 await page.waitForFunction(()=>window.bancoVida.estado().trafico.cruces===1,undefined,{timeout:70000});
 const fin=await estado();assert.deepEqual(errores,[]);assert.equal(fin.mundo.errores.length,0);
 if(process.env.MC_CAPTURAS){await mkdir(process.env.MC_CAPTURAS,{recursive:true});await page.screenshot({path:join(process.env.MC_CAPTURAS,'vida-urbana.png')});}
 assert.deepEqual(await page.evaluate(()=>window.bancoVida.cerrar()),{vida:0,mundo:0});
 console.log('OK: WebGL vida urbana, sectores reales, plaza, 27 muebles, 11 señales, tráfico y pausa',JSON.stringify({drawCalls:fin.drawCalls,triangulos:fin.triangulos,cruces:fin.trafico.cruces,lotes:fin.mundo.lotes,adoquin:fin.visual.adoquin}));
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
