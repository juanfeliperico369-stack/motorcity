/* Pruebas de la cámara única (plan § 5). Uso: node motor-v6/tests/camara.mjs
   Cada promesa del plan es una prueba: nunca queda dentro de un edificio, el jugador siempre se ve, el giro tarda lo
   prometido, no tiembla y el pellizco llega a sus extremos. Más: quieto no gira, la zona muerta, la espera de 2,5 s, centrar,
   la transición a la carrera en 0,8 s, la velocidad que se siente y el fov según la pantalla. Todo en el paso fijo del bucle. */
import assert from 'node:assert/strict';
import { Camara, PERFIL_CAMARA as P } from '../src/camara/camara.js';
import { Obstaculos, proyectar, angDif, entradaPrisma, dentroPoligono } from '../src/camara/geometria.js';
import { Bucle } from '../src/nucleo/bucle.js';

const G = Math.PI / 180, dt = 1 / 60;
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const cerca = (a, b, e, m) => ok(Math.abs(a - b) <= e, `${m} (${a} vs ${b})`);

/* ---- geometría ---- */
{
  const cuadro = [[0, 0], [10, 0], [10, 10], [0, 10]];
  ok(dentroPoligono(5, 5, cuadro) && !dentroPoligono(11, 5, cuadro), 'punto en polígono');
  const p = { huella: cuadro, base: 0, tope: 20 };
  cerca(entradaPrisma({ x: -10, y: 5, z: 5 }, { x: 40, y: 0, z: 0 }, p), 0.25, 1e-12, 'el rayo entra al prisma por su lado');
  ok(entradaPrisma({ x: -10, y: 25, z: 5 }, { x: 40, y: 0, z: 0 }, p) === Infinity, 'el rayo pasa por encima del techo');
  cerca(entradaPrisma({ x: 5, y: 40, z: 5 }, { x: 0, y: -40, z: 0 }, p), 0.5, 1e-12, 'el rayo que baja entra por el techo');
  const L = [[0, 0], [10, 0], [10, 4], [4, 4], [4, 10], [0, 10]];   // una L cóncava
  ok(entradaPrisma({ x: 7, y: 5, z: 12 }, { x: 0, y: 0, z: -4 }, { huella: L, base: 0, tope: 9 }) === Infinity, 'la parte vacía de una L no tapa');
  const O = new Obstaculos(); O.agregar({ id: 'a', huella: cuadro, base_m: 0, altura_m: 20 });
  ok(O.contiene({ x: 5, y: 3, z: 5 }) === 'a' && O.contiene({ x: 10.5, y: 3, z: 5 }, 0.9) === 'a' && O.contiene({ x: 12, y: 3, z: 5 }, 0.9) === null, 'contiene con margen');
}

/* ---- una ciudad de prueba: manzanas de 40 m con calles de 16 m y torres de 8 a 46 m ---- */
function ciudad(semilla = 7) {
  let s = semilla; const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const O = new Obstaculos();
  for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
    const x0 = i * 56 + 8, z0 = j * 56 + 8;
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const bx = x0 + a * 20 + 1, bz = z0 + b * 20 + 1, w = 16 + azar() * 2, h = 8 + azar() * 38;
      O.agregar({ id: `${i},${j},${a},${b}`, huella: [[bx, bz], [bx + w, bz], [bx + w, bz + w], [bx, bz + w]], base_m: 0, altura_m: h });
    }
  }
  return O;
}

/* ---- el encuadre: lo justo y los extremos del pellizco ---- */
{
  const c = new Camara();
  const e = c.encuadre(P.zoomInicial);
  cerca(e.distancia, 36, 1e-9, 'lo justo: a 36 m'); cerca(e.inclinacion / G, 50, 1e-9, 'lo justo: a 50°');
  c.colocar({ x: 0, y: 0, z: 0, rumbo: 0 });
  for (let i = 0; i < 40; i++) c.acercar(0.05);             // pellizco abriendo, de sobra
  for (let i = 0; i < 120; i++) c.paso(dt, { x: 0, y: 0, z: 0, rumbo: 0, rapidez: 0 });
  ok(c.zoom === 1, 'el pellizco llega al extremo de cerca (zoom 1)');
  cerca(c.encuadre().distancia, P.cerca.distancia, 1e-9, 'casi tercera persona a 7 m'); cerca(c.estado().inclinacion / G, 21, 1e-6, 'y a 21°');
  for (let i = 0; i < 40; i++) c.acercar(-0.05);
  for (let i = 0; i < 120; i++) c.paso(dt, { x: 0, y: 0, z: 0, rumbo: 0, rapidez: 0 });
  ok(c.zoom === 0, 'el pellizco llega al extremo de lejos (zoom 0)');
  cerca(c.estado().distancia, P.lejos.distancia, 1e-6, 'de lejos a 120 m');
  ok(c.fovBase(412 / 860) > c.fovBase(860 / 412), 'en vertical el fov se abre para ver más ciudad');
}

/* ---- seguir el rumbo: quieto no gira, la zona muerta, lo que tarda, el tope y la espera ---- */
function girando({ error, rapidez = 6, seg = 3, antes }) {
  const c = new Camara(); c.colocar({ x: 0, y: 0, z: 0, rumbo: 0 }); antes?.(c);
  const serie = []; let x = 0, z = 0;
  for (let i = 0; i < seg * 60; i++) { x += Math.sin(error) * rapidez * dt; z += Math.cos(error) * rapidez * dt; c.paso(dt, { x, y: 0, z, rumbo: error, rapidez }); serie.push(c.guinada); }
  return { c, serie };
}
{
  const { c } = girando({ error: 90 * G, rapidez: 0 });
  ok(c.guinada === 0, 'quieto, no gira');
  ok(girando({ error: 8 * G }).c.guinada === 0, 'un rumbo a 8° no la mueve (zona muerta de 12°)');
  const r = girando({ error: 20 * G });
  ok(Math.abs(angDif(r.c.guinada, 20 * G)) < P.zonaQuieta, 'a 20° sí se alinea');
  const g = girando({ error: 90 * G });
  const t5 = g.serie.findIndex(y => Math.abs(angDif(y, 90 * G)) < 5 * G) / 60;
  ok(t5 > 0.9 && t5 < 1.6, `el giro de 90° tarda lo prometido: ${t5.toFixed(2)} s (entre 0,9 y 1,6 s)`);
  let sobre = 0; for (const y of g.serie) sobre = Math.max(sobre, y - 90 * G);
  ok(sobre < 0.5 * G, 'no se pasa ni rebota (amortiguado crítico)');
  let tope = 0; for (let i = 1; i < g.serie.length; i++) tope = Math.max(tope, Math.abs(g.serie[i] - g.serie[i - 1]) / dt);
  ok(tope <= P.giroMax + 1e-9, `giro máximo respetado: ${(tope / G).toFixed(1)}°/s`);
  const m = girando({ error: 90 * G, seg: 2.4, antes: c2 => c2.girar(-0.3) });
  ok(Math.abs(m.c.guinada - -0.3) < 1e-9, 'después de tocarla espera: no sigue el rumbo durante 2,4 s');
  const m2 = girando({ error: 90 * G, seg: 4.5, antes: c2 => c2.girar(-0.3) });
  ok(Math.abs(angDif(m2.c.guinada, 90 * G)) < 3 * G, 'pasados los 2,5 s vuelve a seguir el rumbo');
  const ce = new Camara(); ce.colocar({ x: 0, y: 0, z: 0, rumbo: 0 }); ce.girar(1.2); ce.centrar();
  for (let i = 0; i < 150; i++) ce.paso(dt, { x: 0, y: 0, z: 0, rumbo: 0, rapidez: 0 });
  ok(Math.abs(angDif(ce.guinada, 0)) < P.zonaQuieta && ce.zoom === P.zoomInicial, 'centrar la devuelve detrás del jugador y a lo justo, aun quieto');
}

/* ---- el mismo giro a 30, 60 y 144 cuadros por segundo (corre en el paso fijo) ---- */
{
  const final = fps => {
    const c = new Camara(); c.colocar({ x: 0, y: 0, z: 0, rumbo: 0 }); let pasos = 0; const serie = [];
    const B = new Bucle({ actualizar: d => { pasos++; c.paso(d, { x: 0, y: 0, z: pasos * 0.1, rumbo: 90 * G, rapidez: 6 }); serie.push(c.guinada); } });
    for (let i = 0; pasos < 72; i++) B.cuadro(i * 1000 / fps);
    return serie[71];
  };
  const a = final(30), b = final(60), d = final(144);
  ok(a === b && b === d, 'el giro de la cámara es idéntico a 30, 60 y 144 fps');
}

/* ---- la carrera: a la persecución en 0,8 s y de vuelta ---- */
{
  const c = new Camara(); c.colocar({ x: 0, y: 0, z: 0, rumbo: 0 }); c.entrarCarrera();
  const o = { x: 0, y: 0, z: 0, rumbo: 0, rapidez: 9 };
  for (let i = 0; i < 47; i++) c.paso(dt, o);
  ok(c.carrera < 1, 'a los 0,78 s todavía está pasando');
  for (let i = 0; i < 2; i++) c.paso(dt, o);
  ok(c.carrera === 1, 'a los 0,82 s ya está en la persecución');
  cerca(c.estado().distancia, P.carrera.distancia, 1e-9, 'la distancia de Run Scooter'); cerca(c.estado().inclinacion / G, 8, 1e-9, 'su inclinación');
  cerca(c.fov / G, 62, 1e-9, 'su fov');
  c.salirCarrera(); for (let i = 0; i < 49; i++) c.paso(dt, o);
  ok(c.carrera === 0, 'y vuelve a la panorámica en 0,8 s');
}

/* ---- el jugador nunca sale de la pantalla, aunque la vía vaya para otro lado o la cámara no siga (lo halló la CI) ---- */
{
  const aspecto = 412 / 860;
  for (const giro of [Math.PI / 2, Math.PI, -2.2, 2.6]) {
    const c = new Camara({ aspecto }); c.colocar({ x: 0, y: 0, z: 0, rumbo: 0 }); c.entrarCarrera(); let x = 0, z = 0, fuera = 0;
    for (let i = 0; i < 120; i++) { const v = Math.min(9, i * dt * 5); x += Math.sin(giro) * v * dt; z += Math.cos(giro) * v * dt; c.paso(dt, { x, y: 0, z, rumbo: giro, rapidez: v, rumboVia: giro }); const p = proyectar(c.pose(1), { x, y: 0.9, z }, aspecto); if (!(p.prof > 0 && Math.abs(p.x) < 0.95 && Math.abs(p.y) < 0.95)) fuera++; }
    ok(fuera === 0, `al entrar a una carrera que va a ${(giro / G).toFixed(0)}° de la cámara, el jugador sigue en la pantalla (${fuera})`);
  }
  for (const zoom of [0, 0.36, 1]) {
    const c = new Camara({ aspecto }); c.fijarZoom(zoom); c.colocar({ x: 0, y: 0, z: 0, rumbo: 0 }); let x = 0, fuera = 0;
    for (let i = 0; i < 150; i++) { x -= 12 * dt; c.paso(dt, { x, y: 0, z: 0, rumbo: -Math.PI / 2, rapidez: 12 }); if (i < 140) c.girar(0); const p = proyectar(c.pose(1), { x, y: 0.9, z: 0 }, aspecto); if (!(p.prof > 0 && Math.abs(p.x) < 0.95 && Math.abs(p.y) < 0.95)) fuera++; }
    ok(fuera === 0, `corriendo de lado a 12 m/s sin que la cámara lo siga (zoom ${zoom}), sigue en la pantalla (${fuera})`);
  }
}

/* ---- la velocidad se siente, sin marear ---- */
{
  const fovA = v => { const c = new Camara(); c.colocar({ x: 0, y: 0, z: 0, rumbo: 0 }); c.paso(dt, { x: 0, y: 0, z: 0, rumbo: 0, rapidez: v }); return c; };
  ok(fovA(12).fov > fovA(0).fov && fovA(12).estado().distancia > fovA(0).estado().distancia, 'al ir rápido se abre un poco');
  const q = new Camara(); q.menosMovimiento = true; q.colocar({ x: 0, y: 0, z: 0, rumbo: 0 }); q.paso(dt, { x: 0, y: 0, z: 0, rumbo: 0, rapidez: 12 });
  cerca(q.fov, fovA(0).fov, 1e-12, 'con «menos movimiento» no se abre');
}

/* ---- la ciudad: nunca dentro de un edificio y el jugador siempre se ve ---- */
{
  const O = ciudad(), aspecto = 412 / 860, c = new Camara({ colisiones: O, aspecto });
  let s = 99; const azar = () => (s = (s * 48271) % 2147483647) / 2147483647;
  /* el jugador va por las calles (x o z múltiplo de 56) y gira en las esquinas; la cámara se toca a ratos */
  let x = 0, z = 0, rumbo = 0, rapidez = 0, dentro = 0, fuera = 0, tapadoSinAviso = 0, tapados = 0, subio = 0, lente = 0, pasos = 0;
  c.colocar({ x, y: 0, z, rumbo });
  for (let i = 0; i < 60 * 90; i++) {
    rapidez = Math.min(11, rapidez + 6 * dt);
    const nx = x + Math.sin(rumbo) * rapidez * dt, nz = z + Math.cos(rumbo) * rapidez * dt;
    const esquina = (a, b) => Math.floor(a / 56) !== Math.floor(b / 56);
    if (esquina(x, nx) || esquina(z, nz)) { x = Math.round(nx / 56) * 56; z = Math.round(nz / 56) * 56; rumbo = Math.round(rumbo / (Math.PI / 2)) * (Math.PI / 2) + (azar() < 0.5 ? 1 : -1) * Math.PI / 2 * (azar() < 0.7 ? 1 : 0); }
    else { x = nx; z = nz; }
    if (i % 400 === 0) c.girar((azar() - 0.5) * 3);
    if (i % 700 === 0) c.acercar((azar() - 0.4) * 0.9);
    if (i % 900 === 0) c.inclinar((azar() - 0.5) * 0.6);
    c.paso(dt, { x, y: 0, z, rumbo, rapidez });
    if (O.contiene(c.ojo, 0) !== null) dentro++;
    if (c.subida > 1e-3) subio++;
    const pr = proyectar(c.pose(1), { x, y: 0.9, z }, aspecto);
    if (!(pr.prof > 0 && Math.abs(pr.x) < 0.98 && Math.abs(pr.y) < 0.98)) fuera++;
    const tapa = O.rayo(c.ojo, { x, y: 1.5, z }); if (tapa) { tapados++; if (!c.oclusion.activa) tapadoSinAviso++; }
    const desdeCabeza = O.rayo({ x, y: 1.5, z }, c.ojo); if (desdeCabeza && desdeCabeza.t > P.tapaCerca) lente++; pasos++;
  }
  ok(dentro === 0, `90 s por la ciudad con giros, zoom e inclinación: la cámara nunca quedó dentro de un edificio (${dentro})`);
  ok(fuera === 0, `el jugador siempre quedó en la pantalla (${fuera} cuadros fuera)`);
  ok(tapadoSinAviso === 0, `cuando un edificio lo tapa (${tapados} pasos), siempre se marca para volverlo transparente`);
  ok(subio > 0, `cerca de las torres la cámara sube para no perder la panorámica (${subio} pasos)`);
  ok(lente / pasos < 0.01, `casi nunca una pared contra el lente: ${lente} de ${pasos} pasos (solo mientras el resorte llega)`);
}

/* ---- pegado a una torre: sube; si no alcanza, el brazo se encoge, y nunca entra ---- */
{
  const O = new Obstaculos(); O.agregar({ id: 'torre', huella: [[-30, -40], [30, -40], [30, -6], [-30, -6]], base_m: 0, altura_m: 31 });
  const c = new Camara({ colisiones: O }); c.colocar({ x: 0, y: 0, z: 0, rumbo: 0 });
  for (let i = 0; i < 60; i++) c.paso(dt, { x: 0, y: 0, z: 0, rumbo: 0, rapidez: 0 });
  ok(c.subida > 0 && c.brazo > 0.99 && O.contiene(c.ojo, 0) === null, 'una torre de 31 m detrás: la cámara pasa por encima sin encogerse');
  const O2 = new Obstaculos(); O2.agregar({ id: 'muro', huella: [[-60, -80], [60, -80], [60, -3], [-60, -3]], base_m: 0, altura_m: 200 });
  const c2 = new Camara({ colisiones: O2 }); c2.colocar({ x: 0, y: 0, z: 0, rumbo: 0 });
  for (let i = 0; i < 60; i++) c2.paso(dt, { x: 0, y: 0, z: 0, rumbo: 0, rapidez: 0 });
  ok(c2.brazo < 0.5 && O2.contiene(c2.ojo, 0) === null, `un muro de 200 m: el brazo se encoge (${c2.brazo.toFixed(2)}) y no entra`);
  c2.colisiones = new Obstaculos(); let antes = c2.brazo; for (let i = 0; i < 6; i++) c2.paso(dt, { x: 0, y: 0, z: 0, rumbo: 0, rapidez: 0 });
  ok(c2.brazo > antes && c2.brazo < 0.9, 'al despejarse el brazo se estira despacio (resorte)');
}

/* ---- no tiembla: a velocidad constante y con cuadros irregulares, el jugador queda quieto en la pantalla ---- */
{
  const c = new Camara(), aspecto = 412 / 860; let x = 0, z = 0, xa = 0, za = 0; const v = 9, rumbo = 30 * G;
  c.colocar({ x, y: 0, z, rumbo }); let i = 0; const pantalla = [];
  const B = new Bucle({
    actualizar: d => { xa = x; za = z; x += Math.sin(rumbo) * v * d; z += Math.cos(rumbo) * v * d; c.paso(d, { x, y: 0, z, rumbo, rapidez: v }); },
    dibujar: alfa => { const px = xa + (x - xa) * alfa, pz = za + (z - za) * alfa; pantalla.push(proyectar(c.pose(alfa), { x: px, y: 0.9, z: pz }, aspecto)); }
  });
  let t = 0; while (t < 6000) { B.cuadro(t); t += [8, 25, 16.7, 33, 11][i++ % 5]; }
  const estable = pantalla.slice(Math.floor(pantalla.length * 0.6));
  let salto = 0; for (let k = 1; k < estable.length; k++) salto = Math.max(salto, Math.hypot(estable[k].x - estable[k - 1].x, estable[k].y - estable[k - 1].y));
  ok(salto < 1e-3, `no tiembla: con cuadros de 8 a 33 ms el jugador se mueve ${salto.toExponential(1)} en la pantalla entre cuadros`);
}

console.log(`✓ la cámara única (§ 5): ${n} pruebas`);
