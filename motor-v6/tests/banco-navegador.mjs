/* El banco de la cámara y los controles, jugado en Chromium móvil (412 × 860, táctil y CPU 4× más lenta).
   Uso: node motor-v6/tests/banco-navegador.mjs   (MC_CHROMIUM=<ruta> para otro Chromium; MC_CAPTURAS=<carpeta> guarda capturas)
   Pruebas honestas (plan § 11): toques de verdad por el protocolo del navegador (no se llama al juego por dentro ni se
   teletransporta nada), y se espera por el estado del juego, no por tiempo. Mide la fluidez y la memoria mientras se mueve. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, sep, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const raiz = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json' };
const servidor = createServer(async (q, r) => {
  try {
    let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const f = resolve(raiz, '.' + p); if (!f.startsWith(raiz + sep)) { r.writeHead(403); return r.end(); }
    r.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'application/octet-stream' }); r.end(await readFile(f));
  } catch { r.writeHead(404); r.end(); }
});
await new Promise(ok => servidor.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${servidor.address().port}`, capturas = process.env.MC_CAPTURAS || null;
if (capturas) await mkdir(capturas, { recursive: true });
const foto = async (page, nombre) => { if (capturas) await page.screenshot({ path: join(capturas, nombre) }); };
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; console.log('  ✓ ' + m); };

const navegador = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'], ...(process.env.MC_CHROMIUM ? { executablePath: process.env.MC_CHROMIUM } : {}) });
try {
  const ctx = await navegador.newContext({ viewport: { width: 412, height: 860 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errores = [], externos = [];
  page.on('pageerror', e => errores.push(String(e))); page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('request', q => { if (!q.url().startsWith(base) && !q.url().startsWith('data:')) externos.push(q.url()); });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const toque = (type, puntos) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: puntos.map(([x, y], i) => ({ x, y, id: i + 1, radiusX: 4, radiusY: 4, force: 1 })) });
  const E = () => page.evaluate(() => window.MC6_BANCO.estado());
  const esperar = (f, arg, ms = 30000) => page.waitForFunction(f, arg, { timeout: ms, polling: 'raf' });

  await page.goto(base + '/motor-v6/banco/');
  await esperar(() => window.MC6_BANCO?.listo && window.MC6_BANCO.estado().pasos > 20);
  const ini = await E();
  ok(ini.camara.distancia > 35 && ini.camara.distancia < 37 && Math.abs(ini.camara.inclinacion * 180 / Math.PI - 50) < 0.5, `arranca en lo justo: ${ini.camara.distancia.toFixed(1)} m a ${(ini.camara.inclinacion * 180 / Math.PI).toFixed(1)}°`);
  await foto(page, 'banco-1-inicio-412x860.png');

  /* ---- la palanca flotante: el pulgar en la mitad izquierda, hacia arriba ---- */
  await toque('touchStart', [[110, 700]]); await toque('touchMove', [[110, 668]]); await toque('touchMove', [[110, 640]]);
  await esperar(() => window.MC6_BANCO.estado().activaPalanca && window.MC6_BANCO.estado().velocidad > 3.3 && window.MC6_BANCO.estado().z > 1.5);
  const pie = await E(); ok(pie.z > ini.z + 1.5 && Math.abs(pie.x - ini.x) < 0.2, 'a pie, la palanca hacia arriba camina recto hacia donde mira la cámara');
  await toque('touchEnd', []);
  await esperar(() => window.MC6_BANCO.estado().velocidad === 0);
  const parado = await E(); ok(parado.pasos - pie.pasos < 60, `al soltar se para pronto (${parado.pasos - pie.pasos} pasos)`);

  /* ---- la bici: de quieto a 10 m/s, contado en pasos de la física (no en tiempo de reloj) ---- */
  for (let i = 0; i < 3 && (await E()).modo !== 'bici'; i++) await page.locator('#vehiculo').tap();
  ok((await E()).modo === 'bici', 'el botón cambia a la bici');
  const p0 = (await E()).pasos;
  await toque('touchStart', [[110, 700]]); await toque('touchMove', [[110, 630]]);
  await esperar(() => window.MC6_BANCO.estado().velocidad >= 10.9);
  const p1 = (await E()).pasos, seg = (p1 - p0) / 60;
  ok(seg >= 1.4 && seg <= 2.4, `la bici llega a su máxima en ${seg.toFixed(2)} s de juego (meta 1,5 a 2 s más el toque)`);
  await foto(page, 'banco-2-bici-412x860.png');
  /* ---- girar a la derecha: el jugador va a la derecha y la cámara lo sigue con su resorte ---- */
  const g0 = (await E()).camara.guinada;
  await toque('touchMove', [[180, 690]]);
  await esperar(g => Math.abs(window.MC6_BANCO.estado().camara.guinada - g) > 1.2, g0);
  const giro = await E(); ok(giro.rumbo < -0.9, 'la palanca a la derecha gira a la derecha (el rumbo baja)');
  await foto(page, 'banco-3-girando-412x860.png');
  await toque('touchEnd', []);
  await esperar(() => window.MC6_BANCO.estado().velocidad === 0, undefined, 40000);

  /* ---- el pellizco llega a sus extremos (dos dedos en la mitad derecha, que no es de la palanca) ---- */
  await toque('touchStart', [[300, 430], [330, 470]]);
  for (let k = 1; k <= 12; k++) await toque('touchMove', [[300 - k * 8, 430 - k * 10], [330 + k * 8, 470 + k * 10]]);
  await toque('touchEnd', []);
  await esperar(() => window.MC6_BANCO.estado().camara.zoom === 1);
  ok((await E()).camara.distancia < 8, 'separando dos dedos llega a casi tercera persona (7 m)');
  await foto(page, 'banco-4-cerca-412x860.png');
  for (let r = 0; r < 3; r++) {
    await toque('touchStart', [[220, 300], [380, 620]]);
    for (let k = 1; k <= 12; k++) await toque('touchMove', [[220 + k * 6, 300 + k * 12], [380 - k * 6, 620 - k * 12]]);
    await toque('touchEnd', []);
  }
  await esperar(() => window.MC6_BANCO.estado().camara.zoom === 0);
  ok((await E()).camara.distancia > 115, 'juntando dos dedos llega a de lejos (120 m)');
  await foto(page, 'banco-5-lejos-412x860.png');
  await page.locator('#centrar').tap();
  await esperar(() => Math.abs(window.MC6_BANCO.estado().camara.zoom - 0.36) < 1e-3);
  ok(true, 'el botón ◎ la centra y la devuelve a lo justo');

  /* ---- la pausa: la física no da ni un paso ---- */
  await page.locator('#pausa').tap();
  await esperar(() => window.MC6_BANCO.estado().pausa);
  const pp = (await E()).pasos;
  await toque('touchStart', [[110, 700]]); await toque('touchMove', [[110, 620]]);
  await page.evaluate(() => new Promise(ok => { let k = 0; const f = () => (++k > 40 ? ok() : requestAnimationFrame(f)); requestAnimationFrame(f); }));
  await toque('touchEnd', []);
  ok((await E()).pasos === pp, 'en pausa la física no avanza, ni con la palanca');
  await page.locator('#pausa').tap(); await esperar(() => !window.MC6_BANCO.estado().pausa);

  /* ---- a la carrera y de vuelta, en 0,8 s ---- */
  await page.locator('#carrera').tap();
  await esperar(() => window.MC6_BANCO.estado().camara.carrera === 1);
  ok(true, 'la cámara pasa a la persecución de la carrera');
  await foto(page, 'banco-6-carrera-412x860.png');
  await page.locator('#carrera').tap();
  await esperar(() => window.MC6_BANCO.estado().camara.carrera === 0);
  ok(true, 'y vuelve a la panorámica');

  /* ---- fluidez y memoria con CPU 4×, mientras el jugador rueda por la ciudad ---- */
  await page.evaluate(() => window.MC6_BANCO.reiniciarMedidas());
  await toque('touchStart', [[110, 700]]); await toque('touchMove', [[110, 630]]);
  const t0 = (await E()).pasos; await esperar(t => window.MC6_BANCO.estado().pasos > t + 360, t0, 60000);
  await toque('touchMove', [[170, 650]]); const t1 = (await E()).pasos; await esperar(t => window.MC6_BANCO.estado().pasos > t + 240, t1, 60000);
  await toque('touchEnd', []);
  const tiempos = (await page.evaluate(() => window.MC6_BANCO.tiempos())).slice(10).sort((a, b) => a - b);
  const mediana = tiempos[Math.floor(tiempos.length / 2)], p95 = tiempos[Math.floor(tiempos.length * 0.95)];
  const memoria = await page.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0);
  const m = (await E()).medidas;
  console.log(`  · CPU 4× (WebGL por software): cuadro mediano ${mediana.toFixed(1)} ms (${(1000 / mediana).toFixed(0)} fps), p95 ${p95.toFixed(1)} ms; memoria JS ${memoria.toFixed(1)} MB; ${m.cuadros} cuadros, ${m.tapado} con algo tapando`);
  ok(memoria < 150, `la memoria JS queda bajo 150 MB (${memoria.toFixed(1)} MB)`);
  ok(m.dentro === 0, `la cámara nunca quedó dentro de un edificio (${m.cuadros} cuadros)`);
  ok(m.fuera === 0, 'el jugador siempre quedó en la pantalla');

  /* ---- los botones: de 44 px o más, dentro de la pantalla y sin montarse ---- */
  const cajas = await page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect(); return { id: b.id, x: r.x, y: r.y, w: r.width, h: r.height }; }));
  for (const b of cajas) ok(b.w >= 44 && b.h >= 44 && b.x >= 0 && b.y >= 0 && b.x + b.w <= 412 && b.y + b.h <= 860, `el botón ${b.id} mide ${Math.round(b.w)}×${Math.round(b.h)} y está entero en la pantalla`);
  for (let i = 0; i < cajas.length; i++) for (let j = i + 1; j < cajas.length; j++) { const a = cajas[i], b = cajas[j]; ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, `${a.id} y ${b.id} no se montan`); }

  /* ---- al girar el celular: la recomendación, y aplicarla ---- */
  await page.setViewportSize({ width: 860, height: 412 });
  await page.waitForSelector('#aviso:not([hidden])');
  ok(/horizontal/.test(await page.locator('#avisoTexto').textContent()), 'al girarlo a horizontal recomienda la palanca fija');
  await page.locator('#avisoSi').tap();
  await esperar(() => window.MC6_BANCO.estado().ajustes.palanca.modo === 'fija');
  ok(true, 'y «Usar» la deja fija (guardado en los ajustes)');
  await foto(page, 'banco-7-horizontal-860x412.png');

  ok(errores.length === 0, 'sin errores en la consola: ' + errores.join(' | '));
  ok(externos.length === 0, 'sin pedir nada a internet');
  console.log(`✓ el banco en Chromium móvil: ${n} pruebas`);
} finally { await navegador.close(); servidor.close(); }
