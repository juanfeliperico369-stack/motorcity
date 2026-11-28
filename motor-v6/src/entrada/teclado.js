/* Motor City 6 · entrada/teclado.js — el teclado (y su lógica pura para las pruebas).
   Flechas o WASD mueven según la pantalla; Mayús corre; Espacio es la acción; Q y E giran la cámara; Z y X (o + y −)
   acercan y alejan; C la centra; P o Esc pausan. El juego puede añadir sus teclas con alPulsar. */

const MOVER = Object.freeze({ ArrowUp: [0, 1], KeyW: [0, 1], ArrowDown: [0, -1], KeyS: [0, -1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] });
export const TECLAS = Object.freeze({ correr: ['ShiftLeft', 'ShiftRight'], accion: ['Space'], girarIzq: ['KeyQ'], girarDer: ['KeyE'], acercar: ['KeyZ', 'Equal', 'NumpadAdd'], alejar: ['KeyX', 'Minus', 'NumpadSubtract'], centrar: ['KeyC'], pausa: ['KeyP', 'Escape'] });

/** De las teclas apretadas a un vector { x, y, m } de pantalla (las diagonales no van más rápido). */
export function vectorTeclas(apretadas) {
  let x = 0, y = 0;
  for (const k of apretadas) { const d = MOVER[k]; if (d) { x += d[0]; y += d[1]; } }
  x = Math.sign(x); y = Math.sign(y); const l = Math.hypot(x, y);
  return l ? { x: x / l, y: y / l, m: 1 } : { x: 0, y: 0, m: 0 };
}
const alguna = (s, lista) => lista.some(k => s.has(k));

export class Teclado {
  constructor({ objetivo = globalThis, alPulsar = null } = {}) {
    this.apretadas = new Set(); this.alPulsar = alPulsar; this.objetivo = objetivo; this.activo = true;
    this._abajo = e => {
      if (!this.activo || e.target?.closest?.('input, textarea, select')) return;
      const nuevo = !this.apretadas.has(e.code); this.apretadas.add(e.code);
      if (MOVER[e.code] || e.code === 'Space') e.preventDefault?.();
      if (nuevo && !e.repeat) this.alPulsar?.(e.code, this);
    };
    this._arriba = e => this.apretadas.delete(e.code);
    this._limpiar = () => this.apretadas.clear();
    objetivo.addEventListener?.('keydown', this._abajo); objetivo.addEventListener?.('keyup', this._arriba); objetivo.addEventListener?.('blur', this._limpiar);
  }
  vector() { return vectorTeclas(this.apretadas); }
  get correr() { return alguna(this.apretadas, TECLAS.correr); }
  get accion() { return alguna(this.apretadas, TECLAS.accion); }
  /** Giro continuo de la cámara con Q y E (rad/s a aplicar por el juego): −1, 0 o 1 */
  get girarCamara() { return (alguna(this.apretadas, TECLAS.girarIzq) ? 1 : 0) - (alguna(this.apretadas, TECLAS.girarDer) ? 1 : 0); }
  get zoom() { return (alguna(this.apretadas, TECLAS.acercar) ? 1 : 0) - (alguna(this.apretadas, TECLAS.alejar) ? 1 : 0); }
  limpiar() { this.apretadas.clear(); }
  cerrar() { const o = this.objetivo; o.removeEventListener?.('keydown', this._abajo); o.removeEventListener?.('keyup', this._arriba); o.removeEventListener?.('blur', this._limpiar); }
}
