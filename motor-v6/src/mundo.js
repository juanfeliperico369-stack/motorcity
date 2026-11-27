/* =====================================================================
   MOTOR 3D v6 · CONSTRUCTOR DE MUNDO «EFECTO GTA» (ZONA HERO + RESTO GENÉRICO)
   Demuestra en 3D real el diseño propuesto por el autor:
   1. ZONA HERO FIEL (Puente de la 4 Sur · Skatepark 4 Sur · Medellín):
      - Puente atirantado Gilberto Echeverri (4 Sur) en 3D con pilones y tirantes
      - Los 90 edificios REALES extraídos de OSM/Catastro (hero-4sur.json)
        con sus alturas, huellas, ángulos, zócalos anclados al relieve y
        texturas reales de Medellín (ladrillo paisa, vidrio, residencial, teja)
      - Avenidas con textura de asfalto, andenes con bordillo 0,18 m y mobiliario 3D
      - Árboles 3D reales (guayacanes amarillos y frondosos: NADA pintado en el suelo)
      - Estación EnCicla 3D + Viaducto del Metro con tren animado en escala SI
      - Fila de referencia de escala SI: Bici (1,78 m), Moto (2,05 m),
        Taxi amarillo (4,35 m), Bus urbano (10,8 m) y Metro (3,85 m alto)
   2. RESTO DEL VALLE PROCEDURAL GENÉRICO (r > 190 m hasta 500 m):
      - 380 edificaciones de ladera y valle generadas por semilla determinista
        en solo 2 llamadas GPU InstancedMesh (0 bytes de huella almacenada!).
   ===================================================================== */

import * as THREE from '../../js/vendor/three-0.170.0.module.min.js';
import { ESCALA } from './escala.js';

function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export class MundoEfectoGTA {
  constructor(terreno, bancoTexturas) {
    this.terreno = terreno;
    this.tex = bancoTexturas;
    this.colisiones = []; // AABBs para cámara spring-arm y personaje
    this.animables = [];  // tren Metro, carros, etc.
    this.stats = { edificiosHero: 0, edificiosGenericos: 0, arboles3D: 0, vehiculosEscala: 0 };
  }

  construir(datosHero) {
    const raiz = new THREE.Group();
    raiz.name = 'MundoEfectoGTA';

    // 1. Avenidas y andenes principales de la Zona Hero (3D con altura real, no pintados borrosos)
    this._construirViasPrincipales(raiz);

    // 2. Hito emblemático: Puente Atirantado de la 4 Sur sobre el Río Medellín y el Skatepark
    this._construirPuente4Sur(raiz);

    // 3. Viaducto del Metro elevado (+6,8 m libres) con tren animado de 3 coches en escala SI
    this._construirViaductoYMetro(raiz);

    // 4. Los edificios REALES extraídos de OSM/Catastro (datosHero.edificios) con texturas de Medellín
    this._construirEdificiosHero(raiz, datosHero?.edificios || []);

    // 5. Mobiliario 3D real: estación EnCicla, postes de luz, bancas, árboles guayacán y tropicales
    this._construirMobiliarioYArboles(raiz);

    // 6. Fila de calibración visual en escala SI (1:1 junto al skatepark)
    this._construirFilaEscalaSI(raiz);

    // 7. Resto del Valle de Aburrá GENÉRICO PROCEDURAL (InstancedMesh GPU, 0 bytes de datos)
    this._construirRestoGenerico(raiz);

    return raiz;
  }

  _construirViasPrincipales(raiz) {
    const matAsfalto = this.tex.material('asfalto', { repX: 2, repY: 26, roughness: 0.88, bumpScale: 0.03 });
    const matAnden = this.tex.material('anden_medellin', { repX: 1, repY: 32, roughness: 0.85, bumpScale: 0.025 });
    const matCiclo = new THREE.MeshStandardMaterial({ color: 0x2b8a3e, roughness: 0.8 });

    // Avenida principal Norte-Sur (Av. Regional / Paralela oriental al río, x = 52)
    // Segmentada para adaptarse a la pendiente real del terreno
    const segs = 28;
    const zMin = -130, zMax = 130;
    const dz = (zMax - zMin) / segs;
    const anchoVia = ESCALA.urbano.carrilVehicular * 3.2; // ~10,7 m (3 carriles + berma)

    for (let i = 0; i < segs; i++) {
      const za = zMin + i * dz;
      const zb = za + dz;
      const zm = (za + zb) / 2;
      const ha = this.terreno.getHeight(52, za);
      const hb = this.terreno.getHeight(52, zb);
      const hm = (ha + hb) / 2;
      const pendAng = Math.atan2(hb - ha, dz);
      const len = Math.hypot(dz, hb - ha) + 0.15;

      const calz = new THREE.Mesh(new THREE.BoxGeometry(anchoVia, 0.16, len), matAsfalto);
      calz.position.set(52, hm + 0.06, zm);
      calz.rotation.x = -pendAng;
      calz.receiveShadow = true;
      raiz.add(calz);

      // Andenes elevados +0,18 m a lado y lado
      for (const sx of [-1, 1]) {
        const and = new THREE.Mesh(new THREE.BoxGeometry(2.6, ESCALA.urbano.andenAlto + 0.16, len), matAnden);
        and.position.set(52 + sx * (anchoVia / 2 + 1.3), hm + 0.14, zm);
        and.rotation.x = -pendAng;
        and.receiveShadow = true;
        raiz.add(and);
      }

      // Ciclorruta verde paralela junto al skatepark (lado oeste de la avenida)
      const cic = new THREE.Mesh(new THREE.BoxGeometry(ESCALA.urbano.ciclorrutaBidi, 0.18, len), matCiclo);
      cic.position.set(52 - anchoVia / 2 - 4.0, hm + 0.13, zm);
      cic.rotation.x = -pendAng;
      cic.receiveShadow = true;
      raiz.add(cic);
    }
  }

  _construirPuente4Sur(raiz) {
    const grupo = new THREE.Group();
    grupo.name = 'Puente4Sur';
    const yTablero = this.terreno.nivelPlaza + 9.2; // 9,2 m libre sobre el skatepark y el río
    const zPuente = -27; // cruza de Este (+X) a Oeste (-X) sobre el borde norte del skatepark y el río

    const matConcretoBlanco = new THREE.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.55, metalness: 0.08 });
    const matAsfaltoP = this.tex.material('asfalto', { repX: 16, repY: 2, roughness: 0.85 });
    const matCable = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.35, metalness: 0.5 });

    // Tablero del puente (190 m de largo × 18 m de ancho)
    const tablero = new THREE.Mesh(new THREE.BoxGeometry(190, 1.35, 18), matConcretoBlanco);
    tablero.position.set(-22, yTablero, zPuente);
    tablero.castShadow = true; tablero.receiveShadow = true;
    grupo.add(tablero);

    const calzada = new THREE.Mesh(new THREE.BoxGeometry(190, 0.12, 15.4), matAsfaltoP);
    calzada.position.set(-22, yTablero + 0.72, zPuente);
    calzada.receiveShadow = true;
    grupo.add(calzada);

    // Barandas de seguridad del puente
    for (const sz of [-8.6, 8.6]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(190, 1.05, 0.38), matConcretoBlanco);
      bar.position.set(-22, yTablero + 1.15, zPuente + sz);
      grupo.add(bar);
    }

    // Pilón icónico en forma de A blanca (52 m de alto total) en la margen del río
    const px = -24;
    const yBasePilon = this.terreno.getHeight(px, zPuente) - 2;
    const altoPilon = 48;
    const punta = new THREE.Vector3(px, yBasePilon + altoPilon, zPuente);

    for (const sz of [-1, 1]) {
      const pie = new THREE.Vector3(px, yBasePilon, zPuente + sz * 11.5);
      const dir = new THREE.Vector3().subVectors(punta, pie);
      const pata = new THREE.Mesh(new THREE.BoxGeometry(2.6, dir.length(), 2.4), matConcretoBlanco);
      pata.position.copy(pie).addScaledVector(dir, 0.5);
      pata.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      pata.castShadow = true; pata.receiveShadow = true;
      grupo.add(pata);
    }
    // Travesaño horizontal bajo el tablero
    const trav = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 19), matConcretoBlanco);
    trav.position.set(px, yTablero - 1.5, zPuente);
    grupo.add(trav);

    // 18 tirantes blancos (cables tensores) en abanico a ambos lados del pilón
    for (const lado of [-1, 1]) {
      for (let i = 1; i <= 9; i++) {
        const ancla = new THREE.Vector3(px + lado * (i * 8.2), yTablero + 0.9, zPuente);
        const tope = new THREE.Vector3(px, yBasePilon + altoPilon - i * 1.4, zPuente);
        const d = new THREE.Vector3().subVectors(tope, ancla);
        const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, d.length(), 6), matCable);
        cable.position.copy(ancla).addScaledVector(d, 0.5);
        cable.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
        grupo.add(cable);
      }
    }

    // Pilas de concreto de soporte en los extremos
    for (const sx of [-98, 48]) {
      const yb = this.terreno.getHeight(sx, zPuente) - 1;
      const hp = yTablero - yb;
      const pila = new THREE.Mesh(new THREE.BoxGeometry(3.2, hp, 11), matConcretoBlanco);
      pila.position.set(sx, yb + hp / 2, zPuente);
      pila.castShadow = true;
      grupo.add(pila);
    }

    raiz.add(grupo);
  }

  _construirViaductoYMetro(raiz) {
    const xVia = -34; // paralelo al río Medellín
    const yLibre = this.terreno.nivelPlaza + ESCALA.vehiculos.metroVagon.viaductoLibre; // +6,8 m reales
    const matCon = new THREE.MeshStandardMaterial({ color: 0xbec5cc, roughness: 0.8 });
    const matRiel = new THREE.MeshStandardMaterial({ color: 0x495057, roughness: 0.4, metalness: 0.7 });

    const viga = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.1, 460), matCon);
    viga.position.set(xVia, yLibre - 0.55, 0);
    viga.castShadow = true; viga.receiveShadow = true;
    raiz.add(viga);

    // Rieles metálicos
    for (const rx of [-2.4, -1.0, 1.0, 2.4]) {
      const riel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 460), matRiel);
      riel.position.set(xVia + rx, yLibre + 0.07, 0);
      raiz.add(riel);
    }

    // Pilares cada 26 m anclados al terreno real
    for (let z = -210; z <= 210; z += 26) {
      if (Math.abs(z + 27) < 12) continue; // respeta el cruce del Puente 4 Sur
      const yb = this.terreno.getHeight(xVia, z) - 1.5;
      const hp = (yLibre - 1.0) - yb;
      const pilar = new THREE.Mesh(new THREE.BoxGeometry(2.2, hp, 1.6), matCon);
      pilar.position.set(xVia, yb + hp / 2, z);
      pilar.castShadow = true;
      raiz.add(pilar);
    }

    // Tren del Metro de Medellín animado (3 coches reales: 23 m × 3,20 m × 3,85 m c/u)
    const tren = new THREE.Group();
    const mv = ESCALA.vehiculos.metroVagon;
    const matBlanco = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.35, metalness: 0.2 });
    const matAzul = new THREE.MeshStandardMaterial({ color: 0x1971c2, roughness: 0.4 });
    const matVent = new THREE.MeshStandardMaterial({ color: 0x1c2833, roughness: 0.18, metalness: 0.6 });

    for (let c = -1; c <= 1; c++) {
      const coche = new THREE.Group();
      coche.position.z = c * (mv.largo + 0.7);
      const caja = new THREE.Mesh(new THREE.BoxGeometry(mv.ancho, mv.alto - 0.4, mv.largo), matBlanco);
      caja.position.y = mv.alto / 2 + 0.2; caja.castShadow = true;
      const franja = new THREE.Mesh(new THREE.BoxGeometry(mv.ancho + 0.04, 0.48, mv.largo + 0.02), matAzul);
      franja.position.y = 1.25;
      const ventanas = new THREE.Mesh(new THREE.BoxGeometry(mv.ancho + 0.05, 1.15, mv.largo - 1.6), matVent);
      ventanas.position.y = 2.45;
      coche.add(caja, franja, ventanas);
      tren.add(coche);
    }
    tren.position.set(xVia + 1.7, yLibre + 0.15, -55);
    raiz.add(tren);

    this.animables.push((dt) => {
      tren.position.z += 16.5 * dt; // ~60 km/h reales!
      if (tren.position.z > 210) tren.position.z = -210;
    });
  }

  _construirEdificiosHero(raiz, edificios) {
    const matLadrillo = this.tex.material('ladrillo_paisa', { repX: 2, repY: 2, roughness: 0.86, bumpScale: 0.03 });
    const matResid = this.tex.material('fachada_residencial', { repX: 2, repY: 2, roughness: 0.82, bumpScale: 0.025 });
    const matVidrio = this.tex.material('fachada_vidrio', { repX: 2, repY: 3, roughness: 0.32, metalness: 0.35, bumpScale: 0.015 });
    const matTeja = this.tex.material('teja_barro', { repX: 2, repY: 2, roughness: 0.88, bumpScale: 0.04 });
    const matTerraza = new THREE.MeshStandardMaterial({ color: 0x7c8288, roughness: 0.9 });
    const matZocalo = new THREE.MeshStandardMaterial({ color: 0x5c5b57, roughness: 0.92 });

    // Si faltan datos externos, genera 28 edificios hero representativos alrededor de la Zona 4 Sur
    const lista = edificios.length ? edificios : this._edificiosHeroRespaldo();

    for (const b of lista) {
      // Mantener despejados el río, el skatepark, el puente y la avenida principal
      if (Math.abs(b.x - (-56)) < 26) continue;
      if (Math.abs(b.x - 52) < 13 && Math.abs(b.z) < 135) continue;
      if (Math.abs(b.z + 27) < 14 && b.x > -120 && b.x < 80) continue;
      if (Math.abs(b.x - 4) < 35 && Math.abs(b.z) < 28) continue;

      const w = Math.max(5, Math.min(34, b.w));
      const d = Math.max(5, Math.min(34, b.d));
      const h = Math.max(3.5, Math.min(58, b.h));
      const ySuelo = this.terreno.getHeight(b.x, b.z);
      const zocaloH = 5.0; // hunde 5 m bajo el suelo para jamás flotar en laderas!

      // Seleccionar material arquitectónico según altura/uso real
      const matF = h > 22 ? matVidrio : (b.tipo === 'casa' || h <= 10 ? matLadrillo : matResid);
      const matTecho = (b.tipo === 'casa' || h <= 11) ? matTeja : matTerraza;
      const mats = [matF, matF, matTecho, matZocalo, matF, matF];

      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h + zocaloH, d), mats);
      mesh.position.set(b.x, ySuelo + (h - zocaloH) / 2, b.z);
      mesh.rotation.y = -(b.ang || 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      raiz.add(mesh);

      // Cornisa / antepecho superior para silueta arquitectónica real
      const cornisa = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.45, d + 0.4), matZocalo);
      cornisa.position.set(b.x, ySuelo + h + 0.1, b.z);
      cornisa.rotation.y = mesh.rotation.y;
      raiz.add(cornisa);

      // Registrar AABB conservadora para colisión de personaje y spring-arm de cámara
      const rad = Math.hypot(w, d) * 0.42;
      this.colisiones.push({
        minX: b.x - rad, maxX: b.x + rad,
        minZ: b.z - rad, maxZ: b.z + rad,
        maxY: ySuelo + h,
        mesh,
      });
      this.stats.edificiosHero++;
    }
  }

  _edificiosHeroRespaldo() {
    const out = [];
    const rnd = seeded(404);
    for (let i = 0; i < 36; i++) {
      const lado = i % 2 === 0 ? 1 : -1;
      const x = lado > 0 ? 74 + rnd() * 95 : -98 - rnd() * 75;
      const z = -150 + rnd() * 300;
      const pisos = 2 + Math.floor(rnd() * 10);
      out.push({ x, z, w: 10 + rnd() * 14, d: 10 + rnd() * 14, h: pisos * 3.1, ang: rnd() * 0.4, tipo: pisos <= 3 ? 'casa' : 'edificio' });
    }
    return out;
  }

  _construirMobiliarioYArboles(raiz) {
    const rnd = seeded(2026);
    const matTronco = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.92 });
    const matCopaVerde = new THREE.MeshStandardMaterial({ color: 0x2f7d32, roughness: 0.85 });
    const matGuayacan = new THREE.MeshStandardMaterial({ color: 0xf4c430, roughness: 0.78 });
    const matPoste = new THREE.MeshStandardMaterial({ color: 0x495057, roughness: 0.45, metalness: 0.65 });
    const matLuz = new THREE.MeshStandardMaterial({ color: 0xfff3bf, emissive: 0xffd43b, emissiveIntensity: 0.7 });
    const matMadera = new THREE.MeshStandardMaterial({ color: 0x9c6644, roughness: 0.82 });

    // Árboles 3D reales (guayacanes y arbóreos de ribera — CERO círculos pintados en el suelo!)
    const posArboles = [];
    // Arbolado a lo largo de la ribera del río y borde del skatepark
    for (let z = -110; z <= 110; z += 14) {
      posArboles.push({ x: -39 + (rnd() - 0.5) * 4, z, guayacan: rnd() < 0.35 });
      if (Math.abs(z) > 25) posArboles.push({ x: 35 + (rnd() - 0.5) * 3, z, guayacan: rnd() < 0.45 });
      posArboles.push({ x: 64 + (rnd() - 0.5) * 3, z, guayacan: rnd() < 0.3 });
    }
    for (const p of posArboles) {
      if (Math.abs(p.z + 27) < 11) continue;
      const y = this.terreno.getHeight(p.x, p.z);
      const alto = 5.5 + rnd() * 3.5;
      const arbol = new THREE.Group();
      const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, alto * 0.52, 7), matTronco);
      tronco.position.y = alto * 0.26; tronco.castShadow = true;
      const matC = p.guayacan ? matGuayacan : matCopaVerde;
      const copa1 = new THREE.Mesh(new THREE.DodecahedronGeometry(alto * 0.34, 1), matC);
      copa1.position.set(0, alto * 0.68, 0); copa1.castShadow = true;
      const copa2 = new THREE.Mesh(new THREE.DodecahedronGeometry(alto * 0.24, 1), matC);
      copa2.position.set(0.85, alto * 0.56, 0.5); copa2.castShadow = true;
      const copa3 = new THREE.Mesh(new THREE.DodecahedronGeometry(alto * 0.22, 1), matC);
      copa3.position.set(-0.75, alto * 0.58, -0.45); copa3.castShadow = true;
      arbol.add(tronco, copa1, copa2, copa3);
      arbol.position.set(p.x, y, p.z);
      raiz.add(arbol);
      this.stats.arboles3D++;
    }

    // Postes de luz 3D reales (7,5 m SI) + Bancas 3D (1,8 m × 0,46 m SI) junto al skatepark y avenida
    for (let z = -80; z <= 80; z += 22) {
      if (Math.abs(z + 27) < 12) continue;
      const y = this.terreno.getHeight(44.5, z);
      const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, ESCALA.urbano.posteLuzAlto, 8), matPoste);
      poste.position.set(44.5, y + ESCALA.urbano.posteLuzAlto / 2, z);
      poste.castShadow = true;
      const brazo = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.1), matPoste);
      brazo.position.set(45.2, y + ESCALA.urbano.posteLuzAlto - 0.1, z);
      const foco = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.24), matLuz);
      foco.position.set(45.9, y + ESCALA.urbano.posteLuzAlto - 0.18, z);
      raiz.add(poste, brazo, foco);
    }

    for (const bx of [-16, -2, 14]) {
      const bz = 24.5;
      const y = this.terreno.getHeight(bx, bz);
      const banca = new THREE.Mesh(new THREE.BoxGeometry(ESCALA.urbano.bancaLargo, 0.1, 0.55), matMadera);
      banca.position.set(bx, y + ESCALA.urbano.bancaAlto, bz);
      banca.castShadow = true;
      const pata1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, ESCALA.urbano.bancaAlto, 0.45), matPoste);
      pata1.position.set(bx - 0.72, y + ESCALA.urbano.bancaAlto / 2, bz);
      const pata2 = pata1.clone(); pata2.position.x = bx + 0.72;
      raiz.add(banca, pata1, pata2);
    }

    // Estación EnCicla 3D real (12 m × 3,4 m × 2,65 m SI) al costado este del skatepark
    const ex = 35, ez = 10;
    const ey = this.terreno.getHeight(ex, ez);
    const est = new THREE.Group();
    const matVerde = new THREE.MeshStandardMaterial({ color: 0x74b816, roughness: 0.42 });
    const matGris = new THREE.MeshStandardMaterial({ color: 0xdbe0e5, roughness: 0.6 });
    const baseE = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.16, 12.0), matGris);
    baseE.position.y = 0.08; baseE.receiveShadow = true;
    const techoE = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 11.6), matVerde);
    techoE.position.y = ESCALA.urbano.estacionEnciclaAlto; techoE.castShadow = true;
    est.add(baseE, techoE);
    for (const pz of [-5.2, 0, 5.2]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, ESCALA.urbano.estacionEnciclaAlto, 8), matPoste);
      col.position.set(1.2, ESCALA.urbano.estacionEnciclaAlto / 2, pz);
      est.add(col);
    }
    // Tótem de préstamo
    const totem = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.85, 0.65), new THREE.MeshStandardMaterial({ color: 0x0a2342, roughness: 0.4 }));
    totem.position.set(0, 0.95, -5.2);
    est.add(totem);
    est.position.set(ex, ey, ez);
    raiz.add(est);
  }

  /**
   * Fila de vehículos 3D reales en escala SI (1 u = 1 m) parqueados sobre la avenida
   * junto al skatepark para comprobar de inmediato la proporción persona vs. vehículo.
   */
  _construirFilaEscalaSI(raiz) {
    const V = ESCALA.vehiculos;
    const xFila = 49.2;
    const matLlanta = new THREE.MeshStandardMaterial({ color: 0x1e2226, roughness: 0.85 });
    const matVidrio = new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.15, metalness: 0.6 });

    // 1) Bicicleta EnCicla (1,78 m) en z = -6
    {
      const y = this.terreno.getHeight(xFila, -6) + 0.14;
      const g = new THREE.Group();
      const mv = new THREE.MeshStandardMaterial({ color: 0x82c91e, roughness: 0.4 });
      const r = V.encicla.ruedaD / 2;
      for (const rz of [-0.56, 0.56]) {
        const ll = new THREE.Mesh(new THREE.TorusGeometry(r, 0.04, 8, 16), matLlanta);
        ll.rotation.y = Math.PI / 2; ll.position.set(0, r, rz); g.add(ll);
      }
      const cu = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 1.1), mv);
      cu.position.y = 0.64; g.add(cu);
      g.position.set(xFila - 3.6, y, -6);
      raiz.add(g);
      this.stats.vehiculosEscala++;
    }

    // 2) Moto urbana roja (2,05 m largo × 0,78 m ancho × 1,12 m alto) en z = 0
    {
      const y = this.terreno.getHeight(xFila, 0) + 0.14;
      const g = new THREE.Group();
      const mR = new THREE.MeshStandardMaterial({ color: 0xe03131, roughness: 0.35, metalness: 0.4 });
      const r = V.moto.ruedaD / 2;
      for (const rz of [-0.66, 0.66]) {
        const ll = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.14, 12), matLlanta);
        ll.rotation.z = Math.PI / 2; ll.position.set(0, r, rz); ll.castShadow = true; g.add(ll);
      }
      const chasis = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 1.42), mR);
      chasis.position.y = 0.68; chasis.castShadow = true;
      const man = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, V.moto.ancho, 8), matLlanta);
      man.rotation.z = Math.PI / 2; man.position.set(0, 1.02, -0.52);
      g.add(chasis, man);
      g.position.set(xFila - 1.6, y, 0);
      raiz.add(g);
      this.stats.vehiculosEscala++;
    }

    // 3) Taxi amarillo de Medellín (4,35 m × 1,78 m × 1,46 m) en z = 7
    {
      const y = this.terreno.getHeight(xFila, 7) + 0.14;
      const g = new THREE.Group();
      const mY = new THREE.MeshStandardMaterial({ color: 0xf5c400, roughness: 0.35, metalness: 0.25 });
      const base = new THREE.Mesh(new THREE.BoxGeometry(V.taxi.ancho, 0.62, V.taxi.largo), mY);
      base.position.y = 0.56; base.castShadow = true;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(V.taxi.ancho - 0.18, 0.56, 2.15), mY);
      cab.position.set(0, 1.15, 0.15); cab.castShadow = true;
      const vid = new THREE.Mesh(new THREE.BoxGeometry(V.taxi.ancho - 0.12, 0.44, 1.98), matVidrio);
      vid.position.set(0, 1.15, 0.15);
      const letrero = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.14, 0.18), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe066, emissiveIntensity: 0.4 }));
      letrero.position.set(0, 1.50, 0.05);
      g.add(base, cab, vid, letrero);
      const r = V.taxi.ruedaD / 2;
      for (const sx of [-0.84, 0.84]) for (const sz of [-1.30, 1.30]) {
        const ll = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.22, 12), matLlanta);
        ll.rotation.z = Math.PI / 2; ll.position.set(sx, r, sz); g.add(ll);
      }
      g.position.set(xFila, y, 7);
      raiz.add(g);
      this.colisiones.push({ minX: xFila - 0.9, maxX: xFila + 0.9, minZ: 7 - 2.2, maxZ: 7 + 2.2, maxY: y + 1.5 });
      this.stats.vehiculosEscala++;
    }

    // 4) Bus urbano alimentador (10,8 m × 2,50 m × 3,10 m) en z = 20
    {
      const y = this.terreno.getHeight(xFila, 20) + 0.14;
      const g = new THREE.Group();
      const mB = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.45 });
      const mV = new THREE.MeshStandardMaterial({ color: 0x2b8a3e, roughness: 0.5 });
      const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(V.bus.ancho, V.bus.alto - 0.42, V.bus.largo), mB);
      cuerpo.position.y = V.bus.alto / 2 + 0.22; cuerpo.castShadow = true;
      const franja = new THREE.Mesh(new THREE.BoxGeometry(V.bus.ancho + 0.04, 0.72, V.bus.largo + 0.02), mV);
      franja.position.y = 0.92;
      const vent = new THREE.Mesh(new THREE.BoxGeometry(V.bus.ancho + 0.05, 1.05, V.bus.largo - 0.8), matVidrio);
      vent.position.y = 2.15;
      g.add(cuerpo, franja, vent);
      const r = V.bus.ruedaD / 2;
      for (const sx of [-1.18, 1.18]) for (const sz of [-3.1, 2.9]) {
        const ll = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.30, 12), matLlanta);
        ll.rotation.z = Math.PI / 2; ll.position.set(sx, r, sz); g.add(ll);
      }
      g.position.set(xFila, y, 20);
      raiz.add(g);
      this.colisiones.push({ minX: xFila - 1.3, maxX: xFila + 1.3, minZ: 20 - 5.4, maxZ: 20 + 5.4, maxY: y + 3.1 });
      this.stats.vehiculosEscala++;
    }
  }

  /**
   * Resto del Valle GENÉRICO PROCEDURAL (fuera de la Zona Hero r > 185 m).
   * Se dibuja en solo 2 InstancedMesh GPU (ladrillo de ladera + torres del valle):
   * 0 bytes de huellas estáticas, 100 % navegable y mantiene la silueta de Medellín.
   */
  _construirRestoGenerico(raiz) {
    const rnd = seeded(9901);
    const casasLadera = [];
    const torresValle = [];

    for (let i = 0; i < 420; i++) {
      const ang = rnd() * Math.PI * 2;
      const radio = 190 + rnd() * 290;
      const x = Math.cos(ang) * radio;
      const z = Math.sin(ang) * radio;
      // No poner edificios sobre el cauce del río ni la avenida principal
      const rioC = this.terreno.rioX + Math.sin(z * 0.008) * 10;
      if (Math.abs(x - rioC) < 26) continue;
      if (Math.abs(x - 52) < 16) continue;

      const y = this.terreno.getHeight(x, z);
      const esTorre = x > 80 && radio < 340 && rnd() < 0.32;
      const w = esTorre ? 14 + rnd() * 12 : 7 + rnd() * 7;
      const d = esTorre ? 14 + rnd() * 12 : 7 + rnd() * 7;
      const h = esTorre ? 18 + rnd() * 30 : 4.5 + rnd() * 7.5;
      const item = { x, y, z, w, d, h, rot: rnd() * Math.PI };
      if (esTorre) torresValle.push(item);
      else casasLadera.push(item);
    }

    const montarInst = (lista, mat) => {
      if (!lista.length) return;
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const inst = new THREE.InstancedMesh(geo, mat, lista.length);
      inst.receiveShadow = true;
      const dummy = new THREE.Object3D();
      const col = new THREE.Color();
      lista.forEach((b, idx) => {
        const zoc = 6.0;
        dummy.position.set(b.x, b.y + (b.h - zoc) / 2, b.z);
        dummy.rotation.set(0, b.rot, 0);
        dummy.scale.set(b.w, b.h + zoc, b.d);
        dummy.updateMatrix();
        inst.setMatrixAt(idx, dummy.matrix);
        const shade = 0.85 + (idx % 7) * 0.035;
        col.setRGB(shade, shade * 0.96, shade * 0.92);
        inst.setColorAt(idx, col);
      });
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      raiz.add(inst);
      this.stats.edificiosGenericos += lista.length;
    };

    montarInst(casasLadera, this.tex.material('ladrillo_paisa', { repX: 2, repY: 1, roughness: 0.9 }));
    montarInst(torresValle, this.tex.material('fachada_residencial', { repX: 2, repY: 3, roughness: 0.78 }));
  }

  actualizar(dt) {
    for (const fn of this.animables) fn(dt);
  }
}
