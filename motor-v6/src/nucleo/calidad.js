/* Motor City 6 · nucleo/calidad.js — EL REGULADOR DE CALIDAD (rescata la idea de js/05-gpu; plan de Run City § 3 y § 15:
   «el regulador de calidad baja el detalle, nunca la fluidez»).
   Mide cuánto tardan los cuadros y ajusta la resolución de dibujo (el pixelRatio del renderizador) por escalones:
   - si el percentil 75 de un segundo pasa de ~28 fps, baja un escalón;
   - si durante tres segundos seguidos sobra (por debajo de ~45 fps de costo), sube uno, sin pasar del máximo del aparato;
   - después de cada cambio espera 2 s, para no oscilar.
   No toca la física ni el paso fijo: solo cuánto se dibuja. Sin DOM ni Three: el juego aplica el valor en alCambiar. */

export class Calidad {
  constructor({ maximo = 1.5, minimo = 0.6, escalones = [1.5, 1.25, 1, 0.85, 0.7, 0.6], lentoMs = 36, sobraMs = 22, espera = 2, alCambiar = () => {} } = {}) {
    this.niveles = [...new Set(escalones.filter(e => e <= maximo + 1e-9 && e >= minimo - 1e-9).concat(maximo <= escalones[0] ? [maximo] : []))].sort((a, b) => b - a);
    if (!this.niveles.length) this.niveles = [Math.max(minimo, Math.min(maximo, 1))];
    Object.assign(this, { lentoMs, sobraMs, espera, alCambiar, indice: 0, muestras: [], reloj: 0, calma: 0, holgados: 0, cambios: [] });
  }
  get valor() { return this.niveles[this.indice]; }
  /** Registra un cuadro (su duración en ms). Devuelve el valor vigente. */
  cuadro(ms) {
    if (!(ms > 0) || ms > 1000) return this.valor;           // pausas y vueltas de otra app no cuentan
    this.muestras.push(ms); this.reloj += ms / 1000; this.calma = Math.max(0, this.calma - ms / 1000);
    if (this.reloj < 1) return this.valor;
    const orden = [...this.muestras].sort((a, b) => a - b), p75 = orden[Math.floor(orden.length * 0.75)];
    this.muestras = []; this.reloj = 0;
    if (this.calma > 0) return this.valor;
    if (p75 > this.lentoMs && this.indice < this.niveles.length - 1) this._ir(this.indice + 1, p75);
    else if (p75 < this.sobraMs) { if (++this.holgados >= 3 && this.indice > 0) this._ir(this.indice - 1, p75); }
    else this.holgados = 0;
    return this.valor;
  }
  _ir(i, p75) { this.indice = i; this.calma = this.espera; this.holgados = 0; this.cambios.push({ valor: this.valor, p75 }); this.alCambiar(this.valor); }
}
