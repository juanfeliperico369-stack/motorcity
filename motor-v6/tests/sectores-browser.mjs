import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const modulos = new Map([
  ['/motor/sectores.js', new URL('../src/sectores.js', import.meta.url)],
  ['/motor/mundo/trabajador-sectores.js', new URL('../src/mundo/trabajador-sectores.js', import.meta.url)]
]);
const peticiones = new Map();
const server = createServer(async (req,res)=>{
  const ruta=new URL(req.url,'http://localhost').pathname;
  try {
    if (modulos.has(ruta)) {
      res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8'});
      res.end(await readFile(modulos.get(ruta))); return;
    }
    if(ruta==='/') { res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><title>Banco de sectores</title>');return; }
    if(ruta.startsWith('/datos/')){
      const id=ruta.slice(7,-5);
      peticiones.set(id,(peticiones.get(id)||0)+1);
      res.setHeader('Content-Type','application/json');
      if(id==='fallo'&&peticiones.get(id)===1){res.writeHead(503);res.end('{}');return;}
      if(id==='grande'){res.end(JSON.stringify({id,relleno:'x'.repeat(200001)}));return;}
      if(id==='invalido'){res.end('{');return;}
      if(id==='otro-id'){res.end(JSON.stringify({id:'intruso'}));return;}
      res.end(JSON.stringify({id,version:1,nodos:[],tramos:[],objetos:[]}));return;
    }
    res.writeHead(404);res.end();
  }catch(e){res.writeHead(500);res.end(String(e));}
});
let browser;
try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const origen='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:860},isMobile:true,hasTouch:true});
  const errores=[];
  page.on('pageerror',e=>errores.push(String(e)));
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.goto(origen);
  await page.evaluate(async ()=>{
    const { CargadorSectores }=await import('/motor/sectores.js');
    const eventos={carga:[],error:[],expulsion:[]};
    const catalogo=[
      {id:'a',x:0,z:0,url:'a.json',dependencias:['b']},
      {id:'b',x:2000,z:0,url:'b.json'},
      {id:'c',x:3000,z:0,url:'c.json'},
      ...['fallo','grande','invalido','otro-id'].map((id,i)=>({id,x:4000+i*1000,z:0,url:id+'.json'}))
    ];
    const c=new CargadorSectores({catalogo,baseUrl:new URL('/datos/indice.json',location.href),tope:2,concurrencia:1,reintentoMs:0,alCargar:id=>eventos.carga.push(id),alError:(id,error)=>eventos.error.push({id,error}),alExpulsar:id=>eventos.expulsion.push(id)});
    window.banco={c,eventos};
  });
  const actualizar=id=>page.evaluate(id=>window.banco.c.actualizar({x:0,z:0,radio:0,visibles:[id]}),id);
  const listo=()=>page.waitForFunction(()=>window.banco.c.estado().faltantes.length===0,{},{timeout:15000});
  const errorDe=id=>page.waitForFunction(id=>window.banco.eventos.error.some(e=>e.id===id),id,{timeout:15000});
  await actualizar('a');await actualizar('a');await listo();
  assert.deepEqual(await page.evaluate(()=>window.banco.eventos.carga),['a','b']);
  assert.equal(peticiones.get('a'),1);assert.equal(peticiones.get('b'),1);
  console.log('OK: Worker real, URL relativa, dependencia remota y deduplicación');
  await actualizar('c');await listo();
  assert.equal(await page.evaluate(()=>window.banco.c.estado().cache),2);
  assert.equal(await page.evaluate(()=>window.banco.eventos.expulsion.length),1);
  console.log('OK: cambio de zona y expulsión con tope');
  await actualizar('fallo');await errorDe('fallo');await actualizar('fallo');await listo();
  assert.equal(peticiones.get('fallo'),2);
  console.log('OK: HTTP 503 y reintento controlado');
  for(const id of ['grande','invalido','otro-id']){
    await actualizar(id);await errorDe(id);
    assert.equal(await page.evaluate(id=>window.banco.c.cache.has(id),id),false);
  }
  console.log('OK: rechazo de exceso de tamaño, JSON inválido e ID incorrecto');
  await page.evaluate(()=>window.banco.c.cerrar());
  assert.equal(await page.evaluate(()=>window.banco.c.estado().cache),0);
  assert.deepEqual(errores,[]);
  console.log('OK: cierre y sin errores de página');
} finally {
  try { if(browser) await browser.close(); } finally { await new Promise(resolve=>server.close(resolve)); }
}
