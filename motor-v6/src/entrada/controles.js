/* Motor City 6 · entrada/controles.js — todos los controles en una pieza: la pantalla táctil (palanca y gestos), el
   teclado y el mando, con los ajustes guardados del jugador. En cada paso fijo da lo que entiende la física:
     const c = new Controles({ superficie: canvas, camara, ajustes: ajustesControl({ clave: 'run-city.controles' }) });
     bucle: const { mover, correr, accion } = c.paso(dt, { aPie: true }); estado = moverArcade(estado, mover, dt, perfil);
   - El esquema (directo, manubrio o avanza) es el de los ajustes, uno a pie y otro en vehículo. Con «avanza», la pantalla
     táctil pasa a «lados» (sin palanca): una mitad gira y las dos frenan.
   - Q/E y la palanca derecha del mando giran la cámara; Z/X y los gatillos del mando no se cruzan: los gatillos solo
     aceleran y frenan en manubrio.
   - pausar(true) suelta todo y no deja que nada se mueva hasta reanudar. */
import { Tactil } from './tactil.js';
import { Teclado, TECLAS } from './teclado.js';
import { leerMando } from './mando.js';
import { mandoDesdeVector } from './esquemas.js';
import { recomendar, orientacionDe, vigilarOrientacion } from './orientacion.js';

const GIRO_TECLA = 1.6, ZOOM_TECLA = 0.9, GIRO_MANDO = 2.2;

export class Controles {
  constructor({ superficie, camara, ajustes, alPulsar = null, alRecomendar = null, ventana = globalThis } = {}) {
    this.camara = camara; this.ajustes = ajustes; this.pausado = false; this._antesMando = {}; this.alRecomendar = alRecomendar;
    const v = ajustes.valores;
    this.tactil = new Tactil({ superficie, camara, preferencias: v.palanca, gestos: { sensibilidad: v.camara.sensibilidad, invertirInclinacion: v.camara.invertirInclinacion } });
    this.teclado = new Teclado({ objetivo: ventana, alPulsar: (codigo) => {
      if (this.pausado && !TECLAS.pausa.includes(codigo)) return;
      if (TECLAS.centrar.includes(codigo)) this.camara.centrar();
      alPulsar?.(codigo);
    } });
    this.aplicarAjustes();
    this._dejarDeVigilar = vigilarOrientacion(o => this.recomendacion(o), ventana);
  }
  /** Vuelve a leer los ajustes (después de cambiarlos en el menú). */
  aplicarAjustes() {
    const v = this.ajustes.valores;
    this.tactil.ajustar(v.palanca); this.tactil.ajustarGestos({ sensibilidad: v.camara.sensibilidad, invertirInclinacion: v.camara.invertirInclinacion });
    this.camara.menosMovimiento = v.camara.menosMovimiento;
    this.camara.seguirRumbo = v.camara.seguirRumbo;
  }
  /** La recomendación al girar el celular (una vez por orientación), o null. */
  recomendacion(orientacion = orientacionDe(globalThis.innerWidth, globalThis.innerHeight)) {
    const v = this.ajustes.valores; if (v.recomendado[orientacion]) return null;
    const r = recomendar(orientacion, v.palanca); if (!r) return null;
    this.ajustes.cambiar({ recomendado: { [orientacion]: true } });
    this.alRecomendar?.(r, () => { this.ajustes.cambiar({ palanca: r.cambios }); this.aplicarAjustes(); });
    return r;
  }
  pausar(si) { this.pausado = !!si; this.tactil.pausar(si); if (si) this.teclado.limpiar(); }
  limpiar() { this.tactil.limpiar(); this.teclado.limpiar(); }
  /** Un paso fijo: el mando para la física, y de paso gira o acerca la cámara con teclas o el mando. */
  paso(dt, { aPie = true } = {}) {
    if (this.pausado) return { mover: {}, correr: false, accion: false, origen: 'pausa' };
    const v = this.ajustes.valores, esquema = aPie ? v.esquemaPie : v.esquemaVehiculo, base = this.camara.base(), m = leerMando();
    this.tactil.cambiarModo(esquema === 'avanza' ? 'lados' : 'palanca');
    const giroCam = this.teclado.girarCamara * GIRO_TECLA * dt + (m.conectado ? -m.camara.x * GIRO_MANDO * dt : 0);
    if (giroCam) this.camara.girar(giroCam);
    if (m.conectado && m.camara.y) this.camara.inclinar(m.camara.y * dt);
    if (this.teclado.zoom) this.camara.acercar(this.teclado.zoom * ZOOM_TECLA * dt);
    if (m.conectado && m.centrar && !this._antesMando.centrar) this.camara.centrar();
    this._antesMando = m;
    let vec = this.tactil.vector(), origen = 'tactil';
    if (!(vec.m > 0)) { vec = this.teclado.vector(); origen = 'teclado'; }
    if (!(vec.m > 0) && m.conectado) { vec = m.mover; origen = 'mando'; }
    if (!(vec.m > 0)) origen = 'nada';
    let mover = mandoDesdeVector(vec, base, esquema, { freno: m.conectado && m.frenar > 0.5 && esquema !== 'directo' });
    if (esquema === 'manubrio' && m.conectado && m.acelerar > 0.05) mover = { ...mover, avance: Math.max(mover.avance || 0, m.acelerar) };
    return { mover, correr: this.teclado.correr || (m.conectado && m.correr), accion: this.teclado.accion || (m.conectado && m.accion), origen, vector: vec };
  }
  cerrar() { this.tactil.cerrar(); this.teclado.cerrar(); this._dejarDeVigilar?.(); }
}
