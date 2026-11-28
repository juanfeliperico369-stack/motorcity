/* Pruebas del guardado versionado (nucleo/guardado.js) y del guardián del sonido (sonido/guardian.js).
   Uso: node motor-v6/tests/guardado-sonido.mjs */
import assert from 'node:assert/strict';
import { Almacen, MemoriaLocal } from '../src/nucleo/guardado.js';
import { GuardianSonido } from '../src/sonido/guardian.js';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

/* ---- el guardado ---- */
{
  const mem = new MemoriaLocal();
  const v1 = new Almacen({ clave: 'juego', version: 1, almacenamiento: mem, validar: d => (Number.isFinite(d?.x) ? d : null) });
  ok(v1.leer() === null, 'sin partida, null');
  ok(v1.escribir({ x: 3, paginas: 2 }) && v1.leer().x === 3, 'guarda y lee');
  ok(!v1.escribir({ x: 'no' }) && v1.leer().x === 3, 'lo inválido no se guarda ni pisa lo bueno');
  /* la versión 3 del juego lee la partida de la 1 con dos migraciones */
  const v3 = new Almacen({ clave: 'juego', version: 3, almacenamiento: mem, migraciones: { 1: d => ({ ...d, hojas: 0 }), 2: d => ({ ...d, monedas: { paginas: d.paginas, hojas: d.hojas, creditos: 0 } }) }, validar: d => (d.monedas ? d : null) });
  const l = v3.leer(); ok(l && l.monedas.paginas === 2 && l.monedas.creditos === 0, 'migra 1→2→3 y valida');
  ok(v3.escribir(l) && JSON.parse(mem.getItem('juego')).v === 3, 'y guarda ya en la versión 3');
  /* una APK vieja (versión 1) no pisa la partida de la 3 */
  const vieja = new Almacen({ clave: 'juego', version: 1, almacenamiento: mem });
  ok(vieja.leer() === null && !vieja.escribir({ x: 0 }) && JSON.parse(mem.getItem('juego')).v === 3, 'una versión vieja no pisa una partida más nueva');
  /* texto dañado: se aparta y se sigue */
  mem.setItem('otra', '{rota'); const d = new Almacen({ clave: 'otra', almacenamiento: mem });
  ok(d.leer() === null && mem.getItem('otra.danado') === '{rota', 'lo dañado se aparta en .danado');
  const sinMig = new Almacen({ clave: 'juego', version: 5, almacenamiento: mem });
  ok(sinMig.leer() === null, 'si falta una migración, no inventa: null');
  const lleno = new Almacen({ clave: 'k', almacenamiento: new MemoriaLocal(true) });
  ok(lleno.escribir({ a: 1 }) && !lleno.persistente && lleno.leer().a === 1, 'con la cuota llena sigue en memoria y lo dice');
  const nulo = new Almacen({ clave: 'k', almacenamiento: null });
  ok(nulo.escribir({ a: 2 }) && nulo.leer().a === 2 && !nulo.persistente, 'sin almacenamiento, en memoria');
}

/* ---- el guardián: un documento y una ventana de mentiras, con su ciclo de vida ---- */
class Eventos { constructor() { this.l = new Map(); } addEventListener(t, f) { (this.l.get(t) || this.l.set(t, []).get(t)).push(f); } removeEventListener(t, f) { this.l.set(t, (this.l.get(t) || []).filter(g => g !== f)); } emitir(t) { for (const f of this.l.get(t) || []) f(); } }
class CtxFalso { constructor() { this.state = 'running'; this.suspensiones = 0; } suspend() { this.state = 'suspended'; this.suspensiones++; return Promise.resolve(); } resume() { this.state = 'running'; return Promise.resolve(); } }
class MedioFalso { constructor() { this.paused = false; } pause() { this.paused = true; } play() { this.paused = false; return Promise.resolve(); } }
{
  const doc = new Eventos(), win = new Eventos(); doc.hidden = false;
  const g = new GuardianSonido({ ventana: win, documento: doc, Contexto: CtxFalso });
  const musica = g.contexto(), efectos = g.contexto(); efectos.state = 'suspended';     // los efectos ya estaban callados
  const audio = g.medio(new MedioFalso()), quieto = g.medio(new MedioFalso()); quieto.paused = true;
  doc.hidden = true; doc.emitir('visibilitychange');
  ok(musica.state === 'suspended' && audio.paused && g.fuera, 'al salir de la app todo calla de una');
  ok(!(await g.despertar(musica)) && musica.state === 'suspended', 'mientras está afuera nada vuelve a sonar aunque el juego lo pida');
  const nuevo = g.contexto(); ok(nuevo.state === 'suspended', 'un sonido creado afuera nace callado');
  doc.hidden = false; doc.emitir('visibilitychange');
  ok(musica.state === 'running' && !audio.paused, 'al volver sigue lo que sonaba');
  ok(efectos.state === 'suspended' && quieto.paused, 'y lo que estaba callado sigue callado');
  win.emitir('app:pausa'); ok(g.fuera && musica.state === 'suspended', 'la APK avisa que se pausa (app:pausa)');
  win.emitir('app:sigue'); ok(!g.fuera && musica.state === 'running', 'y que sigue (app:sigue)');
  doc.emitir('pause'); ok(g.fuera, 'Capacitor: pause'); doc.emitir('resume'); ok(!g.fuera, 'Capacitor: resume');
  win.emitir('pagehide'); ok(g.fuera, 'al cerrar o cambiar de página (pagehide)');
  ok(g.estado().veces === 4, 'cuenta las veces que calló');
  g.cerrar(); win.emitir('pageshow'); ok(g.fuera, 'cerrado ya no escucha');
  const sin = new GuardianSonido({ ventana: {}, documento: {}, Contexto: null }); ok(sin.contexto() === null, 'sin audio en el navegador, no falla');
}
console.log(`✓ el guardado versionado y el guardián del sonido: ${n} pruebas`);
