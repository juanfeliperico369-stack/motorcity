/* =====================================================================
   MOTOR 3D v6 · SISTEMA DE TEXTURAS DETALLADAS (WebP + Respaldo Procedural)
   Carga las 9 texturas PBR estilizadas de Medellín (114 KB total) con
   mipmaps, repetición sin costuras y filtro anisotrópico. Si se abre sin
   servidor o falla una imagen, genera el mismo patrón en CanvasTexture.
   ===================================================================== */

import * as THREE from '../../js/vendor/three-0.170.0.module.min.js';

const DEFINICIONES = {
  asfalto:             { archivo: 'asfalto.webp',             color: '#3c4047', rep: [1, 1] },
  ladrillo_paisa:      { archivo: 'ladrillo_paisa.webp',      color: '#b85a36', rep: [1, 1] },
  anden_medellin:      { archivo: 'anden_medellin.webp',      color: '#a9a7a0', rep: [1, 1] },
  concreto_skatepark:  { archivo: 'concreto_skatepark.webp',  color: '#c9c6be', rep: [1, 1] },
  teja_barro:          { archivo: 'teja_barro.webp',          color: '#a24628', rep: [1, 1] },
  pasto_valle:         { archivo: 'pasto_valle.webp',         color: '#467435', rep: [1, 1] },
  fachada_vidrio:      { archivo: 'fachada_vidrio.webp',      color: '#6b8598', rep: [1, 1] },
  fachada_residencial: { archivo: 'fachada_residencial.webp', color: '#d4b88d', rep: [1, 1] },
  adoquin_plaza:       { archivo: 'adoquin_plaza.webp',       color: '#6e6a63', rep: [1, 1] },
};

function texturaProcedural(nombre) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  const g = cv.getContext('2d');
  const def = DEFINICIONES[nombre] || { color: '#888888' };
  g.fillStyle = def.color;
  g.fillRect(0, 0, 256, 256);

  // Grano determinista sutil
  let seed = 1337;
  for (let i = 0; i < nombre.length; i++) seed = (seed * 31 + nombre.charCodeAt(i)) >>> 0;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  if (nombre === 'asfalto') {
    for (let i = 0; i < 1800; i++) {
      const v = 45 + Math.floor(rnd() * 35);
      g.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
      g.fillRect(rnd() * 256, rnd() * 256, 2, 2);
    }
    g.fillStyle = 'rgba(235,235,225,0.75)';
    g.fillRect(8, 0, 5, 256);
    g.fillRect(243, 0, 5, 256);
    for (let y = 12; y < 256; y += 64) g.fillRect(125, y, 6, 36);
  } else if (nombre === 'ladrillo_paisa') {
    g.fillStyle = '#927f6f';
    g.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 16; row++) {
      const off = (row % 2) * 32;
      for (let col = -1; col < 5; col++) {
        const lum = Math.floor((rnd() - 0.5) * 34);
        g.fillStyle = `rgb(${182 + lum},${86 + Math.floor(lum * 0.6)},${50 + Math.floor(lum * 0.4)})`;
        g.fillRect(col * 64 + off + 2, row * 16 + 2, 60, 12);
      }
    }
  } else if (nombre === 'concreto_skatepark') {
    for (let i = 0; i < 900; i++) {
      const v = 185 + Math.floor(rnd() * 28);
      g.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
      g.fillRect(rnd() * 256, rnd() * 256, 3, 3);
    }
    g.strokeStyle = 'rgba(70,70,70,0.45)';
    g.lineWidth = 2;
    g.strokeRect(1, 1, 126, 126);
    g.strokeRect(129, 129, 126, 126);
  } else if (nombre === 'fachada_vidrio' || nombre === 'fachada_residencial') {
    const esVidrio = nombre === 'fachada_vidrio';
    for (let y = 14; y < 256; y += 64) {
      for (let x = 14; x < 256; x += 64) {
        g.fillStyle = esVidrio ? '#3e5e78' : '#503d2e';
        g.fillRect(x, y, 40, 44);
        g.fillStyle = esVidrio ? '#90b9d6' : '#80644c';
        g.fillRect(x + 4, y + 4, 32, 36);
        g.strokeStyle = esVidrio ? '#d8dfe4' : '#2a2a2a';
        g.lineWidth = 2;
        g.strokeRect(x, y, 40, 44);
      }
    }
  } else if (nombre === 'teja_barro') {
    for (let x = 0; x < 256; x += 24) {
      const grad = g.createLinearGradient(x, 0, x + 24, 0);
      grad.addColorStop(0, '#78301a');
      grad.addColorStop(0.5, '#c45b36');
      grad.addColorStop(1, '#6a2815');
      g.fillStyle = grad;
      g.fillRect(x, 0, 24, 256);
    }
    g.strokeStyle = 'rgba(40,12,6,0.35)';
    for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  } else {
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)';
      g.fillRect(rnd() * 256, rnd() * 256, 4, 4);
    }
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

export class BancoTexturas {
  constructor(renderer, rutaBase = './arte/texturas/') {
    this.renderer = renderer;
    this.rutaBase = rutaBase;
    this.maxAniso = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
    this.cache = new Map();
    this.loader = new THREE.TextureLoader();
  }

  obtener(nombre, repX = 1, repY = 1) {
    const clave = `${nombre}:${repX}:${repY}`;
    if (this.cache.has(clave)) return this.cache.get(clave);

    const def = DEFINICIONES[nombre];
    const base = texturaProcedural(nombre);
    base.repeat.set(repX, repY);
    base.anisotropy = this.maxAniso;
    this.cache.set(clave, base);

    if (def && typeof fetch === 'function') {
      const url = this.rutaBase + def.archivo;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        base.image = img;
        base.needsUpdate = true;
      };
      img.src = url;
    }
    return base;
  }

  material(nombre, { repX = 1, repY = 1, roughness = 0.85, metalness = 0.05, color = 0xffffff, bumpScale = 0.02 } = {}) {
    const map = this.obtener(nombre, repX, repY);
    return new THREE.MeshStandardMaterial({
      map,
      color,
      roughness,
      metalness,
      bumpMap: map,
      bumpScale,
    });
  }
}
