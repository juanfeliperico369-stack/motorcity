/* Motor City 6 · nucleo/bucle.js — EL CORAZÓN: paso fijo con interpolación del dibujo y pausa probada (F1, plan de Run City § 12).
   - La física (actualizar) corre a paso fijo (1/60 s por defecto): igual en cualquier celular, con o sin muchos cuadros.
   - El dibujo (dibujar) recibe alfa ∈ [0, 1): cuánto se avanzó hacia el paso siguiente, para interpolar y que se vea fluido.
   - Tope de pasos por cuadro: en un celular lento no hay «espiral de la muerte»; el tiempo sobrante se descarta y se cuenta.
   - Pausa: la física no avanza ni un paso, el dibujo sigue (menús), y al reanudar no hay salto.
   - Escala de tiempo y un reloj de juego (t) que solo avanza con la física.
   - Sin depender del navegador: recibe el «ahora» en ms (requestAnimationFrame en el juego, a mano en las pruebas). */
export class Bucle {
  constructor({ paso = 1 / 60, maxPasos = 5, actualizar = () => {}, dibujar = () => {} } = {}) {
    Object.assign(this, { paso, maxPasos, actualizar, dibujar, acum: 0, t: 0, pasos: 0, descartado: 0, escala: 1, pausado: false, _ult: null, _raf: 0 });
  }
  pausar() { this.pausado = true; }
  reanudar() { this.pausado = false; this._ult = null; this.acum = 0; }
  /* un cuadro; devuelve cuántos pasos de física se dieron */
  cuadro(ahoraMs) {
    if (this._ult === null) { this._ult = ahoraMs; this.dibujar(0, 0); return 0; }
    let dt = Math.max(0, (ahoraMs - this._ult) / 1000); this._ult = ahoraMs;
    if (dt > 0.25) dt = 0.25;   /* al volver de otra app o tras un tirón no se simula todo ese tiempo de golpe */
    let n = 0;
    if (!this.pausado) {
      this.acum += dt * this.escala;
      while (this.acum >= this.paso && n < this.maxPasos) { this.actualizar(this.paso, this.t); this.t += this.paso; this.acum -= this.paso; n++; this.pasos++; }
      if (this.acum >= this.paso) { const r = this.acum % this.paso; this.descartado += this.acum - r; this.acum = r; }
    }
    this.dibujar(this.pausado ? 0 : this.acum / this.paso, dt);
    return n;
  }
  iniciar(raf = globalThis.requestAnimationFrame) { const f = ms => { this.cuadro(ms); this._raf = raf(f); }; this._raf = raf(f); return this; }
  detener(caf = globalThis.cancelAnimationFrame) { if (this._raf && caf) caf(this._raf); this._raf = 0; }
}
/* interpolar entre el estado del paso anterior y el actual */
export const mezclar = (a, b, alfa) => a + (b - a) * alfa;
