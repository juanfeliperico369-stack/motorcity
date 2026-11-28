/* Motor City 6 · entrada/palanca.js — la palanca virtual (plan § 5: «palanca fija o flotante, el tamaño, la opacidad y
   la mano»). Lógica pura, sin DOM (la pinta entrada/tactil.js), para probarla en Node con toques de verdad.
   - fija: siempre en su esquina (abajo a la izquierda, o a la derecha para zurdos); se toma tocando cerca de ella.
   - flotante: aparece donde pones el dedo, en tu mitad de la pantalla (debajo de la franja de arriba, que es del HUD);
     si el dedo se va más lejos que el radio, la base lo sigue, así nunca se «pierde».
   - zona muerta, sensibilidad (cuánto hay que empujar para ir a fondo) y una curva suave para lo fino.
   El vector sale en la convención de la pantalla: x a la derecha, y hacia ARRIBA, m ∈ [0, 1]. */

export const PREFERENCIAS_PALANCA = Object.freeze({
  modo: 'flotante',          // 'flotante' | 'fija'
  lado: 'izquierda',         // la mano que mueve: 'izquierda' (diestros) | 'derecha' (zurdos)
  tamano: 1,                 // 0,7 a 1,5 (radio base de 56 px)
  opacidad: 0.55,            // 0,2 a 1
  zonaMuerta: 0.12,
  sensibilidad: 1,           // 0,5 a 2: más sensible, menos recorrido para ir a fondo
});
const RADIO = 56, MARGEN = 22, CURVA = 1.25, FRANJA_HUD = 0.22;
const limitar = (v, a, b) => (v < a ? a : v > b ? b : v);

export function normalizarPreferencias(p = {}) {
  const d = PREFERENCIAS_PALANCA, num = (v, a, b, x) => (Number.isFinite(v) ? limitar(v, a, b) : x);
  return {
    modo: p.modo === 'fija' ? 'fija' : 'flotante', lado: p.lado === 'derecha' ? 'derecha' : 'izquierda',
    tamano: num(p.tamano, 0.7, 1.5, d.tamano), opacidad: num(p.opacidad, 0.2, 1, d.opacidad),
    zonaMuerta: num(p.zonaMuerta, 0, 0.4, d.zonaMuerta), sensibilidad: num(p.sensibilidad, 0.5, 2, d.sensibilidad),
  };
}

export class Palanca {
  constructor(preferencias = {}) { this.ajustar(preferencias); this.id = null; this.base = null; this.punta = null; this.pantalla = { ancho: 412, alto: 860, abajo: 0 }; }
  ajustar(preferencias) { this.prefs = normalizarPreferencias({ ...this.prefs, ...preferencias }); this.soltar(); }
  /** El tamaño de la pantalla en px CSS y el borde seguro de abajo (env(safe-area-inset-bottom)). */
  medir(ancho, alto, abajo = 0) { this.pantalla = { ancho, alto, abajo }; }
  get radio() { return RADIO * this.prefs.tamano; }
  get activa() { return this.id !== null; }
  /** El centro de la palanca fija (y el lugar donde se dibuja la guía de la flotante en reposo). */
  centroFijo() {
    const { ancho, alto, abajo } = this.pantalla, r = this.radio, x = this.prefs.lado === 'izquierda' ? MARGEN + r : ancho - MARGEN - r;
    return { x, y: alto - abajo - MARGEN - r };
  }
  /** ¿Este toque la toma? (los demás son para la cámara o los botones) */
  toma(x, y) {
    const { ancho, alto } = this.pantalla;
    if (this.prefs.modo === 'fija') { const c = this.centroFijo(); return Math.hypot(x - c.x, y - c.y) <= this.radio * 1.6; }
    const suMitad = this.prefs.lado === 'izquierda' ? x < ancho * 0.5 : x >= ancho * 0.5;
    return suMitad && y > alto * FRANJA_HUD;
  }
  empezar(id, x, y) {
    if (this.id !== null || !this.toma(x, y)) return false;
    this.id = id; this.base = this.prefs.modo === 'fija' ? this.centroFijo() : { x, y }; this.punta = { x, y };
    return true;
  }
  mover(id, x, y) {
    if (id !== this.id) return false;
    this.punta = { x, y };
    if (this.prefs.modo === 'flotante') {                       // la base sigue al dedo que se aleja
      const dx = x - this.base.x, dy = y - this.base.y, l = Math.hypot(dx, dy), r = this.radio / this.prefs.sensibilidad;
      if (l > r) { this.base = { x: x - dx / l * r, y: y - dy / l * r }; }
    }
    return true;
  }
  terminar(id) { if (id !== this.id) return false; this.soltar(); return true; }
  soltar() { this.id = null; this.base = null; this.punta = null; }
  /** { x, y, m }: x a la derecha, y hacia arriba, con la zona muerta y la curva. */
  vector() {
    if (this.id === null) return { x: 0, y: 0, m: 0 };
    const dx = this.punta.x - this.base.x, dy = this.punta.y - this.base.y, l = Math.hypot(dx, dy);
    const recorrido = this.radio / this.prefs.sensibilidad, crudo = limitar(l / recorrido, 0, 1), zm = this.prefs.zonaMuerta;
    if (l < 1e-9 || crudo <= zm) return { x: 0, y: 0, m: 0 };
    const m = Math.pow((crudo - zm) / (1 - zm), CURVA);
    return { x: dx / l * m, y: -dy / l * m, m };
  }
  /** Para dibujar: dónde va la base y la perilla, en px. */
  dibujo() {
    const r = this.radio;
    if (this.id === null) return { visible: this.prefs.modo === 'fija', guia: this.prefs.modo === 'flotante', base: this.centroFijo(), perilla: this.centroFijo(), radio: r, opacidad: this.prefs.opacidad };
    const v = this.vector(), rec = r / this.prefs.sensibilidad, k = Math.min(1, Math.hypot(this.punta.x - this.base.x, this.punta.y - this.base.y) / rec);
    const l = Math.hypot(this.punta.x - this.base.x, this.punta.y - this.base.y) || 1;
    return { visible: true, guia: false, base: this.base, perilla: { x: this.base.x + (this.punta.x - this.base.x) / l * r * k, y: this.base.y + (this.punta.y - this.base.y) / l * r * k }, radio: r, opacidad: Math.min(1, this.prefs.opacidad + 0.2), vector: v };
  }
}
