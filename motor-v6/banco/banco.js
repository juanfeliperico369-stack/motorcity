/* Motor City 6 · banco/banco.js — el banco de pruebas de la cámara y los controles (datos sintéticos, no es un juego).
   Una ciudad de manzanas de 56 m con torres de 8 a 46 m, fusionadas por grupos como los lotes de los sectores, y en la
   salida una persona, una bici, un carro y un bus para ver la diferencia de tamaños. Usa las piezas reales del motor:
   el bucle fijo, la cámara única, la palanca y los gestos, la física arcade y la transparencia de lo que tapa.
   Las pruebas de navegador (tests/banco-navegador.mjs) lo juegan con toques reales y leen window.MC6_BANCO.estado(). */
import * as THREE from '../src/render/three.js';
import { Bucle, mezclar } from '../src/nucleo/bucle.js';
import { Camara } from '../src/camara/camara.js';
import { aplicarPose } from '../src/camara/three.js';
import { Obstaculos, proyectar } from '../src/camara/geometria.js';
import { crearOclusion } from '../src/render/oclusion.js';
import { Controles } from '../src/entrada/controles.js';
import { ajustesControl } from '../src/entrada/preferencias.js';
import { ESQUEMAS } from '../src/entrada/esquemas.js';
import { moverArcade, perfilMovimiento } from '../src/fisica/arcade.js';
import { guardian } from '../src/sonido/guardian.js';

const $ = id => document.getElementById(id);
const azar = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
guardian();

/* ---- la escena ---- */
const renderer = new THREE.WebGLRenderer({ canvas: $('cv'), antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(1.5, devicePixelRatio || 1));
const escena = new THREE.Scene(); escena.background = new THREE.Color(0x9cc6d6); escena.fog = new THREE.Fog(0x9cc6d6, 280, 950);
escena.add(new THREE.HemisphereLight(0xfff6df, 0x6f7f86, 2.3));
const sol = new THREE.DirectionalLight(0xffecd1, 2.1); sol.position.set(120, 180, 60); escena.add(sol);
const plano = (w, l, color, y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshLambertMaterial({ color })); m.rotation.x = -Math.PI / 2; m.position.y = y; return m; };
escena.add(plano(1800, 1800, 0x8fa874, 0));
for (let i = -7; i <= 7; i++) {
  const a = plano(16, 840, 0x50565d, 0.02); a.position.x = i * 56; escena.add(a);
  const b = plano(840, 16, 0x50565d, 0.021); b.position.z = i * 56; escena.add(b);
}
const ciclo = plano(2.4, 840, 0xe76f51, 0.04); ciclo.position.x = 5.2; escena.add(ciclo);   // la ciclorruta coral de la calle x = 0

/* ---- los edificios: fusionados por grupos de 3 × 3 manzanas, con la transparencia ---- */
const obst = new Obstaculos(), oc = crearOclusion(THREE);
const material = oc.aplicar(new THREE.MeshLambertMaterial({ vertexColors: true }));
const paleta = [0xe9d8b8, 0xd9a066, 0xc96f53, 0x9fb6c9, 0xf2e6cf, 0x7fa38a, 0xb9c4cc].map(c => new THREE.Color(c));
function caja(dst, x0, z0, w, d, h, color) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); g.translate(x0 + w / 2, h / 2, z0 + d / 2);
  const p = g.attributes.position.array, nn = g.attributes.normal.array;
  for (let i = 0; i < p.length; i += 3) { dst.p.push(p[i], p[i + 1], p[i + 2]); dst.n.push(nn[i], nn[i + 1], nn[i + 2]); const k = nn[i + 1] > 0.5 ? 1.08 : nn[i] !== 0 ? 0.92 : 1; dst.c.push(color.r * k, color.g * k, color.b * k); }
  g.dispose();
}
for (let gi = -2; gi <= 2; gi++) for (let gj = -2; gj <= 2; gj++) {
  const dst = { p: [], n: [], c: [] };
  for (let i = gi * 3 - 1; i <= gi * 3 + 1; i++) for (let j = gj * 3 - 1; j <= gj * 3 + 1; j++) {
    if (Math.abs(i) > 6 || Math.abs(j) > 6) continue;
    const x0 = i * 56 + 8, z0 = j * 56 + 8;
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const bx = x0 + a * 20 + 1, bz = z0 + b * 20 + 1, w = 16 + azar() * 2, h = 8 + azar() * 38, color = paleta[Math.floor(azar() * paleta.length)];
      caja(dst, bx, bz, w, w, h, color);
      obst.agregar({ id: `${i},${j},${a},${b}`, huella: [[bx, bz], [bx + w, bz], [bx + w, bz + w], [bx, bz + w]], base_m: 0, altura_m: h });
    }
  }
  if (!dst.p.length) continue;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(dst.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(dst.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(dst.c, 3));
  g.computeBoundingSphere();
  const m = new THREE.Mesh(g, material); escena.add(m); oc.fantasma(m);
}

/* ---- la diferencia de tamaños, a escala real (motor-v6/src/nucleo/escala.js): persona, bici, carro y bus ---- */
const mat = c => new THREE.MeshLambertMaterial({ color: c });
function persona(color = 0x2f6fb0) {
  const g = new THREE.Group();
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.62, 8), mat(color)); cuerpo.position.y = 1.15;
  const piernas = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.84, 0.22), mat(0x2b3440)); piernas.position.y = 0.42;
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat(0xc58c5c)); cabeza.position.y = 1.6;
  g.add(cuerpo, piernas, cabeza); return g;
}
function bici() { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 1.78), mat(0x1f8a5b)); c.position.y = 0.55; const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.04, 6, 14), mat(0x222222)); r1.rotation.y = Math.PI / 2; r1.position.set(0, 0.33, 0.55); const r2 = r1.clone(); r2.position.z = -0.55; g.add(c, r1, r2); return g; }
function vehiculo(l, a, h, color) { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.BoxGeometry(a, h * 0.62, l), mat(color)); c.position.y = h * 0.31 + 0.25; const t = new THREE.Mesh(new THREE.BoxGeometry(a * 0.9, h * 0.38, l * 0.55), mat(0xcfe3ec)); t.position.set(0, h * 0.62 + 0.25 + h * 0.19 - 0.05, -l * 0.05); g.add(c, t); return g; }
const fila = [[persona(0xd9534f), -6.5, 14], [bici(), -6.5, 17], [vehiculo(4.35, 1.78, 1.46, 0xe8c547), -6.5, 22], [vehiculo(10.8, 2.5, 3.1, 0x3d8fbf), -6.5, 32]];
for (const [o, x, z] of fila) { o.position.set(x, 0, z); escena.add(o); }

/* ---- el jugador ---- */
const MODOS = [
  { id: 'caminar', nombre: 'A pie', icono: '🚶', tipo: 'caminar', aPie: true },
  { id: 'correr', nombre: 'Corriendo', icono: '🏃', tipo: 'correr', aPie: true },
  { id: 'bici', nombre: 'Bici', icono: '🚲', tipo: 'ciclo', aPie: false, modelo: bici },
  { id: 'auto', nombre: 'Auto', icono: '🚗', tipo: 'motor', aPie: false, vmax: 13, modelo: () => vehiculo(4.35, 1.78, 1.46, 0xf2f2f2) },
];
let modo = 0;
const avatar = new THREE.Group(); const cuerpoJ = persona(); avatar.add(cuerpoJ); let montura = null; escena.add(avatar);
const perfil = () => { const M = MODOS[modo]; return perfilMovimiento(M.tipo, M.vmax ? { velocidadMax: M.vmax } : {}); };
let estado = { x: 0, z: 0, rumbo: 0, velocidad: 0, w: 0 }, anterior = { ...estado }, carrera = false, choques = 0;
function ponerModo(i) {
  modo = i; const M = MODOS[modo];
  if (montura) { avatar.remove(montura); montura = null; }
  if (M.modelo) { montura = M.modelo(); avatar.add(montura); }
  cuerpoJ.visible = M.id !== 'auto'; cuerpoJ.position.y = M.id === 'bici' ? 0.45 : 0;
  estado.velocidad = Math.min(estado.velocidad, perfil().velocidadMax);
  $('modo').textContent = M.nombre; $('vehiculo').textContent = MODOS[(modo + 1) % MODOS.length].icono;
}

/* ---- la cámara y los controles ---- */
const threeCam = new THREE.PerspectiveCamera(50, 1, 0.3, 2000);
const cam = new Camara({ colisiones: obst, aspecto: innerWidth / innerHeight });
const ajustes = ajustesControl({ clave: 'mc6-banco.controles' });
const aviso = (texto, aplicar) => { $('avisoTexto').textContent = texto; $('aviso').hidden = false; $('avisoSi').onclick = () => { aplicar(); $('aviso').hidden = true; pintarAjustes(); }; $('avisoNo').onclick = () => { $('aviso').hidden = true; }; };
const controles = new Controles({ superficie: $('cv'), camara: cam, ajustes, alRecomendar: (r, aplicar) => aviso(r.texto, aplicar), alPulsar: codigo => { if (codigo === 'KeyP' || codigo === 'Escape') pausar(); else if (codigo === 'KeyV') ponerModo((modo + 1) % MODOS.length); else if (codigo === 'KeyR') alternarCarrera(); } });
const objetivo = () => ({ x: estado.x, y: 0, z: estado.z, rumbo: estado.rumbo, rapidez: estado.velocidad, rumboVia: carrera ? 0 : undefined });
cam.colocar(objetivo());
function medir() { renderer.setSize(innerWidth, innerHeight, false); cam.aspecto = innerWidth / innerHeight; threeCam.aspect = cam.aspecto; threeCam.updateProjectionMatrix(); }
addEventListener('resize', medir); medir();

/* ---- el paso fijo ---- */
const libre = (x, z) => obst.contiene({ x, y: 0.9, z }, 0.35) === null;
function paso(dt) {
  anterior = { ...estado };
  const c = controles.paso(dt, { aPie: MODOS[modo].aPie });
  if (carrera) {                                                  // la carrera de prueba: recto por la ciclorruta
    const v = Math.min(9, estado.velocidad + 9 / 1.8 * dt);
    estado = { ...estado, x: mezclar(estado.x, 5.2, 1 - Math.exp(-dt * 6)), z: estado.z + v * dt, rumbo: 0, velocidad: v, w: 0 };
  } else {
    const P = MODOS[modo].id === 'caminar' && c.correr ? perfilMovimiento('correr') : perfil();   // Mayús corre
    const nuevo = moverArcade(estado, c.mover, dt, P);
    if (libre(nuevo.x, nuevo.z)) estado = nuevo;
    else if (libre(nuevo.x, estado.z)) estado = { ...nuevo, z: estado.z, velocidad: nuevo.velocidad * 0.7 };   // se desliza por la pared
    else if (libre(estado.x, nuevo.z)) estado = { ...nuevo, x: estado.x, velocidad: nuevo.velocidad * 0.7 };
    else { estado = { ...estado, velocidad: 0, rumbo: nuevo.rumbo, w: nuevo.w }; choques++; }
  }
  cam.paso(dt, objetivo());
}

/* ---- el dibujo, con las medidas honestas de cada cuadro ---- */
const med = { cuadros: 0, dentro: 0, fuera: 0, tapado: 0, tiempos: [], ultimo: 0 };
function dibujar(alfa) {
  const x = mezclar(anterior.x, estado.x, alfa), z = mezclar(anterior.z, estado.z, alfa);
  avatar.position.set(x, 0, z); avatar.rotation.y = estado.rumbo;
  const pose = cam.pose(alfa); aplicarPose(threeCam, pose); oc.actualizar(pose.oclusion);
  renderer.render(escena, threeCam);
  med.cuadros++;
  if (obst.contiene(pose.ojo, 0) !== null) med.dentro++;
  const pr = proyectar(pose, { x, y: 0.9, z }, cam.aspecto); if (!(pr.prof > 0 && Math.abs(pr.x) < 1 && Math.abs(pr.y) < 1)) med.fuera++;
  if (pose.oclusion.activa) med.tapado++;
  const ahora = performance.now(); if (med.ultimo) { med.tiempos.push(ahora - med.ultimo); if (med.tiempos.length > 600) med.tiempos.shift(); } med.ultimo = ahora;
  $('vel').textContent = `${Math.round(estado.velocidad * 3.6)} km/h · cámara a ${Math.round(cam.estado().distancia)} m`;
}
const bucle = new Bucle({ actualizar: paso, dibujar });
let pausa = false;
function pausar(si = !pausa) { pausa = si; if (pausa) bucle.pausar(); else bucle.reanudar(); controles.pausar(pausa); $('pausa').setAttribute('aria-pressed', String(pausa)); $('pausa').textContent = pausa ? '▶' : '❚❚'; $('velo').hidden = !pausa; }
function alternarCarrera() { carrera = !carrera; if (carrera) { cam.entrarCarrera(); estado = { ...estado, x: 5.2, rumbo: 0 }; } else cam.salirCarrera(); $('carrera').setAttribute('aria-pressed', String(carrera)); }
$('pausa').onclick = () => pausar(); $('centrar').onclick = () => cam.centrar(); $('vehiculo').onclick = () => ponerModo((modo + 1) % MODOS.length); $('carrera').onclick = alternarCarrera;
addEventListener('blur', () => pausar(true)); document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(true); });

/* ---- los ajustes ---- */
function pintarAjustes() {
  const v = ajustes.valores;
  $('pModo').textContent = 'Palanca: ' + v.palanca.modo; $('pLado').textContent = 'Mano: ' + v.palanca.lado; $('pEsquema').textContent = 'Esquema: ' + v.esquemaVehiculo;
  $('pSeguir').setAttribute('aria-pressed', String(v.camara.seguirRumbo)); $('pMovimiento').setAttribute('aria-pressed', String(v.camara.menosMovimiento));
}
const cambiar = p => { ajustes.cambiar(p); controles.aplicarAjustes(); pintarAjustes(); };
$('ajustes').onclick = () => { $('panel').hidden = !$('panel').hidden; controles.limpiar(); pintarAjustes(); };
$('pCerrar').onclick = () => { $('panel').hidden = true; };
$('pModo').onclick = () => cambiar({ palanca: { modo: ajustes.valores.palanca.modo === 'fija' ? 'flotante' : 'fija' } });
$('pLado').onclick = () => cambiar({ palanca: { lado: ajustes.valores.palanca.lado === 'izquierda' ? 'derecha' : 'izquierda' } });
$('pMenos').onclick = () => cambiar({ palanca: { tamano: ajustes.valores.palanca.tamano - 0.1 } });
$('pMas').onclick = () => cambiar({ palanca: { tamano: ajustes.valores.palanca.tamano + 0.1 } });
$('pEsquema').onclick = () => { const e = ESQUEMAS[(ESQUEMAS.indexOf(ajustes.valores.esquemaVehiculo) + 1) % ESQUEMAS.length]; cambiar({ esquemaVehiculo: e }); };   // directo → manubrio → avanza
$('pSeguir').onclick = () => cambiar({ camara: { seguirRumbo: !ajustes.valores.camara.seguirRumbo } });
$('pMovimiento').onclick = () => cambiar({ camara: { menosMovimiento: !ajustes.valores.camara.menosMovimiento } });
ponerModo(0); pintarAjustes();

window.MC6_BANCO = {
  listo: true,
  estado: () => ({ ...estado, modo: MODOS[modo].id, carrera, pausa, pasos: bucle.pasos, choques, camara: cam.estado(), palanca: controles.tactil.vector(), activaPalanca: controles.tactil.palanca.activa,
    medidas: { cuadros: med.cuadros, dentro: med.dentro, fuera: med.fuera, tapado: med.tapado, fantasmas: oc.fantasmas }, ajustes: ajustes.valores, drawCalls: renderer.info.render.calls }),
  tiempos: () => [...med.tiempos],
  reiniciarMedidas: () => { med.cuadros = med.dentro = med.fuera = med.tapado = 0; med.tiempos = []; med.ultimo = 0; },
};
bucle.iniciar();
