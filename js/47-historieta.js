/* =====================================================================
   VISTA «HISTORIETA» (5.0 · G5-01 · Gemini Antigravity)
   Idea de GTA: Chinatown Wars en sala limpia:
   1. Perfil de cámara 'historieta' en js/34-camara.js: inclinada a ~55° (0.96 rad)
      desde arriba, que gira suave con el rumbo del carro (giraRumbo: true).
   2. Opción 'historieta' en ⚙️ Flexibilidad → 🖼️ Gráficos (js/37-flexibilidad.js).
   3. Contorno negro con casco invertido 3D (THREE.BackSide expandido en el plano
      horizontal con sesgo de profundidad en vista para no tapar techos CW) sobre
      las mallas dinámicas en three.js (sin tocar js/45-tres.js) + pase de colores
      planos (cel-shading en bandas) y contorno Sobel/Roberts en tinta negra
      (#0c0e14) legible a 412 px.
   ===================================================================== */
const Historieta = {
  version: '5.0.0-g5-01',
  umbralBorde: 44,
  umbralTintaFuerte: 98,
  bandasCel: 4,
  saturacion: 1.25,
  grosorCasco: .18,
  _lum: null,
  _bufOrig: null,
  _cvProc: null,
  _ctxProc: null,
  metricas: {
    activo: false,
    cascoTres: false,
    pixelesContorno: 0,
    pctContorno: 0,
    coloresPlanos: 0,
    msUltimoCuadro: 0
  },

  /* Determina si el modo Historieta está activo por ⚙️ Gráficos o por perfil de cámara */
  activo(E) {
    const porGraf = !!(MC.opciones && MC.opciones.graficos === 'historieta');
    const porCam = !!(E && E.camara && E.camara.perfil === 'historieta');
    return porGraf || porCam;
  },

  /* Crea el material de casco invertido 3D (THREE.BackSide) que expande la silueta horizontal sin tapar caras superiores CW */
  _crearMatCasco(T, grosor, sesgoZ) {
    const m = new T.MeshBasicMaterial({
      color: 0x0c0e14,
      side: T.BackSide,
      fog: true,
      polygonOffset: true,
      polygonOffsetFactor: 4,
      polygonOffsetUnits: 4
    });
    m.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\ntransformed.xz += normal.xz * ' + grosor.toFixed(3) + ';\ntransformed.y -= 0.04;'
        )
        .replace(
          '#include <project_vertex>',
          'vec4 mvPosition = vec4( transformed, 1.0 );\n#ifdef USE_BATCHING\n  mvPosition = batchingMatrix * mvPosition;\n#endif\n#ifdef USE_INSTANCING\n  mvPosition = instanceMatrix * mvPosition;\n#endif\nmvPosition = modelViewMatrix * mvPosition;\nmvPosition.z -= ' + sesgoZ.toFixed(3) + ';\ngl_Position = projectionMatrix * mvPosition;'
        );
    };
    return m;
  },

  /* Crea o actualiza el casco invertido 3D (THREE.BackSide) para vehículos y actores dinámicos en VistaTres sin tocar matCosas */
  aplicarCascoTres(vt, encender) {
    if (!vt || !vt.tres || typeof THREE === 'undefined') return false;
    const T = THREE;
    if (!encender || !vt.dyn || !vt.dyn.visible) {
      if (vt._cascoDyn) vt._cascoDyn.visible = false;
      this.metricas.cascoTres = false;
      return false;
    }

    if (!vt._cascoMat) {
      vt._cascoMat = this._crearMatCasco(T, this.grosorCasco, .95);
    }

    if (!vt._cascoDyn) {
      vt._cascoDyn = new T.Mesh(vt.dyn.geometry, vt._cascoMat);
      vt._cascoDyn.frustumCulled = false;
      vt._cascoDyn.castShadow = false;
      vt._cascoDyn.receiveShadow = false;
      vt.escena.add(vt._cascoDyn);
    } else if (vt._cascoDyn.geometry !== vt.dyn.geometry) {
      vt._cascoDyn.geometry = vt.dyn.geometry;
    }
    vt._cascoDyn.visible = true;
    this.metricas.cascoTres = true;
    return true;
  },

  /* Pase de colores planos (posterización cel-shading) y contorno negro Sobel/Roberts en búfer con willReadFrequently */
  procesarLienzo(g, W, H) {
    if (!g || !g.canvas || W < 16 || H < 16) return;
    const t0 = MC.ahora();
    const esc = Math.min(1, 360 / Math.min(W, H));
    const w = Math.max(64, Math.round(W * esc)), h = Math.max(64, Math.round(H * esc));
    if (!this._cvProc || this._cvProc.width !== w || this._cvProc.height !== h) {
      this._cvProc = document.createElement('canvas');
      this._cvProc.width = w;
      this._cvProc.height = h;
      this._ctxProc = this._cvProc.getContext('2d', { willReadFrequently: true });
    }
    const q = this._ctxProc;
    if (!q) return;
    q.globalCompositeOperation = 'copy';
    q.imageSmoothingEnabled = true;
    q.drawImage(g.canvas, 0, 0, w, h);

    let img;
    try { img = q.getImageData(0, 0, w, h); } catch (e) { return; }
    const d = img.data, nPx = w * h;
    if (!this._lum || this._lum.length < nPx) {
      this._lum = new Uint8Array(nPx);
      this._bufOrig = new Uint8ClampedArray(nPx * 4);
    }
    const L = this._lum, orig = this._bufOrig;
    orig.set(d);
    for (let p = 0, i = 0; p < nPx; p++, i += 4) {
      L[p] = (orig[i] * 77 + orig[i + 1] * 150 + orig[i + 2] * 29) >> 8;
    }

    const w4 = w << 2, umb = this.umbralBorde, span = Math.max(1, this.umbralTintaFuerte - umb);
    const sat = this.saturacion;
    let nContorno = 0, nPlanos = 0;

    for (let y = 1; y < h - 1; y++) {
      const fila = y * w;
      for (let x = 1; x < w - 1; x++) {
        const p = fila + x, i = p << 2;
        const l0 = L[p];
        const gx = Math.abs(L[p + 1] - L[p - 1]) + (Math.abs(L[p - w + 1] - L[p - w - 1]) >> 1) + (Math.abs(L[p + w + 1] - L[p + w - 1]) >> 1);
        const gy = Math.abs(L[p + w] - L[p - w]) + (Math.abs(L[p + w - 1] - L[p - w - 1]) >> 1) + (Math.abs(L[p + w + 1] - L[p - w + 1]) >> 1);
        const dc = (Math.abs(orig[i + 4] - orig[i - 4]) + Math.abs(orig[i + 5] - orig[i - 3]) + Math.abs(orig[i + w4] - orig[i - w4])) >> 2;
        const borde = gx + gy + dc;

        if (borde > umb) {
          nContorno++;
          const t = borde >= this.umbralTintaFuerte ? .94 : ((borde - umb) / span) * .94;
          const k = 1 - t;
          d[i] = (orig[i] * k + 12 * t) | 0;
          d[i + 1] = (orig[i + 1] * k + 14 * t) | 0;
          d[i + 2] = (orig[i + 2] * k + 20 * t) | 0;
        } else {
          nPlanos++;
          const lq = (((l0 + 22) / 52) | 0) * 52 + 18;
          const kLuz = l0 > 6 ? lq / l0 : 1;
          let r = orig[i] * kLuz, gg = orig[i + 1] * kLuz, b = orig[i + 2] * kLuz;
          r = lq + (r - lq) * sat;
          gg = lq + (gg - lq) * sat;
          b = lq + (b - lq) * sat;
          d[i] = ((clamp(r, 0, 255) | 0) & 240) + 8;
          d[i + 1] = ((clamp(gg, 0, 255) | 0) & 240) + 8;
          d[i + 2] = ((clamp(b, 0, 255) | 0) & 240) + 8;
        }
      }
    }
    q.putImageData(img, 0, 0);
    g.save();
    g.imageSmoothingEnabled = true;
    g.drawImage(this._cvProc, 0, 0, W, H);
    g.restore();

    this.metricas.pixelesContorno = nContorno;
    this.metricas.pctContorno = +(nContorno / Math.max(1, (w - 2) * (h - 2)) * 100).toFixed(2);
    this.metricas.coloresPlanos = nPlanos;
    this.metricas.msUltimoCuadro = +(MC.ahora() - t0).toFixed(2);
  }
};

/* Envolturas limpias sobre VistaTres y Vistas sin tocar js/45-tres.js */
if (typeof VistaTres !== 'undefined' && VistaTres.prototype) {
  if (VistaTres.prototype._ponerDinamico) {
    const _ponerDynOrig = VistaTres.prototype._ponerDinamico;
    VistaTres.prototype._ponerDinamico = function (D) {
      const r = _ponerDynOrig.call(this, D);
      Historieta.aplicarCascoTres(this, MC.opciones && MC.opciones.graficos === 'historieta');
      return r;
    };
  }
  if (VistaTres.prototype.dibujar) {
    const _dibTresOrig = VistaTres.prototype.dibujar;
    VistaTres.prototype.dibujar = function (W, H, E, op = {}) {
      const activo = Historieta.activo(E);
      if (activo && this.regiones && this.regiones.size < 6) {
        op = Object.assign({}, op, { presupuesto: Math.max(op.presupuesto || 8, 95) });
      }
      return _dibTresOrig.call(this, W, H, E, op);
    };
  }
  if (VistaTres.prototype.liberar) {
    const _libTresOrig = VistaTres.prototype.liberar;
    VistaTres.prototype.liberar = function () {
      if (this._cascoDyn) {
        try { this.escena.remove(this._cascoDyn); } catch (e) {}
        this._cascoDyn = null;
      }
      return _libTresOrig.call(this);
    };
  }
}

if (typeof Vistas !== 'undefined' && Vistas.prototype) {
  const _hayGLOrig = Vistas.prototype.hayGL;
  Vistas.prototype.hayGL = function () {
    const gr = MC.opciones && MC.opciones.graficos;
    if (gr === 'historieta' && !this.glIntentado) {
      MC.opciones.graficos = 'realistas';
      const ok = _hayGLOrig.call(this);
      MC.opciones.graficos = 'historieta';
      return ok;
    }
    return _hayGLOrig.call(this);
  };

  const _dibujarVistasOrig = Vistas.prototype.dibujar;
  Vistas.prototype.dibujar = function (g, W, H, E, dt = 1 / 60) {
    const activo = Historieta.activo(E);
    Historieta.metricas.activo = activo;
    if (this.gl && this.gl.tres) {
      Historieta.aplicarCascoTres(this.gl, activo);
    }
    const ms = _dibujarVistasOrig.call(this, g, W, H, E, dt);
    if (activo) {
      Historieta.procesarLienzo(g, W, H);
    } else {
      Historieta.metricas.pixelesContorno = 0;
      Historieta.metricas.pctContorno = 0;
    }
    return ms;
  };
}

MC.Historieta = Historieta;
