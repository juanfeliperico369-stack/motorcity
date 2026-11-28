/* Motor City 6 · sonido/rodar.js — el sonido del rodar (y del motor), procedural y sin archivos: un oscilador con filtro
   cuyo tono y volumen siguen la velocidad (plan § 12: «el sonido del rodar»). Pide su AudioContext al guardián, así que
   calla al salir de la app. No suena hasta que el jugador lo enciende (los navegadores no dejan sonar sin un toque). */
import { guardian as guardianPagina } from './guardian.js';

export class SonidoRodar {
  constructor({ guardian } = {}) { this.g = guardian || null; this.ctx = null; this.activo = false; this.ganancia = null; this.osc = null; this.filtro = null; }
  async alternar() {
    if (this.activo) { this.activo = false; this.actualizar(0, false); return false; }
    try {
      const g = this.g || (this.g = guardianPagina());
      if (!this.ctx) {
        this.ctx = g.contexto(); if (!this.ctx) return false;
        this.osc = this.ctx.createOscillator(); this.osc.type = 'triangle';
        this.filtro = this.ctx.createBiquadFilter(); this.filtro.type = 'lowpass'; this.filtro.frequency.value = 140;
        this.ganancia = this.ctx.createGain(); this.ganancia.gain.value = 0;
        this.osc.connect(this.filtro).connect(this.ganancia).connect(this.ctx.destination); this.osc.start();
      }
      this.activo = await g.despertar(this.ctx); return this.activo;
    } catch { this.activo = false; return false; }
  }
  /** v: m/s; motor: si es un vehículo con motor (más grave y con más cuerpo) */
  actualizar(v, motor) {
    if (!this.ctx || !this.ganancia) return;
    const t = this.ctx.currentTime, volumen = this.activo ? Math.min(0.045, Math.max(0, v) * 0.003) : 0;
    this.osc.frequency.setTargetAtTime((motor ? 48 : 28) + v * (motor ? 6 : 3), t, 0.08);
    this.filtro.frequency.setTargetAtTime(100 + v * 12, t, 0.1);
    this.ganancia.gain.setTargetAtTime(volumen, t, 0.05);
  }
}
