import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const raiz=new URL('../../',import.meta.url);
const mime={html:'text/html',js:'text/javascript',json:'application/json',webp:'image/webp'};
const server=createServer(async(req,res)=>{
  try{
    const p=new URL(req.url,'http://localhost').pathname;
    if(!/^\/(?:motor-v6\/(?:demo\.html|src\/[\w./-]+\.js|datos\/[\w.-]+\.json|arte\/texturas\/[\w.-]+\.webp)|js\/vendor\/three-0\.170\.0\.module\.min\.js)$/.test(p)||p.includes('..')){res.writeHead(404);res.end();return;}
    const bytes=await readFile(new URL(p.slice(1),raiz));
    res.setHeader('Content-Type',mime[p.split('.').at(-1)]||'application/octet-stream');res.end(bytes);
  }catch(e){res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],...(process.env.MC_CHROMIUM?{executablePath:process.env.MC_CHROMIUM}:{})});
  const page=await browser.newPage({viewport:{width:412,height:860},isMobile:true,hasTouch:true});
  const errores=[];page.on('pageerror',e=>errores.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/motor-v6/demo.html');
  await page.waitForFunction(()=>window.MOTOR_V6?.estado().pasos>2,undefined,{timeout:30000});
  const estado=()=>page.evaluate(()=>window.MOTOR_V6.estado());
  const ini=await estado();
  await page.keyboard.down('KeyW');
  await page.waitForFunction(p=>{const s=window.MOTOR_V6.estado();return Math.hypot(s.pos.x-p.x,s.pos.z-p.z)>.35;},ini.pos,{timeout:20000});
  await page.keyboard.up('KeyW');
  await page.locator('#bPausa').click();
  const pausa=await estado();assert.equal(pausa.pausa,true);
  await page.keyboard.down('KeyW');
  // Esperar dos cuadros reales dibujados durante pausa; no dormir ni modificar el estado del juego.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.keyboard.up('KeyW');
  const detenido=await estado();assert.deepEqual(detenido.pos,pausa.pos);assert.equal(detenido.pasos,pausa.pasos);assert.equal(detenido.tiempoJuego,pausa.tiempoJuego);
  await page.locator('#bPausa').click();
  await page.waitForFunction(n=>window.MOTOR_V6.estado().pasos>n,pausa.pasos,{timeout:20000});
  const reanudado=await estado();assert.equal(reanudado.pausa,false);assert.ok(reanudado.tiempoJuego>pausa.tiempoJuego);
  for(const selector of ['#bModo','#bZoom','#bPausa','#bSalto','#bTruco']){const rect=await page.locator(selector).boundingBox();assert.ok(rect.width>=44&&rect.height>=44,selector);assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=412&&rect.y+rect.height<=860,selector);}
  assert.deepEqual(errores,[]);
  console.log('OK: demo real, movimiento con teclado, pausa congela física, reanudación y HUD móvil',JSON.stringify({ini:ini.pos,pausa:pausa.pos,pasosPausa:pausa.pasos,pasosReanudados:reanudado.pasos}));
}finally{try{if(browser)await browser.close();}finally{await new Promise(resolve=>server.close(resolve));}}
