/* =====================================================================
   MOTOR 3D v6 · BUCLE PRINCIPAL (60 Hz FIJO), CONTROLES Y HUD LIMPIO
   - Paso fijo de física 60 Hz (sin saltos ni dependencia de FPS).
   - Controles táctiles (joystick izquierdo + cámara libre derecha + pellizco)
     y teclado (WASD/Flechas, Espacio saltar, F truco/slide, Q/E rotar,
     rueda o C zoom, Tab cambiar Skate/Parkour/EnCicla).
   - HUD mínimo limpio (5 controles claros, cero solapamientos, vertical y horizontal).
   ===================================================================== */

import * as THREE from '../../js/vendor/three-0.170.0.module.min.js';
import { BancoTexturas } from './texturas.js';
import { Terreno3D } from './terreno.js';
import { CamaraCenitalInteligente } from './camara.js';
import { Skatepark3D } from './skatepark.js';
import { PersonajeController } from './personaje.js';
import { MundoEfectoGTA } from './mundo.js';
import { Bucle, mezclar } from './nucleo/bucle.js';

const $ = (s) => document.querySelector(s);

async function cargarHero() {
  try {
    const r = await fetch('./datos/hero-4sur.json');
    if (r.ok) return await r.json();
  } catch (_) { /* modo file:// usa respaldo determinista */ }
  return null;
}

async function iniciar() {
  const cv = $('#cv');
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const escena = new THREE.Scene();
  escena.background = new THREE.Color('#8ec5e8');
  escena.fog = new THREE.Fog('#b9d6e8', 180, 720);

  // Iluminación cálida de tarde en Medellín (sol direccional con sombras reales + luz hemisférica del valle)
  const hemi = new THREE.HemisphereLight('#d8eeff', '#7a6448', 0.85);
  escena.add(hemi);

  const sol = new THREE.DirectionalLight('#fff0d2', 2.1);
  sol.position.set(110, 145, 75);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  sol.shadow.camera.near = 20;
  sol.shadow.camera.far = 360;
  const sBox = 95;
  sol.shadow.camera.left = -sBox; sol.shadow.camera.right = sBox;
  sol.shadow.camera.top = sBox; sol.shadow.camera.bottom = -sBox;
  sol.shadow.bias = -0.0005;
  escena.add(sol);
  escena.add(sol.target);

  const datosHero = await cargarHero();
  const bancoTex = new BancoTexturas(renderer, './arte/texturas/');

  // 1. Topografía 3D real
  const terreno = new Terreno3D(datosHero);
  escena.add(terreno.crearMalla(bancoTex));

  // 2. Skatepark 3D real bajo el Puente de la 4 Sur
  const skatepark = new Skatepark3D(4, 0, terreno.nivelPlaza);
  escena.add(skatepark.construir(bancoTex));

  // 3. Mundo híbrido «Efecto GTA» (Zona Hero fiel + resto genérico InstancedMesh + fila escala SI)
  const mundo = new MundoEfectoGTA(terreno, bancoTex);
  escena.add(mundo.construir(datosHero));

  // 4. Cámara cenital única inteligente (auto-seguimiento gradual + libre + zoom 72°→34°)
  const threeCam = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.3, 1400);
  const camara = new CamaraCenitalInteligente(threeCam, { terreno, colisiones: mundo.colisiones });

  // 5. Personaje 1,72 m (Parkour + Skate + Bici EnCicla)
  const avisoEl = $('#aviso');
  let avisoTimer = 0;
  const mostrarAviso = (txt, seg = 2.4) => {
    avisoEl.textContent = txt;
    avisoEl.classList.add('on');
    avisoTimer = seg;
  };

  const jugador = new PersonajeController({
    terreno,
    skatepark,
    colisiones: mundo.colisiones,
    alEvento: (tipo, d) => {
      if (tipo === 'truco') {
        mostrarAviso(`${d.nombre} +${d.pts}${d.combo > 1 ? ` · ×${d.combo}` : ''}`, 1.8);
      } else if (tipo === 'parada') {
        mostrarAviso(`★ ¡${d.titulo} completada! (+500)`, 3.2);
      } else if (tipo === 'modo') {
        const nom = d.modo === 'skate' ? '🛹 Skate' : d.modo === 'bici' ? '🚲 EnCicla' : '🏃 Parkour';
        $('#bModo').textContent = nom;
        mostrarAviso(`Modo: ${nom}`, 1.5);
      }
    },
  });
  escena.add(jugador.mesh);

  // ---------- ENTRADA: TECLADO + TÁCTIL (JOYSTICK IZQUIERDO + CÁMARA DERECHA + PELLIZCO) ----------
  const keys = new Set();
  let bucle;
  const limpiarEntrada = () => { keys.clear(); joy.id = null; joy.x = 0; joy.y = 0; joyKnob.style.transform = 'translate(0px, 0px)'; dedos.clear(); camDrag.id = null; pinchDist0 = 0; };
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab'].includes(e.code)) e.preventDefault();
    if (e.code === 'Escape' || e.code === 'KeyP') { if (!e.repeat) cambiarPausa(); return; }
    if (bucle?.pausado) return;
    keys.add(e.code);
    if (e.code === 'Space') { e.preventDefault(); jugador.pedirSalto(); }
    else if (e.code === 'KeyF' || e.code === 'KeyK') jugador.pedirTrucoOAccion();
    else if (e.code === 'KeyC') { const p = camara.siguienteAcercamiento(); mostrarAviso(`🔍 ${p.nombre}`, 1.6); }
    else if (e.code === 'Tab') { e.preventDefault(); jugador.ciclarModo(); }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));

  // Rueda del ratón: acercar / alejar continuamente
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    camara.ajustarZoom(e.deltaY < 0 ? 0.09 : -0.09);
  }, { passive: false });

  // Arrastre de cámara + pellizco (multitouch seguro con pointerId)
  const joy = { id: null, x0: 0, y0: 0, x: 0, y: 0 };
  const camDrag = { id: null, x: 0, y: 0 };
  const dedos = new Map();
  let pinchDist0 = 0;

  const joyEl = $('#joy');
  const joyKnob = $('#joyKnob');

  joyEl.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (bucle?.pausado) return;
    joyEl.setPointerCapture(e.pointerId);
    const r = joyEl.getBoundingClientRect();
    joy.id = e.pointerId;
    joy.x0 = r.left + r.width / 2;
    joy.y0 = r.top + r.height / 2;
    actualizarJoy(e.clientX, e.clientY);
  });
  joyEl.addEventListener('pointermove', (e) => {
    if (e.pointerId !== joy.id) return;
    actualizarJoy(e.clientX, e.clientY);
  });
  const soltarJoy = (e) => {
    if (e.pointerId !== joy.id) return;
    joy.id = null; joy.x = 0; joy.y = 0;
    joyKnob.style.transform = 'translate(0px, 0px)';
  };
  joyEl.addEventListener('pointerup', soltarJoy);
  joyEl.addEventListener('pointercancel', soltarJoy);

  function actualizarJoy(cx, cy) {
    const maxR = 42;
    const dx = cx - joy.x0, dy = cy - joy.y0;
    const d = Math.hypot(dx, dy);
    const k = d > maxR ? maxR / d : 1;
    joyKnob.style.transform = `translate(${(dx * k).toFixed(1)}px, ${(dy * k).toFixed(1)}px)`;
    joy.x = (dx * k) / maxR;
    joy.y = -(dy * k) / maxR; // arriba en pantalla = +1 adelante
  }

  cv.addEventListener('pointerdown', (e) => {
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dedos.size === 1) {
      camDrag.id = e.pointerId; camDrag.x = e.clientX; camDrag.y = e.clientY;
    } else if (dedos.size === 2) {
      const [a, b] = [...dedos.values()];
      pinchDist0 = Math.hypot(a.x - b.x, a.y - b.y);
      camDrag.id = null;
    }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!dedos.has(e.pointerId)) return;
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dedos.size === 2) {
      const [a, b] = [...dedos.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist0 > 10) camara.ajustarZoom((d - pinchDist0) * 0.004);
      pinchDist0 = d;
    } else if (e.pointerId === camDrag.id) {
      const dx = e.clientX - camDrag.x;
      const dy = e.clientY - camDrag.y;
      camDrag.x = e.clientX; camDrag.y = e.clientY;
      camara.orbitarManual(-dx * 0.007, dy * 0.004);
    }
  });
  const soltarDedo = (e) => {
    dedos.delete(e.pointerId);
    if (e.pointerId === camDrag.id) camDrag.id = null;
    if (dedos.size < 2) pinchDist0 = 0;
  };
  cv.addEventListener('pointerup', soltarDedo);
  cv.addEventListener('pointercancel', soltarDedo);

  // Botones mínimos del HUD
  $('#bModo').onclick = () => jugador.ciclarModo();
  $('#bZoom').onclick = () => { const p = camara.siguienteAcercamiento(); mostrarAviso(`🔍 ${p.nombre}`, 1.6); };
  function cambiarPausa(forzar) {
    if (!bucle) return;
    const pausa = forzar ?? !bucle.pausado;
    limpiarEntrada();
    if (pausa) { bucle.pausar(); jugador.mesh.position.copy(jugador.pos); }
    else { anterior.copy(jugador.pos); bucle.reanudar(); }
    $('#bPausa').textContent = pausa ? 'Continuar' : 'Pausa';
    $('#bPausa').setAttribute('aria-pressed', String(pausa));
    $('#bModo').disabled = pausa; $('#bSalto').disabled = pausa; $('#bTruco').disabled = pausa;
    mostrarAviso(pausa ? 'Juego en pausa' : 'Continúa explorando', 1.6);
  }
  $('#bPausa').onclick = () => cambiarPausa();
  window.addEventListener('blur', () => cambiarPausa(true));
  document.addEventListener('visibilitychange', () => { if(document.hidden) cambiarPausa(true); });
  $('#bSalto').onclick = () => jugador.pedirSalto();
  $('#bTruco').onclick = () => jugador.pedirTrucoOAccion();

  // Recomendación automática vertical / horizontal (P10!)
  const actualizarOrientacion = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    threeCam.aspect = window.innerWidth / window.innerHeight;
    threeCam.updateProjectionMatrix();
    const horiz = window.innerWidth > window.innerHeight;
    document.body.classList.toggle('horiz', horiz);
  };
  window.addEventListener('resize', actualizarOrientacion);
  actualizarOrientacion();

  // Exponer telemetría limpia para pruebas automatizadas (sin hacks)
  window.MOTOR_V6 = {
    terreno, camara, skatepark, jugador, mundo,
    estado: () => ({
      pos: { x: +jugador.pos.x.toFixed(2), y: +jugador.pos.y.toFixed(2), z: +jugador.pos.z.toFixed(2) },
      modo: jugador.modo,
      estado: jugador.estado,
      camYaw: +camara.yaw.toFixed(3),
      camZoom: +camara.zoom.toFixed(2),
      puntaje: jugador.puntaje,
      combo: jugador.combo,
      paradasHechas: skatepark.paradas.filter((p) => p.completada).length,
      stats: mundo.stats,
      pausa: bucle?.pausado ?? false,
      pasos: bucle?.pasos ?? 0,
      tiempoJuego: bucle?.t ?? 0,
      descartado: bucle?.descartado ?? 0,
    }),
  };

  // ---------- BUCLE DE PASO FIJO 60 Hz ----------
  let hudT = 0;
  const anterior = jugador.pos.clone();

  function leerEntrada() {
    let mx = joy.x;
    let my = joy.y;
    if (keys.has('KeyW') || keys.has('ArrowUp')) my += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) my -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
    if (keys.has('KeyQ')) camara.orbitarManual(0.035, 0);
    if (keys.has('KeyE')) camara.orbitarManual(-0.035, 0);
    return {
      moverX: Math.max(-1, Math.min(1, mx)),
      moverY: Math.max(-1, Math.min(1, my)),
      sprint: keys.has('ShiftLeft') || keys.has('ShiftRight') || Math.hypot(mx, my) > 0.85,
    };
  }

  function paso(dt) {
    anterior.copy(jugador.pos);
    const entrada = leerEntrada();
    jugador.paso(dt, entrada, camara.getMoveBasis());
    mundo.actualizar(dt);
    camara.actualizar(dt, {
      pos: jugador.pos, vel: jugador.vel,
      rumbo: jugador.rumbo, rapidez: jugador.rapidezHorizontal(),
    });
  }

  function dibujar(alfa, dtReal) {
    if (!bucle.pausado) jugador.mesh.position.set(
      mezclar(anterior.x, jugador.pos.x, alfa),
      mezclar(anterior.y, jugador.pos.y, alfa),
      mezclar(anterior.z, jugador.pos.z, alfa));
    else jugador.mesh.position.copy(jugador.pos);

    // Mover la caja de sombras del sol siguiendo al jugador (sombras siempre nítidas)
    sol.position.set(jugador.pos.x + 75, jugador.pos.y + 110, jugador.pos.z + 55);
    sol.target.position.copy(jugador.pos);

    renderer.render(escena, threeCam);

    if (avisoTimer > 0) {
      avisoTimer -= dtReal;
      if (avisoTimer <= 0) avisoEl.classList.remove('on');
    }

    // Actualización diferencial del HUD (6 Hz, cero reflows)
    hudT += dtReal;
    if (hudT >= 0.16) {
      hudT = 0;
      const kmh = Math.round(jugador.rapidezHorizontal() * 3.6);
      const cota = Math.round(terreno.cotaBase + jugador.pos.y);
      const pend = Math.round(terreno.getSlopePct(jugador.pos.x, jugador.pos.z));
      const pHechas = skatepark.paradas.filter((p) => p.completada).length;
      $('#chipVel').textContent = `${kmh} km/h · ${cota} msnm (${pend}%)`;
      $('#chipPts').textContent = `★ ${jugador.puntaje + jugador.comboPuntos} · Paradas ${pHechas}/3`;
    }
  }

  mostrarAviso('Puente 4 Sur · Arrastra para moverte · La cámara te sigue gradualmente', 3.5);
  bucle = new Bucle({ actualizar: paso, dibujar });
  bucle.iniciar();
}

iniciar();
