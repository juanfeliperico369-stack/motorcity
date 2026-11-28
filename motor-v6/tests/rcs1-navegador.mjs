import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { gzipSync, crc32 } from 'node:zlib';
const { chromium }=createRequire(import.meta.url)('playwright');
const fuentes=new Map([['/sectores.js',new URL('../src/sectores.js',import.meta.url)],['/mundo/trabajador-sectores.js',new URL('../src/mundo/trabajador-sectores.js',import.meta.url)]]);
const cuerpo=id=>({version:1,unidad:'m',id,origen:[0,0],tamano_m:250,nodos:[],tramos:[],objetos:[],barrio:'Neón'});
function paquete(raw){
  const gz=gzipSync(raw), h=Buffer.alloc(16);
  h.write('RCS1');h.writeUInt32LE(raw.length,4);h.writeUInt32LE(gz.length,8);h.writeUInt32LE(crc32(raw),12);
  return Buffer.concat([h,gz]);
}
const pedidos=[];
const server=createServer(async(req,res)=>{
  try{
    const path=new URL(req.url,'http://localhost').pathname;
    if(path==='/favicon.ico'){res.writeHead(204);res.end();return;}
    if(path==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>RCS1</title>');return;}
    if(path==='/legacy/sectores.js'){res.setHeader('Content-Type','text/javascript');res.end(await readFile(fuentes.get('/sectores.js')));return;}
    if(path==='/legacy/mundo/trabajador-sectores.js'){res.setHeader('Content-Type','text/javascript');res.end('globalThis.DecompressionStream = undefined;\n'+await readFile(fuentes.get('/mundo/trabajador-sectores.js'),'utf8'));return;}
    if(fuentes.has(path)){res.setHeader('Content-Type','text/javascript');res.end(await readFile(fuentes.get(path)));return;}
    const m=/^\/datos\/([a-z]+)\.(json|rcs)$/.exec(path);
    if(m){
      const [,id,ext]=m;pedidos.push(id+'.'+ext);
      const raw=Buffer.from(JSON.stringify(cuerpo(id)));
      if(ext==='json'){res.setHeader('Content-Type','application/json');res.end(raw);return;}
      const b=paquete(raw);
      if(id==='crc')b[12]^=1;
      if(id==='truncado'){res.end(b.subarray(0,-1));return;}
      if(id==='grande')b.writeUInt32LE(200001,4);
      res.setHeader('Content-Type','application/octet-stream');res.end(b);return;
    }
    res.writeHead(404);res.end();
  }catch(e){res.writeHead(500);res.end(String(e));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,...(process.env.MC_CHROMIUM?{executablePath:process.env.MC_CHROMIUM}:{})});
  const page=await browser.newPage({viewport:{width:412,height:860},isMobile:true,hasTouch:true});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const errores=[];page.on('pageerror',e=>errores.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.evaluate(async()=>{
    const {CargadorSectores}=await import('/sectores.js');
    const catalogo=['bien','json','crc','truncado','grande'].map((id,i)=>({id,url:id+'.json',url_binaria:id+'.rcs',x:i*1000,z:0}));
    const opts={catalogo,baseURL:new URL('/datos/indice.json',location.href),tope:1,concurrencia:1,reintentos:0};
    window.banco=new CargadorSectores({...opts,preferirBinario:true});
    window.json=new CargadorSectores(opts);
  });
  async function pedir(id,inst='banco',error=false){
    await page.evaluate(({id,inst})=>window[inst].actualizar({x:0,z:0,visibles:[id],radio:0}),{id,inst});
    await page.waitForFunction(({id,inst,error})=>error?window[inst].estado().fallos.includes(id):window[inst].estado().faltantes.length===0,{id,inst,error},{timeout:15000});
    return page.evaluate(({id,inst})=>({s:window[inst].obtener(id),estado:window[inst].estado()}),{id,inst});
  }
  const bien=await pedir('bien');assert.deepEqual(bien.s,cuerpo('bien'));assert.equal(bien.estado.formatos.bien,'RCS1');
  const normal=await pedir('json','json');assert.deepEqual(normal.s,cuerpo('json'));assert.equal(normal.estado.formatos.json,'json');
  for(const id of ['crc','truncado','grande']){const mal=await pedir(id,'banco',true);assert.equal(mal.s,undefined);}
  assert.ok(pedidos.includes('bien.rcs')&&pedidos.includes('json.json'));assert.ok(!pedidos.includes('bien.json'));
  // Servir una copia de prueba del Worker sin API, sin interceptación de red.
  await page.evaluate(async()=>{const {CargadorSectores}=await import('/legacy/sectores.js');window.fallback=new CargadorSectores({catalogo:[{id:'bien',url:'/datos/bien.json',url_binaria:'/datos/bien.rcs',x:0,z:0}],preferirBinario:true,tope:1,reintentos:0});});
  const respaldo=await pedir('bien','fallback');assert.equal(respaldo.estado.formatos.bien,'json');assert.deepEqual(respaldo.s,cuerpo('bien'));
  await page.evaluate(()=>{window.banco.cerrar();window.json.cerrar();window.fallback.cerrar();});
  assert.deepEqual(errores,[]);
  console.log('OK: RCS1 real, JSON optativo y fallback sin API, CRC, truncado y límite de expansión; CPU 4x');
}finally{try{if(browser)await browser.close();}finally{await new Promise(resolve=>server.close(resolve));}}
