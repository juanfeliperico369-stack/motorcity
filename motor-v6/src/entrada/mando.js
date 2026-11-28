/* Motor City 6 · entrada/mando.js — un mando de juego (Gamepad API, en el celular por Bluetooth o en el computador).
   Palanca izquierda: moverse (según la pantalla); palanca derecha: la cámara; gatillo derecho acelera y el izquierdo
   frena (en el esquema manubrio); A es la acción, B corre, el de en medio pausa y el clic de la palanca derecha centra.
   Si el navegador no tiene mandos, todo vale cero (no falla). */

const ZONA = 0.16;
const eje = v => (Math.abs(v || 0) < ZONA ? 0 : (v - Math.sign(v) * ZONA) / (1 - ZONA));
function vector(x, y) { const m = Math.min(1, Math.hypot(x, y)); return m ? { x: x / Math.max(1, Math.hypot(x, y)), y: y / Math.max(1, Math.hypot(x, y)), m } : { x: 0, y: 0, m: 0 }; }

/** Lee el primer mando conectado: { conectado, mover, camara, acelerar, frenar, accion, correr, pausa, centrar } */
export function leerMando(nav = globalThis.navigator) {
  const vacio = { conectado: false, mover: { x: 0, y: 0, m: 0 }, camara: { x: 0, y: 0 }, acelerar: 0, frenar: 0, accion: false, correr: false, pausa: false, centrar: false };
  let lista = [];
  try { lista = nav?.getGamepads ? [...nav.getGamepads()].filter(Boolean) : []; } catch { return vacio; }
  const g = lista.find(p => p.connected !== false); if (!g) return vacio;
  const b = i => !!(g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.5)), val = i => (g.buttons[i] ? g.buttons[i].value || (g.buttons[i].pressed ? 1 : 0) : 0);
  return {
    conectado: true,
    mover: vector(eje(g.axes[0]), -eje(g.axes[1])),           // y hacia arriba
    camara: { x: eje(g.axes[2]), y: eje(g.axes[3]) },
    acelerar: val(7), frenar: val(6), accion: b(0), correr: b(1), pausa: b(9), centrar: b(11),
  };
}
