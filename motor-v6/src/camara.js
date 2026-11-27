/* =====================================================================
   MOTOR 3D v6 · CÁMARA CENITAL ÚNICA INTELIGENTE (AUTO-SEGUIMIENTO GRADUAL)
   Cumple exactamente los dos pedidos del autor:
   1) Una sola cámara 3D cenital centrada que se acerca continuamente hasta
      «casi tercera persona» (72° → 34°), sin selectores de cámaras viejas.
   2) Según hacia dónde mire y se desplace el jugador, la cámara gira
      GRADUALMENTE detrás de su rumbo (auto-align con zona muerta y resorte
      amortiguado independiente de FPS), de modo que empujar hacia arriba
      SIEMPRE avanza hacia donde miras en pantalla.
   3) El jugador puede orbitar o inclinar manualmente al gusto (arrastre),
      y tras soltar retoma el seguimiento suave cuando vuelva a moverse.
   4) Spring-arm real contra terreno y edificios + desvanecimiento suave
      de oclusores (sin estática ajedrezada).
   ===================================================================== */

import * as THREE from '../../js/vendor/three-0.170.0.module.min.js';

function angDif(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

export class CamaraCenitalInteligente {
  constructor(threeCamera, { terreno = null, colisiones = [] } = {}) {
    this.cam = threeCamera;
    this.terreno = terreno;
    this.colisiones = colisiones; // [{ minX, maxX, minZ, maxZ, maxY, mesh }]

    // Estado principal
    this.yaw = 0.24;            // ángulo azimutal inicial que enmarca Skatepark + Puente 4 Sur + Metro
    this.zoom = 0.62;           // 0 = cenital lejos (72°), 0.5 = cenital medio, 1 = casi tercera persona (34°)
    this.zoomObj = 0.62;
    this.pitchOffset = 0;       // ajuste manual temporal de inclinación
    this.autoSeguir = true;     // rotación gradual hacia la dirección del jugador
    this.pausaManualSeg = 0;    // pausa breve tras giro manual del usuario

    // Posiciones suavizadas
    this.blanco = new THREE.Vector3(0, 3.2, 0);
    this.ojo = new THREE.Vector3(6, 22, 18);
    this.brazoFactor = 1.0;

    // Oclusores desvanecidos suavemente (material -> opacity original)
    this._oclusores = new Set();

    // Presets de zoom de la MISMA cámara única (para botón 🔍 o tecla C)
    this.PRESETS = [
      { zoom: 0.12, nombre: 'De lejos (cenital alta)' },
      { zoom: 0.45, nombre: 'Cenital equilibrada' },
      { zoom: 0.76, nombre: 'De cerca (acción)' },
      { zoom: 0.98, nombre: 'Casi tercera persona' },
    ];
  }

  /**
   * Base horizontal relativa a la cámara:
   * Empujar palanca / W hacia ARRIBA siempre mueve hacia `adelante` en pantalla.
   */
  getMoveBasis() {
    const adelante = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const derecha = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    return { adelante, derecha };
  }

  /** Giro manual del usuario (arrastre con dedo o clic derecho/Q-E) */
  orbitarManual(dYaw, dPitch = 0) {
    this.yaw += dYaw;
    this.pitchOffset = clamp(this.pitchOffset + dPitch, -0.22, 0.25);
    this.pausaManualSeg = 1.65; // respeta el encuadre elegido antes de retomar auto-seguimiento
  }

  /** Acercar o alejar continuamente (rueda, pellizco o botones +/-) */
  ajustarZoom(delta) {
    this.zoomObj = clamp(this.zoomObj + delta, 0.0, 1.0);
  }

  siguienteAcercamiento() {
    let mejor = 0, dist = 1e9;
    this.PRESETS.forEach((p, i) => {
      const d = Math.abs(this.zoomObj - p.zoom);
      if (d < dist) { dist = d; mejor = i; }
    });
    const sig = this.PRESETS[(mejor + 1) % this.PRESETS.length];
    this.zoomObj = sig.zoom;
    return sig;
  }

  /**
   * Actualiza la cámara cada cuadro con suavizado independiente de FPS.
   * @param {number} dt Segundos
   * @param {object} objetivo { pos: Vector3, vel: Vector3, rumbo: number, rapidez: number }
   */
  actualizar(dt, objetivo) {
    dt = Math.min(dt, 0.05);
    const kZoom = 1 - Math.exp(-dt * 7.5);
    this.zoom = lerp(this.zoom, this.zoomObj, kZoom);

    if (this.pausaManualSeg > 0) {
      this.pausaManualSeg = Math.max(0, this.pausaManualSeg - dt);
    }

    // 1. AUTO-SEGUIMIENTO GRADUAL HACIA DONDE SE MUEVE EL JUGADOR
    // Si el jugador se desplaza, la cámara gira gradualmente detrás de su rumbo.
    // Así jamás pelea contra un norte fijo ni vuelve engorroso cambiar de dirección.
    if (this.autoSeguir && this.pausaManualSeg <= 0 && objetivo.rapidez > 0.65) {
      // rumbo del jugador: 0 = -Z, +PI/2 = -X (convención atan2(-vx, -vz))
      const yawDeseado = objetivo.rumbo;
      const err = angDif(this.yaw, yawDeseado);
      // Zona muerta de 10° para micro-correcciones; giro más ágil al ir rápido o al estar más cerca
      const absErr = Math.abs(err);
      if (absErr > 0.17) {
        const pesoVel = clamp((objetivo.rapidez - 0.5) / 8.0, 0.25, 1.0);
        const pesoZoom = lerp(0.55, 1.35, this.zoom);
        // Si el jugador da media vuelta total (~180°), gira con suavidad sin marear
        const tasa = (1.15 + 1.45 * pesoVel) * pesoZoom;
        const paso = 1 - Math.exp(-dt * tasa);
        this.yaw += err * paso;
      }
      // Recobra suavemente pitchOffset hacia 0 al avanzar
      this.pitchOffset = lerp(this.pitchOffset, 0, 1 - Math.exp(-dt * 1.5));
    }

    // 2. CURVA CONTINUA: CENITAL ALTA (72°) → CASI TERCERA PERSONA (34°)
    const u = smoothstep(this.zoom);
    const pitch = clamp(lerp(1.26, 0.58, u) + this.pitchOffset, 0.42, 1.38); // rad (~72° → ~33°)
    const distBase = lerp(46.0, 9.2, u);
    const fov = lerp(38, 56, u); // lente más abierto al acercarse para dar sensación real de 3.ª persona
    const velExtra = clamp((objetivo.rapidez - 5) / 14, 0, 1);
    const distDeseada = distBase * (1 + velExtra * 0.22);

    // 3. PUNTO MIRADO (adelanto suave en la dirección del movimiento)
    const adelanto = clamp(objetivo.rapidez * lerp(0.45, 0.30, u), 0, 4.5);
    const tx = objetivo.pos.x - Math.sin(objetivo.rumbo) * adelanto;
    const tz = objetivo.pos.z - Math.cos(objetivo.rumbo) * adelanto;
    const ty = objetivo.pos.y + lerp(1.1, 1.55, u);

    const kPos = 1 - Math.exp(-dt * 9.5);
    this.blanco.x = lerp(this.blanco.x, tx, kPos);
    this.blanco.y = lerp(this.blanco.y, ty, kPos);
    this.blanco.z = lerp(this.blanco.z, tz, kPos);

    // 4. SPRING-ARM ANTI-COLISIÓN (la cámara nunca atraviesa montañas ni edificios)
    const dirAtrasX = Math.sin(this.yaw) * Math.cos(pitch);
    const dirAtrasY = Math.sin(pitch);
    const dirAtrasZ = Math.cos(this.yaw) * Math.cos(pitch);

    let brazoObj = 1.0;
    const muestras = 10;
    for (let i = 1; i <= muestras; i++) {
      const f = i / muestras;
      const px = this.blanco.x + dirAtrasX * distDeseada * f;
      const py = this.blanco.y + dirAtrasY * distDeseada * f;
      const pz = this.blanco.z + dirAtrasZ * distDeseada * f;

      if (this.terreno) {
        const sueloY = this.terreno.getHeight(px, pz) + 1.2;
        if (py < sueloY) {
          brazoObj = Math.min(brazoObj, Math.max(0.32, (i - 1) / muestras));
          break;
        }
      }
      for (const box of this.colisiones) {
        if (px >= box.minX - 0.6 && px <= box.maxX + 0.6 &&
            pz >= box.minZ - 0.6 && pz <= box.maxZ + 0.6 &&
            py < box.maxY + 0.8) {
          brazoObj = Math.min(brazoObj, Math.max(0.38, (i - 1) / muestras));
          break;
        }
      }
    }

    // Se acerca rápido si hay obstáculo, vuelve despacio al despejarse
    const kBrazo = brazoObj < this.brazoFactor ? (1 - Math.exp(-dt * 18)) : (1 - Math.exp(-dt * 4));
    this.brazoFactor = lerp(this.brazoFactor, brazoObj, kBrazo);

    const dFinal = distDeseada * this.brazoFactor;
    let ex = this.blanco.x + dirAtrasX * dFinal;
    let ey = this.blanco.y + dirAtrasY * dFinal;
    let ez = this.blanco.z + dirAtrasZ * dFinal;
    if (this.terreno) {
      ey = Math.max(ey, this.terreno.getHeight(ex, ez) + 1.35);
    }

    this.ojo.set(ex, ey, ez);
    this.cam.fov = lerp(this.cam.fov, fov, 1 - Math.exp(-dt * 6));
    this.cam.updateProjectionMatrix();
    this.cam.position.copy(this.ojo);
    this.cam.lookAt(this.blanco);

    // 5. DESVANECIMIENTO SUAVE DE OCLUSORES ENTRE CÁMARA Y JUGADOR (adiós tramado ajedrezado)
    this._actualizarOclusores(objetivo.pos);
  }

  _actualizarOclusores(posJug) {
    const tocados = new Set();
    const ox = this.ojo.x, oy = this.ojo.y, oz = this.ojo.z;
    const jx = posJug.x, jy = posJug.y + 1.2, jz = posJug.z;

    for (const box of this.colisiones) {
      if (!box.mesh) continue;
      // Prueba rápida de 4 muestras a lo largo del rayo cámara -> jugador
      let tapa = false;
      for (let s = 1; s <= 4; s++) {
        const t = s / 5;
        const px = ox + (jx - ox) * t;
        const py = oy + (jy - oy) * t;
        const pz = oz + (jz - oz) * t;
        if (px >= box.minX && px <= box.maxX && pz >= box.minZ && pz <= box.maxZ && py <= box.maxY) {
          tapa = true;
          break;
        }
      }
      if (tapa) tocados.add(box.mesh);
    }

    for (const m of this._oclusores) {
      if (!tocados.has(m)) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mt of mats) { mt.transparent = false; mt.opacity = 1.0; }
        this._oclusores.delete(m);
      }
    }
    for (const m of tocados) {
      // Clonar materiales la primera vez para no volver translúcidos otros edificios que los comparten
      if (!m.userData._matPropios) {
        m.material = Array.isArray(m.material) ? m.material.map((mt) => mt.clone()) : m.material.clone();
        m.userData._matPropios = true;
      }
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mt of mats) { mt.transparent = true; mt.opacity = 0.28; }
      this._oclusores.add(m);
    }
  }
}
