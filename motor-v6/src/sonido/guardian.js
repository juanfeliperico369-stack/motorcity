/* Motor City 6 · sonido/guardian.js — EL GUARDIÁN DEL SONIDO (rescatado tal cual de js/01-sonido-guardian.js, el pedido
   del autor del 25‑nov: «cuando se sale de la app aún sigue sonando la música»). Al salir de la app, cambiar de pestaña,
   bloquear la pantalla o cerrar, todo calla de una; mientras está afuera nada vuelve a sonar aunque el juego lo pida; al
   volver sigue solo lo que sonaba.
   En el motor nuevo no se parchea nada global: los sonidos del motor piden su AudioContext al guardián (guardian.contexto())
   y registran sus <audio> (guardian.medio(el)); el juego hace lo mismo con los suyos.
   Avisos que escucha: visibilitychange, pagehide y pageshow, freeze y resume, pause y resume de Capacitor (la APK), y
   app:pausa y app:sigue (la actividad nativa). */

export class GuardianSonido {
  constructor({ ventana = globalThis.window, documento = globalThis.document, Contexto } = {}) {
    this.v = ventana; this.d = documento; this.Contexto = Contexto || ventana?.AudioContext || ventana?.webkitAudioContext || null;
    this.contextos = new Set(); this.medios = new Set(); this.dormidos = new Set(); this.pausados = new Set();
    this.fuera = !!documento?.hidden; this.veces = 0;
    const callar = () => this.callar(), volver = () => this.volver();
    this._escuchas = [];
    const oir = (o, tipo, f) => { if (o?.addEventListener) { o.addEventListener(tipo, f); this._escuchas.push(() => o.removeEventListener(tipo, f)); } };
    oir(documento, 'visibilitychange', () => (documento.hidden ? this.callar() : this.volver()));
    oir(ventana, 'pagehide', callar); oir(ventana, 'pageshow', volver);
    oir(documento, 'freeze', callar); oir(documento, 'resume', volver); oir(documento, 'pause', callar);
    oir(ventana, 'app:pausa', callar); oir(ventana, 'app:sigue', volver);
  }
  /** Un AudioContext del juego, ya vigilado (null si el navegador no tiene audio). */
  contexto(opciones) {
    if (!this.Contexto) return null;
    const c = new this.Contexto(opciones); this.contextos.add(c);
    if (this.fuera) { this.dormidos.add(c); c.suspend?.().catch?.(() => {}); }
    return c;
  }
  /** Despertar un contexto (tras un toque): si la app está afuera, espera a volver. */
  async despertar(c) { if (!c) return false; if (this.fuera) { this.dormidos.add(c); return false; } try { await c.resume(); } catch { return false; } return c.state === 'running'; }
  /** Un <audio> o <video> del juego. */
  medio(el) { this.medios.add(el); return el; }
  async reproducir(el) { this.medios.add(el); if (this.fuera) { this.pausados.add(el); return false; } try { await el.play(); return true; } catch { return false; } }
  callar() {
    if (this.fuera) return; this.fuera = true; this.veces++;
    for (const c of this.contextos) if (c.state === 'running') { this.dormidos.add(c); c.suspend?.().catch?.(() => {}); }
    for (const m of this.medios) if (!m.paused) { this.pausados.add(m); try { m.pause(); } catch { /* nada */ } }
    try { this.v?.speechSynthesis?.cancel(); } catch { /* sin voz */ }
  }
  volver() {
    if (!this.fuera || this.d?.hidden) return; this.fuera = false;
    for (const c of this.dormidos) if (c.state !== 'closed') c.resume?.().catch?.(() => {});
    this.dormidos.clear();
    for (const m of this.pausados) { try { const p = m.play(); p?.catch?.(() => {}); } catch { /* nada */ } }
    this.pausados.clear();
  }
  estado() { return { fuera: this.fuera, veces: this.veces, contextos: this.contextos.size, medios: this.medios.size }; }
  cerrar() { for (const q of this._escuchas) q(); this._escuchas = []; }
}

let unico = null;
/** El guardián de la página (uno solo). */
export function guardian() { if (!unico) unico = new GuardianSonido(); return unico; }
