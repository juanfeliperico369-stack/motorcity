/* =====================================================================
   MOTOR 3D v6 · TOPOGRAFÍA Y RELIEVE 3D REAL DEL VALLE DE ABURRÁ
   Calcula altura exacta getHeight(x, z), normal getNormal(x, z) y
   pendiente en % a partir del DEM SRTM extraído + encajonamiento real
   del río Medellín + terrazas jugables (skatepark / avenidas) +
   laderas circundantes del Valle para que los altos y bajos se vean
   y se sientan de verdad en 3D.
   ===================================================================== */

import * as THREE from '../../js/vendor/three-0.170.0.module.min.js';

function smoothstep(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export class Terreno3D {
  /**
   * @param {object|null} datosHero JSON de hero-4sur.json (dem_rel_m, half_m, dem_n)
   */
  constructor(datosHero = null) {
    this.datos = datosHero;
    this.half = datosHero?.half_m || 220;
    this.n = datosHero?.dem_n || 33;
    this.dem = datosHero?.dem_rel_m || null;
    this.cotaBase = datosHero?.cota_base_msnm || 1497;
    this.exageracionRelieve = 1.35; // realce sutil para legibilidad cenital sin deformar escalas humanas
    // Cota de plataforma del Skatepark 4 Sur (en la margen oriental, sobre el río)
    this.nivelPlaza = 3.2;
    this.nivelRio = -2.4;
    this.rioX = -56; // eje del Río Medellín al oeste del skatepark
    this.rioAncho = 24;
  }

  _muestraDEM(x, z) {
    if (!this.dem) {
      // Topografía de respaldo del Valle de Aburrá (río en centro-oeste, laderas crecientes al este y oeste)
      const laderaEste = Math.max(0, (x - 40) * 0.085);
      const laderaOeste = Math.max(0, (-x - 85) * 0.095);
      const ondulacion = Math.sin(x * 0.018) * Math.cos(z * 0.016) * 2.2;
      return 3.0 + laderaEste + laderaOeste + ondulacion;
    }
    const u = Math.max(0, Math.min(1, (x + this.half) / (2 * this.half))) * (this.n - 1);
    const v = Math.max(0, Math.min(1, (z + this.half) / (2 * this.half))) * (this.n - 1);
    const ix = Math.min(this.n - 2, Math.floor(u));
    const iz = Math.min(this.n - 2, Math.floor(v));
    const fx = u - ix;
    const fz = v - iz;
    const a = this.dem[iz][ix];
    const b = this.dem[iz][ix + 1];
    const c = this.dem[iz + 1][ix];
    const d = this.dem[iz + 1][ix + 1];
    return ((a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz) * this.exageracionRelieve;
  }

  /**
   * Altura 3D exacta del suelo en metros (coordenada Y en Three.js).
   * Integra DEM real + terraza limpia del Skatepark 4 Sur + cauce del Río Medellín
   * + subida real hacia las laderas de El Poblado (este) y Belén/Guayabal (oeste).
   */
  getHeight(x, z) {
    let h = this._muestraDEM(x, z);

    // Subida adicional realista fuera del fondo plano del valle (> 170 m hacia las laderas)
    const distEje = Math.abs(x - this.rioX);
    if (distEje > 155) {
      const k = distEje - 155;
      h += Math.pow(k, 1.32) * 0.075 + Math.sin(z * 0.012 + x * 0.008) * Math.min(18, k * 0.06);
    }

    // Encajonamiento real del Río Medellín (corredor norte-sur ligeramente curvado)
    const rioCentro = this.rioX + Math.sin(z * 0.008) * 10;
    const dRio = Math.abs(x - rioCentro);
    const tRio = 1 - smoothstep(this.rioAncho * 0.5, this.rioAncho * 0.5 + 14, dRio);
    h = h * (1 - tRio) + this.nivelRio * tRio;

    // Terraza urbana del Skatepark 4 Sur + Avenida 4 Sur / línea de escala (plana y limpia para trucos)
    const dxS = Math.max(0, Math.abs(x - 4) - 34);
    const dzS = Math.max(0, Math.abs(z - 0) - 28);
    const dPlaza = Math.hypot(dxS, dzS);
    const tPlaza = 1 - smoothstep(0, 18, dPlaza);
    h = h * (1 - tPlaza) + this.nivelPlaza * tPlaza;

    // Aplanado suave de la avenida oriental de exhibición/circulación (x ≈ 52, z ∈ [-110..110])
    const dxAv = Math.max(0, Math.abs(x - 52) - 10);
    const dzAv = Math.max(0, Math.abs(z) - 110);
    const tAv = 1 - smoothstep(0, 14, Math.hypot(dxAv, dzAv));
    const hAv = this.nivelPlaza + smoothstep(-90, 90, z) * 4.2; // pendiente real de subida 2.3% hacia el sur
    h = h * (1 - tAv) + hAv * tAv;

    return h;
  }

  getNormal(x, z, eps = 0.75) {
    const hL = this.getHeight(x - eps, z);
    const hR = this.getHeight(x + eps, z);
    const hD = this.getHeight(x, z - eps);
    const hU = this.getHeight(x, z + eps);
    return new THREE.Vector3(hL - hR, 2 * eps, hD - hU).normalize();
  }

  getSlopePct(x, z) {
    const n = this.getNormal(x, z);
    return (Math.hypot(n.x, n.z) / Math.max(0.05, n.y)) * 100;
  }

  /**
   * Construye la malla 3D continua del terreno (zona detallada + valle amplio con montañas reales).
   */
  crearMalla(bancoTexturas) {
    const grupo = new THREE.Group();
    grupo.name = 'Topografia3D';

    const LADO = 1100; // 1.1 km × 1.1 km jugables/visibles
    const SEGS = 140;
    const geo = new THREE.PlaneGeometry(LADO, LADO, SEGS, SEGS);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cPasto = new THREE.Color('#5a8642');
    const cLadera = new THREE.Color('#3b6431');
    const cUrbano = new THREE.Color('#8e8b82');
    const cCauce = new THREE.Color('#5c5548');
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getHeight(x, z);
      pos.setY(i, y);

      const rioCentro = this.rioX + Math.sin(z * 0.008) * 10;
      const dRio = Math.abs(x - rioCentro);
      if (dRio < this.rioAncho * 0.5 + 4) {
        tmp.copy(cCauce);
      } else if (Math.abs(x) < 170 && Math.abs(z) < 170) {
        const t = smoothstep(3.5, 16, y);
        tmp.copy(cUrbano).lerp(cPasto, t * 0.75);
      } else {
        const t = smoothstep(10, 65, y);
        tmp.copy(cPasto).lerp(cLadera, t);
      }
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = bancoTexturas.material('pasto_valle', {
      repX: 46,
      repY: 46,
      roughness: 0.94,
      metalness: 0.0,
      bumpScale: 0.08,
    });
    mat.vertexColors = true;

    const malla = new THREE.Mesh(geo, mat);
    malla.receiveShadow = true;
    grupo.add(malla);

    // Lámina 3D del Río Medellín (nivel real bajo los puentes)
    const rioGeo = new THREE.PlaneGeometry(this.rioAncho + 4, LADO, 8, 64);
    rioGeo.rotateX(-Math.PI / 2);
    const rPos = rioGeo.attributes.position;
    for (let i = 0; i < rPos.count; i++) {
      const rz = rPos.getZ(i);
      rPos.setX(i, rPos.getX(i) + this.rioX + Math.sin(rz * 0.008) * 10);
      rPos.setY(i, this.nivelRio + 1.15);
    }
    rioGeo.computeVertexNormals();
    const rioMat = new THREE.MeshStandardMaterial({
      color: '#2e6f78',
      roughness: 0.25,
      metalness: 0.15,
    });
    const rio = new THREE.Mesh(rioGeo, rioMat);
    rio.receiveShadow = true;
    grupo.add(rio);

    // Cordilleras envolventes del Valle de Aburrá en el horizonte (anillo de cerros reales)
    const cordillera = this._crearCordilleraHorizonte();
    grupo.add(cordillera);

    return grupo;
  }

  _crearCordilleraHorizonte() {
    const segs = 72;
    const rIn = 520;
    const rOut = 980;
    const geo = new THREE.BufferGeometry();
    const verts = [];
    const cols = [];
    const idx = [];
    const cBase = new THREE.Color('#476b45');
    const cCumbre = new THREE.Color('#2d4d3a');

    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      // En Medellín las laderas altas están al Oriente (+X) y Occidente (-X); el valle abre al Norte/Sur
      const factorCordillera = 0.45 + 0.55 * Math.abs(ca);
      const pico = (115 + Math.sin(a * 5) * 32 + Math.cos(a * 11) * 18) * factorCordillera;
      verts.push(ca * rIn, 22, sa * rIn);
      cols.push(cBase.r, cBase.g, cBase.b);
      verts.push(ca * rOut, pico, sa * rOut);
      cols.push(cCumbre.r, cCumbre.g, cCumbre.b);
    }
    for (let i = 0; i < segs; i++) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.96,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geo, mat);
  }
}
