/* Motor City 6 · entrada/gestos.js — mover la cámara a gusto (plan § 5): «se gira y se inclina con dos dedos, y se acerca
   o se aleja (pellizco o rueda)». Lógica pura: recibe los toques que no tomó la palanca ni un botón.
   - dos dedos: girarlos gira la cámara (como un mapa), separarlos acerca, y moverlos juntos arriba o abajo inclina;
   - un dedo arrastrando sobre el mundo: gira (horizontal) e inclina (vertical), con el ratón igual;
   - la rueda acerca y aleja.
   Las convenciones son las de «agarrar el mundo»: arrastrar a la derecha hace que la ciudad se mueva con el dedo.
   Llama a camara.girar(rad), camara.inclinar(rad) y camara.acercar(Δzoom), que esperan 2,5 s antes de seguir el rumbo. */

const limitar = (v, a, b) => (v < a ? a : v > b ? b : v);
export const PREFERENCIAS_GESTOS = Object.freeze({ sensibilidad: 1, invertirInclinacion: false });

export class Gestos {
  constructor(camara, preferencias = {}) { this.camara = camara; this.prefs = { ...PREFERENCIAS_GESTOS, ...preferencias }; this.dedos = new Map(); this._dos = null; this.usado = { girar: 0, inclinar: 0, acercar: 0 }; }
  ajustar(p) { this.prefs = { ...this.prefs, ...p }; }
  get activos() { return this.dedos.size; }
  empezar(id, x, y) { if (this.dedos.size >= 2) return false; this.dedos.set(id, { x, y }); this._dos = null; return true; }
  terminar(id) { const habia = this.dedos.delete(id); this._dos = null; return habia; }
  cancelar() { this.dedos.clear(); this._dos = null; }
  mover(id, x, y, { ancho = 412, alto = 860 } = {}) {
    const d = this.dedos.get(id); if (!d) return false;
    const k = this.prefs.sensibilidad, signoInc = this.prefs.invertirInclinacion ? -1 : 1;
    if (this.dedos.size === 1) {
      const dx = x - d.x, dy = y - d.y; this.dedos.set(id, { x, y });
      this._girar(dx / ancho * Math.PI * 1.1 * k); this._inclinar(dy / alto * 1.2 * k * signoInc);
      return true;
    }
    this.dedos.set(id, { x, y });
    const [a, b] = [...this.dedos.values()], ahora = { d: Math.hypot(b.x - a.x, b.y - a.y), ang: Math.atan2(b.y - a.y, b.x - a.x), my: (a.y + b.y) / 2 };
    if (this._dos && ahora.d > 8 && this._dos.d > 8) {
      this._acercar(Math.log(ahora.d / this._dos.d) * 0.9 * k);
      let dAng = ahora.ang - this._dos.ang; if (dAng > Math.PI) dAng -= 2 * Math.PI; if (dAng < -Math.PI) dAng += 2 * Math.PI;
      this._girar(dAng);
      this._inclinar((ahora.my - this._dos.my) / alto * 1.2 * k * signoInc);
    }
    this._dos = ahora;
    return true;
  }
  rueda(deltaY, modo = 0) { const px = modo === 1 ? deltaY * 16 : modo === 2 ? deltaY * 400 : deltaY; this._acercar(limitar(-px * 0.0015, -0.25, 0.25)); }
  _girar(a) { if (a) { this.camara.girar(a); this.usado.girar += Math.abs(a); } }
  _inclinar(a) { if (a) { this.camara.inclinar(a); this.usado.inclinar += Math.abs(a); } }
  _acercar(z) { if (z) { this.camara.acercar(z); this.usado.acercar += Math.abs(z); } }
}
