#!/usr/bin/env node
/* 5.2 · G5-12 · 📏 Medir el rendimiento (Turno Cero ?medir), en Chromium a 860 × 412.
   - ?medir=8 abre el mundo abierto solo y el bot maneja 8 s en cada acercamiento de la cámara única (de lejos, de cerca y casi tercera persona; 5.5.0).
     En 5.5.1 pasó de 4 a 8 s: en la CI lenta (WebGL por software), los primeros segundos del mundo dejaban menos de 20 cuadros por tramo.
     El bot debe recorrer más de 25 m si el juego va a 30 cuadros por segundo o más; en una máquina más lenta (la CI va a ~6), más de 5 m;
   - al final: el panel con fps, p50/p95/p99, tirones, memoria y GPU; el bot se movió de verdad;
   - «📋 Copiar resultados» deja el texto y el JSON en el portapapeles;
   - también está en ⏸ Menú → 📏 Medir el rendimiento.
   Uso: node pruebas/medir.mjs */
import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath, pathToFileURL } from 'node:url';
const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url), { chromium } = require('playwright');
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }), ctx = await b.newContext({ viewport: { width: 860, height: 412 } }), p = await ctx.newPage(), errs = [];
await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
p.on('pageerror', e => errs.push(e.message));
await p.goto(pathToFileURL(path.join(RAIZ, 'dist/juegos/getaway.html')).href + '?medir=8');
await p.waitForFunction(() => window.TURNO && TURNO.Medir && TURNO.Medir.res, null, { timeout: 180000 });
const R = await p.evaluate(() => TURNO.Medir.res), dlg = await p.evaluate(() => [...document.querySelectorAll('.mcui .dialogo')].map(d => d.textContent).find(t => /Resultados de la medición/.test(t)) || '');
await p.screenshot({ path: path.join(RAIZ, 'reportes/medir-5.2.jpg'), type: 'jpeg', quality: 78 });
for (const x of await p.$$('.mcui .dialogo button')) if (/Copiar/.test(await x.textContent())) { await x.click(); break; }
await p.waitForTimeout(600);
const copiado = await p.evaluate(async () => { try { return await navigator.clipboard.readText(); } catch (e) { return 'ERR ' + e.message; } });
await b.close();
const T = R.total || {}, ok = R.tramos && R.tramos.length === 3 && new Set(R.tramos.map(t => t.camara)).size === 3 && R.tramos.every(t => t.cuadros > 20) && T.cuadros > 60 && T.p50 > 0 && T.p95 >= T.p50 && T.p99 >= T.p95 && R.recorrido_m > ((T.cuadros || 0) / Math.max(1, R.segundos || 24) >= 30 ? 25 : 5) && R.gpu && R.gpu.nivel && R.pantalla && /Resultados de la medición/.test(dlg) && /fps/.test(dlg) && /Total/.test(dlg) && /📏 Turno Cero/.test(copiado) && /"total"/.test(copiado) && !errs.length;
console.log((ok ? '✓' : '✗') + ' 📏 G5-12 · Medir el rendimiento: ?medir abre solo, el bot maneja en 3 acercamientos de la cámara única, panel con fps/p50/p95/p99/tirones/memoria/GPU y 📋 copiar · ' + JSON.stringify({ total: T, tramos: (R.tramos || []).map(t => t.camara + ' ' + t.fps + ' fps p95 ' + t.p95), recorrido_m: R.recorrido_m, memoria: R.memoria, gpu: R.gpu && R.gpu.nivel, copiado: copiado.slice(0, 80) }) + (errs.length ? ' · errores: ' + errs.slice(0, 3).join(' | ') : ''));
process.exit(ok ? 0 : 1);
