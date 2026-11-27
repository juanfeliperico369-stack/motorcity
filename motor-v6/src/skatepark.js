/* =====================================================================
   MOTOR 3D v6 · SKATEPARK 3D REAL Y PARADAS DE TRUCOS (PUENTE 4 SUR)
   Geometría 3D 100 % real y transitable (nada pintado en el suelo):
   - Losa de concreto con juntas de dilatación y marcas de ruedas
   - 2 Quarter-pipes curvos con lanzamiento vertical físico real
   - Funbox / pirámide central con rampas y mesa superior
   - Gradas y ledges con borde amarillo (parkour + skate)
   - 3 Barandas metálicas rojas con enganche magnético para Grind (50-50 / Boardslide)
   - Bloques de Parkour (muro bajo de bóveda 0,90 m + plataforma de trepado 1,85 m)
   - 3 Paradas interactivas de trucos (retos jugables con puntaje y combo)
   ===================================================================== */

import * as THREE from '../../js/vendor/three-0.170.0.module.min.js';

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

export class Skatepark3D {
  constructor(centroX = 4, centroZ = 0, nivelBase = 3.2) {
    this.cx = centroX;
    this.cz = centroZ;
    this.y0 = nivelBase;

    // Superficies transitables (rampas, plataformas, ledges, escalas)
    this.superficies = [];
    // Obstáculos para bóveda (vault) / trepado (mantle) / colisión lateral
    this.bloquesParkour = [];
    // Barandas de grind (segmentos 3D reales)
    this.barandas = [];
    // Paradas de trucos jugables
    this.paradas = [];
  }

  construir(bancoTexturas) {
    const grupo = new THREE.Group();
    grupo.name = 'Skatepark4Sur';

    const matConcreto = bancoTexturas.material('concreto_skatepark', {
      repX: 10, repY: 8, roughness: 0.78, metalness: 0.04, bumpScale: 0.03,
    });
    const matConcretoRampa = bancoTexturas.material('concreto_skatepark', {
      repX: 1.5, repY: 1.5, roughness: 0.72, metalness: 0.05, color: 0xe3dfd5, bumpScale: 0.025,
    });
    // ExtrudeGeometry genera UVs en metros reales (1 UV/m): dividir repetición por ~5 evita rejilla minúscula
    const matConcretoExtrude = bancoTexturas.material('concreto_skatepark', {
      repX: 0.22, repY: 0.22, roughness: 0.72, metalness: 0.05, color: 0xe3dfd5, bumpScale: 0.02,
    });
    const matAmarillo = new THREE.MeshStandardMaterial({ color: 0xf4c430, roughness: 0.45, metalness: 0.15 });
    const matAceroRojo = new THREE.MeshStandardMaterial({ color: 0xd93829, roughness: 0.32, metalness: 0.65 });
    const matAcero = new THREE.MeshStandardMaterial({ color: 0xcfd6dc, roughness: 0.25, metalness: 0.85 });
    const matLadrillo = bancoTexturas.material('ladrillo_paisa', { repX: 3, repY: 1, roughness: 0.88 });

    // 1. Losa principal del Skatepark (56 m × 44 m, espesor 0,40 m)
    const losa = new THREE.Mesh(new THREE.BoxGeometry(56, 0.4, 44), matConcreto);
    losa.position.set(this.cx, this.y0 - 0.18, this.cz);
    losa.receiveShadow = true;
    grupo.add(losa);

    // Muro perimetral bajo de ladrillo paisa con borde de concreto (estética cívica)
    const bordeN = new THREE.Mesh(new THREE.BoxGeometry(56.4, 0.55, 0.45), matLadrillo);
    bordeN.position.set(this.cx, this.y0 + 0.27, this.cz - 22.1);
    bordeN.castShadow = true; bordeN.receiveShadow = true;
    grupo.add(bordeN);

    // 2. Dos Quarter-Pipes curvos enfrentados (Norte y Sur del skatepark)
    this._agregarQuarterPipe(grupo, matConcretoExtrude, matAcero, {
      x: this.cx - 10, z: this.cz - 16, ancho: 14, fondo: 5.2, alto: 2.35, dirZ: 1, // mira hacia +Z
    });
    this._agregarQuarterPipe(grupo, matConcretoExtrude, matAcero, {
      x: this.cx - 10, z: this.cz + 16, ancho: 14, fondo: 5.2, alto: 2.35, dirZ: -1, // mira hacia -Z
    });

    // 3. Funbox central (rampa oeste + plataforma plana + rampa este)
    this._agregarFunbox(grupo, matConcretoRampa, matConcretoExtrude, matAmarillo, {
      x: this.cx - 8, z: this.cz, anchoMesa: 6.0, fondoMesa: 5.0, rampaL: 3.6, alto: 1.25,
    });

    // 4. Tres Barandas metálicas rojas de Grind (reales y saltables)
    this._agregarBaranda(grupo, matAceroRojo, {
      id: 'rail_central', nombre: 'Baranda Roja Central',
      x0: this.cx + 4.5, z0: this.cz - 6.5, y0: this.y0 + 0.62,
      x1: this.cx + 4.5, z1: this.cz + 6.5, y1: this.y0 + 0.62,
    });
    this._agregarBaranda(grupo, matAceroRojo, {
      id: 'rail_funbox', nombre: 'Baranda del Funbox',
      x0: this.cx - 12.6, z0: this.cz + 2.8, y0: this.y0 + 0.55,
      x1: this.cx - 3.4, z1: this.cz + 2.8, y1: this.y0 + 0.55,
    });
    this._agregarBaranda(grupo, matAceroRojo, {
      id: 'rail_bajada', nombre: 'Baranda en Bajada (Escalas)',
      x0: this.cx + 15.5, z0: this.cz - 4.0, y0: this.y0 + 1.55,
      x1: this.cx + 15.5, z1: this.cz + 3.5, y1: this.y0 + 0.52,
    });

    // 5. Escalas urbanas con borde amarillo + terraza elevada de 1,05 m (para Ollie / manual / parkour)
    this._agregarEscalasYTerraza(grupo, matConcretoRampa, matAmarillo, {
      x: this.cx + 18, z: this.cz - 8, ancho: 9, fondoTerraza: 7, alto: 1.05,
    });

    // 6. Zona de Parkour dedicada (muros de bóveda 0,90 m + bloques de trepado 1,85 m + gap de salto)
    this._agregarBloqueParkour(grupo, matConcretoRampa, matAmarillo, {
      x: this.cx + 12, z: this.cz + 11, w: 5.5, d: 0.75, h: 0.92, tipo: 'boveda', nombre: 'Muro de Bóveda',
    });
    this._agregarBloqueParkour(grupo, matConcretoRampa, matAmarillo, {
      x: this.cx + 19, z: this.cz + 11, w: 4.5, d: 4.0, h: 1.80, tipo: 'trepado', nombre: 'Bloque de Trepado',
    });
    this._agregarBloqueParkour(grupo, matConcretoRampa, matAmarillo, {
      x: this.cx + 19, z: this.cz + 17.6, w: 4.5, d: 3.4, h: 1.80, tipo: 'trepado', nombre: 'Salto Gap Parkour',
    });

    // 7. Tres Paradas de Trucos (anillos cívicos luminosos que reaccionan al truco pedido)
    this._agregarParada(grupo, {
      id: 'parada_funbox',
      titulo: 'Parada 1 · Salto en el Funbox',
      objetivo: 'Haz un Ollie o Kickflip sobre el Funbox central',
      requisito: 'aire',
      x: this.cx - 8, z: this.cz, y: this.y0 + 1.28, r: 4.5, color: 0x38d9a9,
    });
    this._agregarParada(grupo, {
      id: 'parada_rail',
      titulo: 'Parada 2 · Grind en Baranda Roja',
      objetivo: 'Salta a la baranda roja y encadena un 50-50 Grind',
      requisito: 'grind',
      x: this.cx + 4.5, z: this.cz, y: this.y0 + 0.08, r: 4.8, color: 0xff922b,
    });
    this._agregarParada(grupo, {
      id: 'parada_parkour',
      titulo: 'Parada 3 · Bóveda y Trepado Parkour',
      objetivo: 'Haz una bóveda sobre el muro o trepa la plataforma de 1,8 m',
      requisito: 'parkour',
      x: this.cx + 15.5, z: this.cz + 11, y: this.y0 + 0.08, r: 5.2, color: 0x4dabf7,
    });

    return grupo;
  }

  _agregarMarcoAmarillo(grupo, matAmarillo, x, topY, z, w, d) {
    const t = 0.14;
    const h = 0.07;
    const n = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, h, t), matAmarillo);
    n.position.set(x, topY - h / 2 + 0.01, z - d / 2 + t / 2);
    const s = n.clone(); s.position.z = z + d / 2 - t / 2;
    const o = new THREE.Mesh(new THREE.BoxGeometry(t, h, d + 0.04), matAmarillo);
    o.position.set(x - w / 2 + t / 2, topY - h / 2 + 0.01, z);
    const e = o.clone(); e.position.x = x + w / 2 - t / 2;
    grupo.add(n, s, o, e);
  }

  _agregarQuarterPipe(grupo, matConcreto, matAcero, { x, z, ancho, fondo, alto, dirZ }) {
    // Malla curva real (perfil parabólico) con deck superior de 1,3 m
    const shape = new THREE.Shape();
    const deck = 1.3;
    const curvaL = fondo - deck;
    shape.moveTo(0, 0);
    shape.lineTo(fondo, 0);
    shape.lineTo(fondo, alto);
    shape.lineTo(curvaL, alto);
    const pasos = 10;
    for (let i = 1; i <= pasos; i++) {
      const t = i / pasos; // 0 = arriba, 1 = piso
      const px = curvaL * (1 - t);
      const py = alto * Math.pow(1 - t, 2.05);
      shape.lineTo(px, py);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, { depth: ancho, bevelEnabled: false });
    geo.translate(0, 0, -ancho / 2);
    // Orientar para que la cara curva apunte hacia dirZ (+Z o -Z)
    if (dirZ > 0) {
      geo.rotateY(Math.PI / 2); // +X local -> -Z mundo, así que 0 local queda en +Z
    } else {
      geo.rotateY(-Math.PI / 2);
    }
    const mesh = new THREE.Mesh(geo, matConcreto);
    mesh.position.set(x, this.y0, z + (dirZ > 0 ? fondo * 0.5 : -fondo * 0.5));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    grupo.add(mesh);

    // Tubo metálico de coping en el borde superior
    const copingZ = z + (dirZ > 0 ? (fondo * 0.5 - curvaL) : -(fondo * 0.5 - curvaL));
    const coping = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, ancho, 10), matAcero);
    coping.rotation.z = Math.PI / 2;
    coping.position.set(x, this.y0 + alto, copingZ);
    grupo.add(coping);

    // Registrar superficie física evaluable
    const minX = x - ancho / 2, maxX = x + ancho / 2;
    const zBase = z + (dirZ > 0 ? fondo * 0.5 : -fondo * 0.5);
    const zFin = z + (dirZ > 0 ? -fondo * 0.5 : fondo * 0.5);
    const minZ = Math.min(zBase, zFin), maxZ = Math.max(zBase, zFin);

    this.superficies.push({
      tipo: 'quarter',
      minX, maxX, minZ, maxZ,
      altura: (px, pz) => {
        const dDesdeBoca = dirZ > 0 ? (zBase - pz) : (pz - zBase);
        if (dDesdeBoca < 0 || dDesdeBoca > fondo) return null;
        if (dDesdeBoca >= curvaL) return this.y0 + alto;
        const u = clamp(dDesdeBoca / curvaL, 0, 1);
        return this.y0 + alto * Math.pow(u, 2.05);
      },
      impulsoSalto: 1.38,
    });
  }

  _agregarFunbox(grupo, matConcreto, matConcretoExtrude, matAmarillo, { x, z, anchoMesa, fondoMesa, rampaL, alto }) {
    // Mesa central de concreto con marco amarillo perimetral (la losa superior se ve de concreto real)
    const mesa = new THREE.Mesh(new THREE.BoxGeometry(anchoMesa, alto, fondoMesa), matConcreto);
    mesa.position.set(x, this.y0 + alto / 2, z);
    mesa.castShadow = true; mesa.receiveShadow = true;
    grupo.add(mesa);
    this._agregarMarcoAmarillo(grupo, matAmarillo, x, this.y0 + alto, z, anchoMesa, fondoMesa);

    // Rampas laterales en -X y +X (cuñas extruidas con UV en escala real)
    const crearCuna = (dirX) => {
      const s = new THREE.Shape();
      s.moveTo(0, 0); s.lineTo(rampaL, 0); s.lineTo(0, alto); s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: fondoMesa, bevelEnabled: false });
      g.translate(0, 0, -fondoMesa / 2);
      if (dirX < 0) g.rotateY(Math.PI);
      const m = new THREE.Mesh(g, matConcretoExtrude);
      m.position.set(x + dirX * (anchoMesa / 2), this.y0, z);
      m.castShadow = true; m.receiveShadow = true;
      grupo.add(m);
    };
    crearCuna(-1);
    crearCuna(1);

    const hwMesa = anchoMesa / 2;
    const hwTot = hwMesa + rampaL;
    const hd = fondoMesa / 2;
    this.superficies.push({
      tipo: 'funbox',
      minX: x - hwTot, maxX: x + hwTot, minZ: z - hd, maxZ: z + hd,
      altura: (px, pz) => {
        const dx = Math.abs(px - x);
        if (dx <= hwMesa) return this.y0 + alto;
        const u = clamp(1 - (dx - hwMesa) / rampaL, 0, 1);
        return this.y0 + alto * u;
      },
      impulsoSalto: 1.24,
    });
  }

  _agregarEscalasYTerraza(grupo, matConcreto, matAmarillo, { x, z, ancho, fondoTerraza, alto }) {
    const terraza = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, fondoTerraza), matConcreto);
    terraza.position.set(x, this.y0 + alto / 2, z);
    terraza.castShadow = true; terraza.receiveShadow = true;
    grupo.add(terraza);

    const escalones = 5;
    const pasoZ = 0.65;
    for (let i = 0; i < escalones; i++) {
      const h = alto * (1 - (i + 1) / (escalones + 1));
      const ez = z + fondoTerraza / 2 + (i + 0.5) * pasoZ;
      const esc = new THREE.Mesh(new THREE.BoxGeometry(ancho, h, pasoZ), matConcreto);
      esc.position.set(x, this.y0 + h / 2, ez);
      esc.castShadow = true; esc.receiveShadow = true;
      grupo.add(esc);
      const filo = new THREE.Mesh(new THREE.BoxGeometry(ancho + 0.04, 0.05, 0.08), matAmarillo);
      filo.position.set(x, this.y0 + h - 0.02, ez + pasoZ / 2 - 0.04);
      grupo.add(filo);
    }

    const totalEsc = escalones * pasoZ;
    this.superficies.push({
      tipo: 'terraza_escalas',
      minX: x - ancho / 2, maxX: x + ancho / 2,
      minZ: z - fondoTerraza / 2, maxZ: z + fondoTerraza / 2 + totalEsc,
      altura: (px, pz) => {
        if (pz <= z + fondoTerraza / 2) return this.y0 + alto;
        const u = clamp(1 - (pz - (z + fondoTerraza / 2)) / totalEsc, 0, 1);
        return this.y0 + alto * u;
      },
      impulsoSalto: 1.08,
    });
  }

  _agregarBaranda(grupo, matAceroRojo, def) {
    const a = new THREE.Vector3(def.x0, def.y0, def.z0);
    const b = new THREE.Vector3(def.x1, def.y1, def.z1);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);

    const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, len, 10), matAceroRojo);
    tubo.position.copy(mid);
    tubo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    tubo.castShadow = true;
    grupo.add(tubo);

    // Soportes verticales en extremos y centro
    for (const f of [0.06, 0.5, 0.94]) {
      const p = new THREE.Vector3().lerpVectors(a, b, f);
      const hSop = Math.max(0.25, p.y - this.y0);
      const sop = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, hSop, 8), matAceroRojo);
      sop.position.set(p.x, this.y0 + hSop / 2, p.z);
      sop.castShadow = true;
      grupo.add(sop);
    }

    this.barandas.push({ ...def, a, b, dirNorm: dir.clone().normalize(), len });
  }

  _agregarBloqueParkour(grupo, matConcreto, matAmarillo, { x, z, w, d, h, tipo, nombre }) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matConcreto);
    mesh.position.set(x, this.y0 + h / 2, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    grupo.add(mesh);

    this._agregarMarcoAmarillo(grupo, matAmarillo, x, this.y0 + h, z, w, d);

    const minX = x - w / 2, maxX = x + w / 2, minZ = z - d / 2, maxZ = z + d / 2;
    this.bloquesParkour.push({ minX, maxX, minZ, maxZ, yBase: this.y0, topY: this.y0 + h, h, tipo, nombre });
    this.superficies.push({
      tipo: 'plataforma',
      minX, maxX, minZ, maxZ,
      altura: () => this.y0 + h,
      impulsoSalto: 1.0,
    });
  }

  _agregarParada(grupo, def) {
    const anillo = new THREE.Mesh(
      new THREE.RingGeometry(def.r - 0.25, def.r, 32),
      new THREE.MeshBasicMaterial({ color: def.color, side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
    );
    anillo.rotation.x = -Math.PI / 2;
    anillo.position.set(def.x, def.y + 0.04, def.z);
    grupo.add(anillo);

    // Baliza vertical sutil
    const poste = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.45 })
    );
    poste.position.set(def.x + def.r - 0.3, def.y + 1.1, def.z);
    grupo.add(poste);

    this.paradas.push({ ...def, completada: false, meshAnillo: anillo, meshPoste: poste });
  }

  /**
   * Devuelve la altura más alta de superficie transitable del skatepark en (x, z)
   * que el jugador pueda pisar desde `piesY` (no te teletransporta arriba de muros de 1,8 m).
   */
  evaluarSuperficie(x, z, piesY) {
    let mejorY = null;
    let impulso = 1.0;
    let tipo = null;
    for (const s of this.superficies) {
      if (x < s.minX || x > s.maxX || z < s.minZ || z > s.maxZ) continue;
      const h = s.altura(x, z);
      if (h == null) continue;
      // Solo pisa superficies que estén a lo sumo 0,55 m arriba de los pies (escalones/rampas)
      if (h <= piesY + 0.58 && (mejorY == null || h > mejorY)) {
        mejorY = h;
        impulso = s.impulsoSalto || 1.0;
        tipo = s.tipo;
      }
    }
    return mejorY == null ? null : { y: mejorY, impulso, tipo };
  }

  /** Busca la baranda más cercana para enganchar Grind si el jugador está cayendo/saltando sobre ella */
  buscarBaranda(pos, radio = 0.72) {
    let mejor = null, mejorD = radio;
    const p = new THREE.Vector3();
    for (const b of this.barandas) {
      const abx = b.b.x - b.a.x, abz = b.b.z - b.a.z;
      const l2 = abx * abx + abz * abz || 1;
      const t = clamp(((pos.x - b.a.x) * abx + (pos.z - b.a.z) * abz) / l2, 0.02, 0.98);
      p.lerpVectors(b.a, b.b, t);
      const dHor = Math.hypot(pos.x - p.x, pos.z - p.z);
      const dy = pos.y - p.y;
      if (dHor < mejorD && dy >= -0.35 && dy <= 0.75) {
        mejorD = dHor;
        mejor = { baranda: b, t, punto: p.clone() };
      }
    }
    return mejor;
  }

  /** Registra un truco realizado en (x, z) y verifica si completó una Parada */
  verificarParadas(x, z, categoria) {
    const ganadas = [];
    for (const p of this.paradas) {
      if (p.completada) continue;
      const d = Math.hypot(x - p.x, z - p.z);
      if (d <= p.r + 2.2 && p.requisito === categoria) {
        p.completada = true;
        if (p.meshAnillo) p.meshAnillo.material.color.setHex(0x8ce99a);
        if (p.meshPoste) {
          p.meshPoste.material.color.setHex(0x8ce99a);
          p.meshPoste.material.emissive.setHex(0x8ce99a);
        }
        ganadas.push(p);
      }
    }
    return ganadas;
  }
}
