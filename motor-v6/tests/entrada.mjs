/* Pruebas de la entrada (plan § 5: palanca fija o flotante, personalizable; la cámara a gusto; la recomendación al girar).
   Uso: node motor-v6/tests/entrada.mjs. Con toques reales sobre la lógica (empezar, mover, terminar), sin atajos. */
import assert from 'node:assert/strict';
import { Palanca, normalizarPreferencias } from '../src/entrada/palanca.js';
import { Gestos } from '../src/entrada/gestos.js';
import { mandoDesdeVector, vectorHacia } from '../src/entrada/esquemas.js';
import { vectorTeclas } from '../src/entrada/teclado.js';
import { leerMando } from '../src/entrada/mando.js';
import { recomendar, orientacionDe } from '../src/entrada/orientacion.js';
import { ajustesControl } from '../src/entrada/preferencias.js';
import { MemoriaLocal } from '../src/nucleo/guardado.js';
import { Camara } from '../src/camara/camara.js';
import { proyectar } from '../src/camara/geometria.js';
import { moverArcade, perfilMovimiento } from '../src/fisica/arcade.js';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const cerca = (a, b, e, m) => ok(Math.abs(a - b) <= e, `${m} (${a} vs ${b})`);

/* ---- la palanca flotante (diestro): aparece donde se pone el pulgar, en la mitad izquierda ---- */
{
  const p = new Palanca(); p.medir(412, 860);
  ok(!p.empezar(1, 300, 700), 'la mitad derecha no toma la palanca (es de la cámara y los botones)');
  ok(!p.empezar(1, 100, 120), 'la franja de arriba es del HUD');
  ok(p.empezar(1, 120, 700) && p.activa, 'el pulgar en la mitad izquierda la toma');
  ok(p.vector().m === 0, 'sin mover, no empuja');
  p.mover(1, 120 + 5, 700); ok(p.vector().m === 0, 'dentro de la zona muerta no empuja');
  p.mover(1, 120, 700 - 56); const v = p.vector();
  cerca(v.m, 1, 1e-9, 'arriba a fondo'); cerca(v.y, 1, 1e-9, 'y es hacia arriba'); cerca(v.x, 0, 1e-9, 'sin lado');
  p.mover(1, 120 + 28, 700); ok(p.vector().x > 0 && p.vector().m < 0.6, 'a medio camino hacia la derecha empuja poco (curva suave)');
  p.mover(1, 120 + 200, 700); const b = p.dibujo().base;
  cerca(Math.hypot(b.x - 320, b.y - 700), 56, 1e-9, 'si el dedo se va lejos, la base lo sigue a un radio');
  cerca(p.vector().m, 1, 1e-9, 'y sigue a fondo');
  p.terminar(1); ok(!p.activa && p.vector().m === 0, 'al soltar se suelta');
  ok(!p.empezar(2, 120, 700) || p.terminar(2), 'se puede volver a tomar');
}
/* ---- fija, zurda, grande y sensible ---- */
{
  const p = new Palanca({ modo: 'fija', lado: 'derecha', tamano: 1.4, sensibilidad: 2 }); p.medir(412, 860, 20);
  const c = p.centroFijo(); ok(c.x > 412 / 2 && c.y < 860 - 20, 'la fija de los zurdos va abajo a la derecha, sobre el borde seguro');
  ok(!p.empezar(1, 60, 700), 'lejos de la fija no la toma');
  ok(p.empezar(1, c.x, c.y), 'sobre ella la toma');
  p.mover(1, c.x, c.y - p.radio / 2); cerca(p.vector().m, 1, 1e-9, 'con sensibilidad 2 va a fondo con la mitad del recorrido');
  ok(p.radio >= 56 * 1.4 - 1e-9, 'el tamaño 1,4 agranda la palanca');
  const raro = normalizarPreferencias({ modo: 'x', lado: 3, tamano: 9, opacidad: -2, sensibilidad: 'mucho' });
  ok(raro.modo === 'flotante' && raro.lado === 'izquierda' && raro.tamano === 1.5 && raro.opacidad === 0.2 && raro.sensibilidad === 1, 'las preferencias raras se acomodan a sus límites');
}
/* ---- de la palanca a la física: arriba va hacia donde mira la cámara; derecha va a la derecha de la pantalla ---- */
{
  const cam = new Camara(), aspecto = 412 / 860;
  for (const guinada of [0, 1, -2.2, 3]) {
    cam.colocar({ x: 0, y: 0, z: 0, rumbo: guinada });
    const P = perfilMovimiento('ciclo');
    let e = { x: 0, z: 0, rumbo: guinada, velocidad: 0, w: 0 };
    for (let i = 0; i < 40; i++) e = moverArcade(e, mandoDesdeVector({ x: 1, y: 0, m: 1 }, cam.base()), 1 / 60, P);
    const antes = proyectar(cam.pose(1), { x: 0, y: 0, z: 0 }, aspecto), despues = proyectar(cam.pose(1), { x: e.x, y: 0, z: e.z }, aspecto);
    ok(despues.x > antes.x + 0.01, `con la cámara a ${guinada} rad, la palanca a la derecha lleva al jugador a la derecha de la pantalla`);
    let f = { x: 0, z: 0, rumbo: guinada, velocidad: 0, w: 0 };
    for (let i = 0; i < 40; i++) f = moverArcade(f, mandoDesdeVector({ x: 0, y: 1, m: 1 }, cam.base()), 1 / 60, P);
    const arriba = proyectar(cam.pose(1), { x: f.x, y: 0, z: f.z }, aspecto);
    ok(arriba.y > antes.y + 0.01 && Math.abs(arriba.x - antes.x) < 0.01, 'y arriba lo lleva hacia arriba de la pantalla, recto');
    const vh = vectorHacia(guinada + 0.7, cam.base()), m = mandoDesdeVector(vh, cam.base());
    cerca(Math.atan2(Math.sin(m.direccion - guinada - 0.7), Math.cos(m.direccion - guinada - 0.7)), 0, 1e-9, 'vectorHacia es lo inverso del esquema directo');
  }
  const man = mandoDesdeVector({ x: 0.5, y: -0.6, m: 0.8 }, cam.base(), 'manubrio');
  ok(man.giro === 0.5 && man.avance === 0 && man.freno, 'en manubrio: de lado gira, abajo frena');
  const P = perfilMovimiento('ciclo'); let e = { x: 0, z: 0, rumbo: 0, velocidad: 6, w: 0 };
  cam.colocar({ x: 0, y: 0, z: 0, rumbo: 0 });
  for (let i = 0; i < 20; i++) e = moverArcade(e, mandoDesdeVector({ x: 1, y: 0.5, m: 1 }, cam.base(), 'manubrio'), 1 / 60, P);
  ok(proyectar(cam.pose(1), { x: e.x, y: 0, z: e.z }, 412 / 860).x > 0.01, 'en manubrio, girar a la derecha también va a la derecha de la pantalla');
}
/* ---- la cámara a gusto: arrastrar, dos dedos (girar, pellizcar, inclinar) y la rueda ---- */
{
  const cam = new Camara(); cam.colocar({ x: 0, y: 0, z: 0, rumbo: 0 }); const g = new Gestos(cam);
  g.empezar(1, 200, 400); g.mover(1, 260, 400); ok(cam.guinada > 0 && cam.espera === 2.5, 'arrastrar a la derecha gira la cámara y espera 2,5 s');
  g.terminar(1);
  const z0 = cam.zoomObj; g.empezar(1, 150, 400); g.empezar(2, 250, 400); g.mover(2, 260, 400); g.mover(2, 330, 400);
  ok(cam.zoomObj > z0, 'separar dos dedos acerca');
  const y0 = cam.guinada; g.mover(2, 320, 470); ok(Math.abs(cam.guinada - y0) > 0.1, 'girar dos dedos gira la cámara');
  const a0 = cam.ajuste; g.mover(1, 150, 460); g.mover(2, 320, 530); ok(cam.ajuste > a0, 'moverlos juntos hacia abajo inclina');
  g.terminar(1); g.terminar(2);
  for (let i = 0; i < 60; i++) g.rueda(-120); ok(cam.zoomObj === 1, 'la rueda llega al extremo de cerca');
  for (let i = 0; i < 60; i++) g.rueda(120); ok(cam.zoomObj === 0, 'y al de lejos');
  ok(!g.empezar(3, 1, 1) || g.empezar(4, 2, 2) === true || g.activos <= 2, 'a lo sumo dos dedos');
}
/* ---- teclado y mando ---- */
{
  const d = vectorTeclas(new Set(['KeyW', 'KeyD'])); cerca(Math.hypot(d.x, d.y), 1, 1e-12, 'en diagonal no va más rápido');
  ok(vectorTeclas(new Set(['KeyW', 'KeyS'])).m === 0, 'arriba y abajo a la vez se anulan');
  ok(leerMando({}).conectado === false, 'sin mandos no falla');
  const m = leerMando({ getGamepads: () => [{ connected: true, axes: [0, -1, 0.5, 0], buttons: Array.from({ length: 12 }, (_, i) => ({ pressed: i === 0, value: i === 7 ? 1 : 0 })) }] });
  ok(m.conectado && m.mover.y > 0.99 && m.camara.x > 0 && m.acelerar === 1 && m.accion, 'el mando: palanca arriba es hacia arriba, gatillo y botón A');
}
/* ---- la recomendación al girar el celular ---- */
{
  ok(orientacionDe(860, 412) === 'horizontal' && orientacionDe(412, 860) === 'vertical', 'la orientación');
  ok(recomendar('horizontal', { modo: 'flotante' }).cambios.modo === 'fija', 'en horizontal recomienda la palanca fija');
  ok(recomendar('vertical', { modo: 'fija' }).cambios.modo === 'flotante', 'en vertical, la flotante');
  ok(recomendar('vertical', { modo: 'flotante' }) === null, 'si ya va bien, no molesta');
}
/* ---- los ajustes se guardan con versión ---- */
{
  const mem = new MemoriaLocal();
  const a = ajustesControl({ almacenamiento: mem }); a.cambiar({ palanca: { modo: 'fija', lado: 'derecha' }, camara: { menosMovimiento: true } });
  const b = ajustesControl({ almacenamiento: mem });
  ok(b.valores.palanca.modo === 'fija' && b.valores.palanca.lado === 'derecha' && b.valores.camara.menosMovimiento && b.valores.esquemaPie === 'directo', 'los ajustes vuelven al abrir otra vez');
  const lleno = ajustesControl({ almacenamiento: new MemoriaLocal(true) }); lleno.cambiar({ esquemaVehiculo: 'manubrio' });
  ok(lleno.valores.esquemaVehiculo === 'manubrio' && !lleno.persistente, 'si el navegador no deja guardar, sigue en memoria y lo dice');
}
console.log(`✓ la entrada: ${n} pruebas`);
