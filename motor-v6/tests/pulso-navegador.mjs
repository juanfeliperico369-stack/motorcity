/* node motor-v6/tests/pulso-navegador.mjs (requiere Playwright y Chromium) */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const server = createServer(async (req, res) => {
  try {
    const archivos = { '/pulso.js': '../src/sonido/pulso.js', '/guardian.js': '../src/sonido/guardian.js' };
    if (req.url === '/') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<link rel="icon" href="data:,"><button id="activar">Activar</button>'); return; }
    if (!archivos[req.url]) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': 'text/javascript' });
    res.end(await readFile(new URL(archivos[req.url], import.meta.url)));
  } catch { res.writeHead(500); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.MC_CHROMIUM ? { executablePath: process.env.MC_CHROMIUM } : {}) });
  const page = await browser.newPage();
  const errores = []; page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(async () => {
    const { MusicaPulso } = await import('/pulso.js');
    window.musica = new MusicaPulso();
    document.querySelector('#activar').onclick = async () => {
      window.activada = await window.musica.activar();
      const analizador = window.musica.ctx.createAnalyser(); analizador.fftSize = 2048;
      window.musica.salida.connect(analizador); window.analizador = analizador;
    };
  });
  assert.equal(await page.evaluate(() => window.musica.ctx), null);
  await page.click('#activar');
  await page.waitForFunction(() => window.activada === true);
  // Avanzar como en el juego mientras se espera una muestra real con señal.
  await page.evaluate(() => {
    window.pulsando = true;
    const cuadro = () => { if (window.pulsando) { window.musica.actualizar({ velocidad: 15, segundosRestantes: 10 }); requestAnimationFrame(cuadro); } };
    requestAnimationFrame(cuadro);
  });
  await page.waitForFunction(() => {
    const datos = new Float32Array(window.analizador.fftSize);
    window.analizador.getFloatTimeDomainData(datos);
    window.maximoPulso = Math.max(...datos.map(Math.abs));
    return window.maximoPulso > .001;
  }, undefined, { timeout: 10000 });
  const maximo = await page.evaluate(() => window.maximoPulso);
  await page.evaluate(() => { window.musica.pausar(true); window.pulsando = false; });
  // El analizador conserva una ventana de muestras: esperar hasta que la señal
  // anterior haya salido de esa ventana, sin asumir un tiempo de procesamiento.
  await page.waitForFunction(() => {
    const datos = new Float32Array(window.analizador.fftSize);
    window.analizador.getFloatTimeDomainData(datos);
    return Math.max(...datos.map(Math.abs)) < .00001;
  }, undefined, { timeout: 10000 });
  await page.evaluate(() => { window.musica.pausar(false); window.musica.g.callar(); });
  await page.waitForFunction(() => window.musica.ctx.state === 'suspended', undefined, { timeout: 10000 });
  await page.evaluate(() => window.musica.g.volver());
  await page.waitForFunction(() => window.musica.ctx.state === 'running', undefined, { timeout: 10000 });
  const cierre = await page.evaluate(async () => {
    const m = window.musica, ctx = m.ctx;
    await m.cerrar();
    return { estado:ctx.state, registrado:m.g.contextos.has(ctx) };
  });
  assert.deepEqual(cierre, { estado:'closed', registrado:false });
  const medicion = { maximo, pausa:'silencio', oculto:'suspended', vuelto:'running', cierre };
  assert.deepEqual(errores, []);
  console.log('✓ Web Audio real: gesto, señal, pausa y guardián', JSON.stringify(medicion));
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
