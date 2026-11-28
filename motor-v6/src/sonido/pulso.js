/* Música procedural original para exploración y carrera. No usa muestras ni red.
 * El juego llama activar() solo desde un gesto voluntario, actualizar() en cada
 * cuadro y pausar(true/false) al cambiar la pausa. El guardián silencia al salir
 * de la app; cerrar() libera el contexto. No se reproduce nada al construir. */
import { guardian as guardianPagina } from './guardian.js';

const limitar = (x, min, max) => Math.max(min, Math.min(max, x));
const notas = [110, 130.81, 146.83, 164.81, 146.83, 130.81, 123.47, 130.81];

/** Velocidad en m/s; segundosRestantes null indica que no hay reloj de carrera. */
export function parametrosPulso({ velocidad = 0, segundosRestantes = null } = {}) {
  if (!Number.isFinite(velocidad) || velocidad < 0 || (segundosRestantes !== null && (!Number.isFinite(segundosRestantes) || segundosRestantes < 0))) throw new RangeError('Velocidad o reloj inválidos');
  const movimiento = limitar(velocidad / 18, 0, 1);
  const urgencia = segundosRestantes === null ? 0 : limitar((30 - segundosRestantes) / 30, 0, 1);
  return { bpm: 84 + 42 * movimiento + 24 * urgencia, intensidad: limitar(.25 + .45 * movimiento + .3 * urgencia, 0, 1) };
}

export class MusicaPulso {
  constructor({ guardian } = {}) {
    this.g = guardian || null; this.ctx = null; this.salida = null;
    this.activa = false; this.pausada = false; this.cerrada = false;
    this.siguiente = null; this.paso = 0; this.revision = 0;
  }
  /** Invocar desde un toque o tecla del jugador; no crea audio automáticamente. */
  async activar() {
    if (this.cerrada) throw new Error('Música cerrada');
    const revision = ++this.revision;
    try {
      const g = this.g || (this.g = guardianPagina());
      if (!this.ctx) {
        this.ctx = g.contexto();
        if (!this.ctx) return false;
        this.salida = this.ctx.createGain(); this.salida.gain.value = 0;
        this.salida.connect(this.ctx.destination);
      }
      const lista = await g.despertar(this.ctx);
      if (revision !== this.revision || this.cerrada) return false;
      this.activa = lista; this.siguiente = null;
      this._silencio();
      return this.activa;
    } catch { if (revision === this.revision) this.activa = false; return false; }
  }
  desactivar() { this.revision++; this.activa = false; this.siguiente = null; this._silencio(); }
  pausar(valor = true) { this.pausada = !!valor; this.siguiente = null; this._silencio(); }
  _silencio() {
    if (!this.ctx || !this.salida) return;
    const t = this.ctx.currentTime, ganancia = this.salida.gain;
    ganancia.cancelScheduledValues(t);
    ganancia.setValueAtTime(this.activa && !this.pausada ? .12 : 0, t);
  }
  /** Programa como máximo un pulso por cuadro; no acumula notas al volver. */
  actualizar(datos = {}) {
    const perfil = parametrosPulso(datos);
    if (!this.activa || this.pausada || !this.ctx || this.ctx.state !== 'running' || this.g?.fuera) { this.siguiente = null; return perfil; }
    const t = this.ctx.currentTime;
    if (this.siguiente === null || this.siguiente < t - .15) this.siguiente = t;
    if (this.siguiente <= t + .04) {
      const inicio = Math.max(t, this.siguiente), tono = notas[this.paso % notas.length];
      this._nota(tono, inicio, .16, .38 + .3 * perfil.intensidad, 'triangle');
      if (this.paso % 2 === 0) this._nota(tono * 2, inicio, .08, .1 + .15 * perfil.intensidad, 'sine');
      this.paso++; this.siguiente = inicio + 60 / perfil.bpm;
    }
    return perfil;
  }
  _nota(frecuencia, inicio, duracion, volumen, tipo) {
    const osc = this.ctx.createOscillator(), envolvente = this.ctx.createGain();
    osc.type = tipo; osc.frequency.setValueAtTime(frecuencia, inicio);
    envolvente.gain.setValueAtTime(0, inicio);
    envolvente.gain.linearRampToValueAtTime(volumen, inicio + .008);
    envolvente.gain.exponentialRampToValueAtTime(.0001, inicio + duracion);
    osc.connect(envolvente); envolvente.connect(this.salida);
    osc.onended = () => { osc.disconnect(); envolvente.disconnect(); };
    osc.start(inicio); osc.stop(inicio + duracion + .01);
  }
  async cerrar() {
    if (this.cerrada) return;
    this.desactivar(); this.cerrada = true;
    if (this.ctx) { this.g?.contextos?.delete(this.ctx); await this.ctx.close(); }
    this.salida?.disconnect();
  }
}
