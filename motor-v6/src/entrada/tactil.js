/* Motor City 6 · entrada/tactil.js — la pantalla táctil y el ratón: reparte cada toque entre la palanca y la cámara, y
   dibuja la palanca (dos círculos de 112 y 44 px, que no tapan la vista: la flotante solo deja una guía tenue en reposo).
   - Toques sobre el mundo (la «superficie», normalmente el canvas): si caen donde va la palanca, la mueven; si no, son
     gestos de la cámara (entrada/gestos.js). Los botones del HUD tienen sus propios eventos y no llegan aquí.
   - El ratón no toma la palanca (en el computador se mueve con el teclado): arrastrar gira e inclina, la rueda acerca.
   - Al perder el foco o pausar, todo se suelta (limpiar()). */
import { Palanca } from './palanca.js';
import { Gestos } from './gestos.js';

const ESTILO = `.mc6-palanca{position:fixed;left:0;top:0;pointer-events:none;z-index:2;border-radius:50%;box-sizing:border-box;will-change:transform,opacity}
.mc6-palanca-base{border:2px solid rgba(255,255,255,.75);background:radial-gradient(circle,rgba(16,43,59,.18),rgba(16,43,59,.42));box-shadow:0 2px 10px rgba(0,0,0,.25)}
.mc6-palanca-perilla{background:rgba(255,255,255,.92);border:2px solid rgba(16,43,59,.55);box-shadow:0 2px 6px rgba(0,0,0,.3)}
.mc6-palanca[hidden]{display:none}`;

export class Tactil {
  constructor({ superficie, camara, preferencias = {}, gestos = {}, contenedor = globalThis.document?.body } = {}) {
    this.superficie = superficie; this.palanca = new Palanca(preferencias); this.gestos = new Gestos(camara, gestos); this.activo = true;
    this.dueno = new Map();                                  // id del toque → 'palanca' | 'gestos'
    const doc = superficie.ownerDocument;
    if (!doc.getElementById('mc6-palanca-estilo')) { const s = doc.createElement('style'); s.id = 'mc6-palanca-estilo'; s.textContent = ESTILO; doc.head.append(s); }
    this.base = doc.createElement('div'); this.base.className = 'mc6-palanca mc6-palanca-base'; this.base.dataset.palanca = 'base';
    this.perilla = doc.createElement('div'); this.perilla.className = 'mc6-palanca mc6-palanca-perilla'; this.perilla.dataset.palanca = 'perilla';
    contenedor.append(this.base, this.perilla);
    const ev = (tipo, f, op) => { superficie.addEventListener(tipo, f, op); return () => superficie.removeEventListener(tipo, f, op); };
    const pos = e => { const r = superficie.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, ancho: r.width, alto: r.height }; };
    this._quitar = [
      ev('pointerdown', e => {
        if (!this.activo) return;
        const p = pos(e); this.palanca.medir(p.ancho, p.alto, this._abajoSeguro());
        let quien = null;
        if (e.pointerType !== 'mouse' && this.palanca.empezar(e.pointerId, p.x, p.y)) quien = 'palanca';
        else if (this.gestos.empezar(e.pointerId, p.x, p.y)) quien = 'gestos';
        if (!quien) return;
        this.dueno.set(e.pointerId, quien); e.preventDefault();
        try { superficie.setPointerCapture(e.pointerId); } catch { /* el puntero ya se fue */ }
        this.dibujar();
      }),
      ev('pointermove', e => {
        const quien = this.dueno.get(e.pointerId); if (!quien) return;
        const p = pos(e);
        if (quien === 'palanca') this.palanca.mover(e.pointerId, p.x, p.y); else this.gestos.mover(e.pointerId, p.x, p.y, p);
        this.dibujar();
      }),
      ...['pointerup', 'pointercancel', 'lostpointercapture'].map(t => ev(t, e => this._fin(e.pointerId))),
      ev('wheel', e => { if (!this.activo) return; e.preventDefault(); this.gestos.rueda(e.deltaY, e.deltaMode); }, { passive: false }),
      ev('contextmenu', e => e.preventDefault()),
    ];
    this._medir = () => { const r = superficie.getBoundingClientRect(); this.palanca.medir(r.width, r.height, this._abajoSeguro()); this.dibujar(); };
    globalThis.addEventListener?.('resize', this._medir); this._medir();
  }
  _abajoSeguro() { try { const v = getComputedStyle(this.superficie.ownerDocument.documentElement).getPropertyValue('--mc6-abajo'); return parseFloat(v) || 0; } catch { return 0; } }
  _fin(id) { const quien = this.dueno.get(id); if (!quien) return; this.dueno.delete(id); if (quien === 'palanca') this.palanca.terminar(id); else this.gestos.terminar(id); this.dibujar(); }
  /** El vector de la palanca: { x, y, m } (x derecha, y arriba). */
  vector() { return this.palanca.vector(); }
  ajustar(preferencias) { this.palanca.ajustar(preferencias); this._limpiarDuenos(); this.dibujar(); }
  ajustarGestos(p) { this.gestos.ajustar(p); }
  /** Suelta todo (pausa, perder el foco, abrir un menú). */
  limpiar() { this.palanca.soltar(); this.gestos.cancelar(); this._limpiarDuenos(); this.dibujar(); }
  _limpiarDuenos() { for (const id of this.dueno.keys()) { try { this.superficie.releasePointerCapture(id); } catch { /* ya suelto */ } } this.dueno.clear(); }
  pausar(si) { this.activo = !si; if (si) this.limpiar(); this.dibujar(); }
  dibujar() {
    const d = this.palanca.dibujo(), r = d.radio, rp = 22, mostrar = this.activo && (d.visible || d.guia);
    this.base.hidden = !mostrar; this.perilla.hidden = !mostrar || d.guia;
    if (!mostrar) return;
    Object.assign(this.base.style, { width: r * 2 + 'px', height: r * 2 + 'px', opacity: String(d.guia ? d.opacidad * 0.45 : d.opacidad), transform: `translate(${d.base.x - r}px,${d.base.y - r}px)` });
    Object.assign(this.perilla.style, { width: rp * 2 + 'px', height: rp * 2 + 'px', opacity: String(Math.min(1, d.opacidad + 0.25)), transform: `translate(${d.perilla.x - rp}px,${d.perilla.y - rp}px)` });
  }
  cerrar() { for (const q of this._quitar) q(); globalThis.removeEventListener?.('resize', this._medir); this.base.remove(); this.perilla.remove(); }
}
