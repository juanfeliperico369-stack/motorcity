#!/usr/bin/env node
// Integración del cargador con Worker, HTTP y reloj reales. No es una prueba del juego.
// NODE_PATH=/ruta/a/node_modules MC_CHROMIUM=/usr/bin/chromium node motor-v6/tests/sectores-navegador.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const fuentes = new Map([
  ['/mundo/sectores.js', new URL('../src/mundo/sectores.js', import.meta.url)],
  ['/mundo/trabajador-sectores.js', new URL('../src/mundo/trabajador-sectores.js', import.meta.url)],
]);
// Datos sintéticos v1: red conectada entre sectores de 250 m; no es Orbe real.
function sector(i) {
  const origen = i * 250, a = origen + 10, b = origen + 125;
  const tramos = [{id:`v${i}`,red:'vial',desde:`a${i}`,hasta:`b${i}`,ancho_m:6,pendiente:0,nivel:0,puntos:[[a,10],[b,10]]}];
  if (i < 5) tramos.push({id:`enlace${i}`,red:'vial',desde:`b${i}`,hasta:`a${i+1}`,ancho_m:6,pendiente:0,nivel:0,puntos:[[b,10],[origen+260,10]]});
  tramos.push({id:`c${i}`,red:'ciclovia',desde:`ca${i}`,hasta:`cb${i}`,ancho_m:2,pendiente:0,nivel:0,puntos:[[a,20],[b,20]]});
  if (i < 5) tramos.push({id:`ce${i}`,red:'ciclovia',desde:`cb${i}`,hasta:`ca${i+1}`,ancho_m:2,pendiente:0,nivel:0,puntos:[[b,20],[origen+260,20]]});
  return {version:1,unidad:'m',id:`s${i}`,origen:[origen,0],tamano_m:250,
    nodos:[{id:`a${i}`,posicion:[a,10],altura_m:0,cruce:'ninguno'},{id:`b${i}`,posicion:[b,10],altura_m:0,cruce:'ninguno'},
      {id:`ca${i}`,posicion:[a,20],altura_m:0,cruce:'ninguno'},{id:`cb${i}`,posicion:[b,20],altura_m:0,cruce:'ninguno'}],tramos,objetos:[]};
}
const servidor = createServer(async (req, res) => {
  try {
    const ruta = new URL(req.url, 'http://localhost').pathname;
    if (ruta === '/favicon.ico') { res.writeHead(204); res.end(); return; }
    if (ruta === '/') { res.writeHead(200, {'content-type':'text/html; charset=utf-8'}); res.end('<!doctype html><title>Prueba de sectores</title>'); return; }
    if (fuentes.has(ruta)) { res.writeHead(200, {'content-type':'text/javascript; charset=utf-8'}); res.end(await readFile(fuentes.get(ruta))); return; }
    const m = /^\/datos\/(\d+)\.json$/.exec(ruta);
    if (m && Number(m[1]) < 6) { res.writeHead(200, {'content-type':'application/json'}); res.end(JSON.stringify(sector(Number(m[1])))); return; }
    res.writeHead(404); res.end();
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});
await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
let navegador;
try {
  navegador = await chromium.launch({headless:true, ...(process.env.MC_CHROMIUM ? {executablePath:process.env.MC_CHROMIUM} : {})});
  const pagina = await navegador.newPage({viewport:{width:412,height:860},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errores = [];
  pagina.on('pageerror', e => errores.push(`pageerror: ${e.message}`));
  pagina.on('console', m => { if (m.type() === 'error') errores.push(`console: ${m.text()}`); });
  await pagina.goto(`http://127.0.0.1:${servidor.address().port}/`);
  const recorrido = pagina.evaluate(async () => {
    const { CargadorSectores } = await import('/mundo/sectores.js');
    const catalogo = Array.from({length:6}, (_, i) => ({id:`s${i}`,url:`/datos/${i}.json`,x:i*250+125,z:125,dependencias:i<5?[`s${i+1}`]:[]}));
    const fallos = [], inicios = new Map(), demoras = [], visitas = new Set();
    let maxCache = 0, maxPendientes = 0, cuadros = 0;
    const cargador = new CargadorSectores({catalogo,tope:3,concurrencia:2,alError:(id,error)=>fallos.push(`${id}: ${error}`)});
    const comienzo = performance.now();
    try {
      await new Promise((resolve, reject) => {
        function cuadro(ahora) {
          try {
            const segundos = (ahora-comienzo)/1000;
            // Movimiento por tiempo real a 30 km/h, sin saltos de posición.
            const x = 100 + segundos * (30 / 3.6);
            const visibles = catalogo.filter(s => x+50 >= s.x-125 && x-50 < s.x+125).map(s => s.id);
            visibles.forEach(id => visitas.add(id));
            cargador.actualizar({x,z:125,rumbo:Math.PI/2,visibles,radio:500});
            // El índice enumera todas las dependencias necesarias de cada visible.
            const necesarios = new Set(visibles.flatMap(id => [id, ...catalogo.find(s => s.id === id).dependencias]));
            for (const id of necesarios) {
              if (!cargador.obtener(id)) {
                if (!inicios.has(id)) inicios.set(id, ahora);
                if (ahora-inicios.get(id) > 2000) throw new Error(`${id} visible o requerido pendiente por más de 2 s`);
              } else if (inicios.has(id)) { demoras.push(ahora-inicios.get(id)); inicios.delete(id); }
            }
            for (const id of inicios.keys()) if (!necesarios.has(id)) throw new Error(`${id} dejó de ser necesario sin cargarse`);
            maxCache = Math.max(maxCache,cargador.cache.size); maxPendientes = Math.max(maxPendientes,cargador.pendientes.size); cuadros++;
            if (fallos.length) throw new Error(fallos.join('; '));
            if (segundos >= 31 && !inicios.size) return resolve();
            if (segundos > 35) throw new Error('Tiempo máximo de recorrido excedido');
            requestAnimationFrame(cuadro);
          } catch (e) { reject(e); }
        }
        requestAnimationFrame(cuadro);
      });
      return {distancia_m:(performance.now()-comienzo)/1000*(30/3.6), cuadros, sectoresVisibles:[...visitas], demoraMaxima_ms:Math.max(0,...demoras), episodiosPendientes:demoras.length,maxCache,maxPendientes,errores:fallos};
    } finally { cargador.cerrar(); }
  });
  let reloj;
  const resultado = await Promise.race([recorrido, new Promise((_, reject) => { reloj = setTimeout(() => reject(new Error('El navegador no terminó el recorrido en 50 s')), 50000); })]).finally(() => clearTimeout(reloj));
  assert.deepEqual(errores, [], errores.join('\n')); 
  assert.ok(resultado.sectoresVisibles.length >= 2, 'El recorrido debe atravesar más de un sector');
  assert.ok(resultado.distancia_m >= 250, 'El recorrido debe cubrir al menos 250 m');
  assert.ok(resultado.cuadros > 100, 'No hubo suficientes cuadros');
  assert.ok(resultado.maxCache <= 3 && resultado.maxPendientes <= 2, 'Límites de caché o concurrencia excedidos');
  console.log('✓ Worker real, HTTP local y recorrido continuo a 30 km/h:', JSON.stringify(resultado));
} finally {
  if (navegador) await navegador.close();
  await new Promise(resolve => servidor.close(resolve));
}
