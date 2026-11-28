import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const raiz=new URL('../../',import.meta.url);
const modulos=new Set(['/motor-v6/tests/mundo-banco.js','/motor-v6/src/mundo-sectores.js','/motor-v6/src/sectores.js','/motor-v6/src/mundo/trabajador-sectores.js','/motor-v6/src/fisica/arcade.js','/js/vendor/three-0.170.0.module.min.js']);
const idx={version:1,tamano_m:250,sectores:[0,1,2].map(i=>({id:'s'+i,url:'s'+i+'.json',x:i*250+125,z:125,dependencias:[]}))};
function sector(i){
  const x=i*250,id='s'+i;
  return {version:1,unidad:'m',id,origen:[x,0],tamano_m:250,nodos:[{id:id+'a',posicion:[x+10,125],altura_m:0,cruce:'ninguno'},{id:id+'b',posicion:[x+240,125],altura_m:0,cruce:'ninguno'}],
    tramos:[{id:id+'v',red:'ciclovia',desde:id+'a',hasta:id+'b',ancho_m:2,pendiente:0,nivel:0,puntos:[[x+10,125],[x+240,125]]}],
    objetos:[{id:id+'o',huella:[[x+20,140],[x+30,140],[x+30,150],[x+20,150]],altura_m:8,base_m:0}],relieve:{nx:2,nz:2,alturas_m:[0,0,0,0],fuente:'fixture'}};
}
const server=createServer(async(req,res)=>{
  try{
    const p=new URL(req.url,'http://localhost').pathname;
    if(p==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><canvas></canvas><script type="module" src="/motor-v6/tests/mundo-banco.js"></script>');return;}
    if(p==='/favicon.ico'){res.writeHead(204);res.end();return;}
    if(modulos.has(p)){res.setHeader('Content-Type','text/javascript');res.end(await readFile(new URL(p.slice(1),raiz)));return;}
    if(p==='/datos/indice.json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(idx));return;}
    const m=/^\/datos\/s([012])\.json$/.exec(p);if(m){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(sector(Number(m[1]))));return;}
    res.writeHead(404);res.end();
  }catch(e){res.writeHead(500);res.end(String(e));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],...(process.env.MC_CHROMIUM?{executablePath:process.env.MC_CHROMIUM}:{})});
  const page=await browser.newPage({viewport:{width:412,height:860},isMobile:true,hasTouch:true});
  const errores=[];page.on('pageerror',e=>errores.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForFunction(()=>window.banco?.estado().escena?.listo,undefined,{timeout:20000});
  const inicial=await page.evaluate(()=>window.banco.estado());
  assert.equal(inicial.x,244);// La cámara puede descartar edificios lejanos; exigir avatar y entorno realmente dibujados.
  assert.ok(inicial.render.drawCalls>=2);assert.ok(inicial.render.triangulos>12);assert.equal(inicial.escena.lotes,3);
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(()=>window.banco.estado().x>260&&window.banco.estado().escena?.listo,undefined,{timeout:20000});
  await page.keyboard.up('ArrowUp');await page.keyboard.down('ArrowDown');
  await page.waitForFunction(()=>window.banco.estado().velocidad<.001,undefined,{timeout:10000});
  await page.keyboard.up('ArrowDown');
  const ultimo=await page.evaluate(()=>window.banco.estado());
  assert.ok(ultimo.x>260&&ultimo.x<300);assert.ok(ultimo.cuadros>inicial.cuadros);assert.ok(ultimo.entrada);
  assert.deepEqual(ultimo.escena.visibles,['s1']);assert.equal(ultimo.escena.lotes,3);assert.ok(ultimo.render.geometrias<=4);
  assert.deepEqual(errores,[]);
  const cierre=await page.evaluate(()=>window.banco.cerrar());
  assert.deepEqual(cierre,{lotes:0,geometrias:0});
  console.log('OK: escena WebGL sintética, movimiento por teclado, terreno listo, reemplazo de lotes y disposición GPU',JSON.stringify({inicial,ultimo,cierre}));
}finally{try{if(browser)await browser.close();}finally{await new Promise(resolve=>server.close(resolve));}}
