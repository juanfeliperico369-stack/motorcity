/* =====================================================================
   MOTOR 3D v6 · CONTROLADOR DE PERSONAJE (1,72 m SI) · PARKOUR + SKATE + BICI
   - Proporción humana real: 1,72 m de estatura con rig articulado.
   - Movimiento 100 % relativo a la cámara (nunca engorroso).
   - Parkour real: coyote time (120 ms), búfer de salto (140 ms),
     sprint, deslizamiento (slide), bóveda automática (vault 0,45–1,25 m),
     trepado de cornisa (ledge mantle 1,25–2,35 m) y rodada al aterrizar.
   - Skate / Bici EnCicla: lanzamiento en quarter-pipes/funbox, enganche
     magnético de Grind (50-50 / Boardslide) en barandas metálicas,
     trucos aéreos (Ollie, Kickflip, 360 Shuvit, Tailwhip) y combos.
   ===================================================================== */

import * as THREE from '../../js/vendor/three-0.170.0.module.min.js';
import { ESCALA } from './nucleo/escala.js';

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function angDif(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export class PersonajeController {
  constructor({ terreno, skatepark, colisiones = [], alEvento = null }) {
    this.terreno = terreno;
    this.skatepark = skatepark;
    this.colisiones = colisiones;
    this.alEvento = alEvento || (() => {});

    // Modos de locomoción: 'pie' (Parkour) | 'skate' (Trucos) | 'bici' (EnCicla)
    this.modo = 'skate';

    // Cinemática en metros SI
    this.pos = new THREE.Vector3(-4, 3.25, 10);
    this.vel = new THREE.Vector3();
    this.rumbo = 0; // 0 = mira hacia -Z
    this.enSuelo = true;
    this.coyoteT = 0;
    this.saltoBufferT = 0;
    this.alturaCaida = 0;

    // Estados especiales de Parkour & Skate
    this.estado = 'libre'; // 'libre' | 'boveda' | 'trepado' | 'deslizar' | 'rodada' | 'grind'
    this.estadoT = 0;
    this.grindInfo = null;
    this.trucoRot = 0;
    this.enAireTruco = false;

    // Sistema de combos y puntaje
    this.puntaje = 0;
    this.combo = 0;
    this.comboPuntos = 0;
    this.comboT = 0;
    this.ultimoTruco = '';

    // Animación
    this.cicloPaso = 0;
    this.mesh = this._construirRig3D();
    this.mesh.position.copy(this.pos);
    this._sincronizarVehiculoVisual();
  }

  _construirRig3D() {
    const P = ESCALA.persona;
    const raiz = new THREE.Group();
    raiz.name = 'Jugador_172cm';

    const matPiel = new THREE.MeshStandardMaterial({ color: 0xc9936d, roughness: 0.72 });
    const matCamisa = new THREE.MeshStandardMaterial({ color: 0x2274a5, roughness: 0.65 });
    const matPantalon = new THREE.MeshStandardMaterial({ color: 0x2b303a, roughness: 0.8 });
    const matTenis = new THREE.MeshStandardMaterial({ color: 0xf1f3f5, roughness: 0.6 });
    const matCasco = new THREE.MeshStandardMaterial({ color: 0x82c91e, roughness: 0.42 });
    const matMorral = new THREE.MeshStandardMaterial({ color: 0xe8590c, roughness: 0.7 });

    // Contenedor del cuerpo (se inclina en parkour/trucos)
    const cuerpo = this.rigCuerpo = new THREE.Group();
    raiz.add(cuerpo);

    // Piernas (0,84 m de alto total)
    const mkPierna = (xOff) => {
      const piv = new THREE.Group();
      piv.position.set(xOff, P.piernaLargo, 0);
      const muslo = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.72, 0.17), matPantalon);
      muslo.position.y = -0.36; muslo.castShadow = true;
      const zapato = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.12, 0.28), matTenis);
      zapato.position.set(0, -0.78, -0.04); zapato.castShadow = true;
      piv.add(muslo, zapato);
      return piv;
    };
    this.piernaI = mkPierna(-0.12);
    this.piernaD = mkPierna(0.12);
    cuerpo.add(this.piernaI, this.piernaD);

    // Torso (de 0,84 m a 1,38 m)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, P.torsoAlto, 0.24), matCamisa);
    torso.position.y = P.piernaLargo + P.torsoAlto / 2;
    torso.castShadow = true;
    cuerpo.add(torso);

    // Morral urbano en espalda (+Z)
    const morral = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.40, 0.15), matMorral);
    morral.position.set(0, P.piernaLargo + 0.30, 0.18);
    morral.castShadow = true;
    cuerpo.add(morral);

    // Brazos
    const mkBrazo = (xOff) => {
      const piv = new THREE.Group();
      piv.position.set(xOff, P.piernaLargo + P.torsoAlto - 0.06, 0);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.56, 0.13), matCamisa);
      b.position.y = -0.26; b.castShadow = true;
      const mano = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.11), matPiel);
      mano.position.y = -0.57;
      piv.add(b, mano);
      return piv;
    };
    this.brazoI = mkBrazo(-0.28);
    this.brazoD = mkBrazo(0.28);
    cuerpo.add(this.brazoI, this.brazoD);

    // Cabeza + casco/gorra (corona exactamente en y = 1,72 m)
    const cabeza = new THREE.Mesh(new THREE.SphereGeometry(P.cabezaRadio, 12, 10), matPiel);
    cabeza.position.y = P.alto - P.cabezaRadio - 0.03;
    cabeza.castShadow = true;
    const casco = new THREE.Mesh(new THREE.SphereGeometry(P.cabezaRadio + 0.022, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), matCasco);
    casco.position.y = cabeza.position.y + 0.015;
    casco.castShadow = true;
    cuerpo.add(cabeza, casco);

    // Tabla de Skate (0,80 × 0,21 × 0,12 m SI)
    const skate = this.rigSkate = new THREE.Group();
    const tabla = new THREE.Mesh(
      new THREE.BoxGeometry(ESCALA.vehiculos.skate.ancho, 0.03, ESCALA.vehiculos.skate.largo),
      new THREE.MeshStandardMaterial({ color: 0xf76707, roughness: 0.5 })
    );
    tabla.position.y = 0.085; tabla.castShadow = true;
    skate.add(tabla);
    const matRuedaS = new THREE.MeshStandardMaterial({ color: 0xffec99, roughness: 0.4 });
    for (const sx of [-0.075, 0.075]) for (const sz of [-0.26, 0.26]) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.035, 8), matRuedaS);
      r.rotation.z = Math.PI / 2;
      r.position.set(sx, 0.03, sz);
      skate.add(r);
    }
    raiz.add(skate);

    // Bicicleta EnCicla (1,78 m largo, ruedas Ø 0,66 m SI)
    const bici = this.rigBici = new THREE.Group();
    const matVerde = new THREE.MeshStandardMaterial({ color: 0x74b816, roughness: 0.38, metalness: 0.35 });
    const matLlanta = new THREE.MeshStandardMaterial({ color: 0x1e2226, roughness: 0.85 });
    const rBici = ESCALA.vehiculos.encicla.ruedaD / 2;
    this.ruedasBici = [];
    for (const rz of [-0.56, 0.56]) {
      const ll = new THREE.Mesh(new THREE.TorusGeometry(rBici, 0.042, 8, 18), matLlanta);
      ll.rotation.y = Math.PI / 2;
      ll.position.set(0, rBici, rz);
      ll.castShadow = true;
      bici.add(ll);
      this.ruedasBici.push(ll);
    }
    const marco = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 1.15), matVerde);
    marco.position.set(0, 0.62, 0); marco.castShadow = true;
    const posteManubrio = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.72, 8), matVerde);
    posteManubrio.position.set(0, 0.72, -0.46);
    const manubrio = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, ESCALA.vehiculos.encicla.ancho, 8), matLlanta);
    manubrio.rotation.z = Math.PI / 2;
    manubrio.position.set(0, 1.03, -0.48);
    const canasta = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.26), new THREE.MeshStandardMaterial({ color: 0xf1f3f5, roughness: 0.6 }));
    canasta.position.set(0, 0.88, -0.62);
    bici.add(marco, posteManubrio, manubrio, canasta);
    raiz.add(bici);

    return raiz;
  }

  cambiarModo(nuevo) {
    if (!['pie', 'skate', 'bici'].includes(nuevo)) return;
    this.modo = nuevo;
    this.estado = 'libre';
    this.grindInfo = null;
    this._sincronizarVehiculoVisual();
    this.alEvento('modo', { modo: nuevo });
  }

  ciclarModo() {
    const orden = ['skate', 'pie', 'bici'];
    this.cambiarModo(orden[(orden.indexOf(this.modo) + 1) % orden.length]);
    return this.modo;
  }

  _sincronizarVehiculoVisual() {
    this.rigSkate.visible = this.modo === 'skate';
    this.rigBici.visible = this.modo === 'bici';
    this.rigCuerpo.position.y = this.modo === 'skate' ? 0.11 : this.modo === 'bici' ? 0.22 : 0;
  }

  pedirSalto() {
    this.saltoBufferT = ESCALA.parkour.bufferSaltoSeg;
  }

  pedirTrucoOAccion() {
    // En el aire: truco limpio (sin trampa mortal al aterrizar)
    if (!this.enSuelo && this.estado === 'libre') {
      const lista = this.modo === 'skate'
        ? ['Kickflip', '360 Shuvit', 'Heelflip', 'Indy Grab']
        : this.modo === 'bici'
          ? ['Tailwhip EnCicla', 'Barspin', 'Tabletop']
          : ['Giro Parkour', 'Salto Kong', 'Doble Impulso'];
      const nom = lista[Math.floor((this.combo + this.puntaje) % lista.length)];
      this.trucoRot = Math.PI * 2;
      this.enAireTruco = true;
      this._sumarTruco(nom, 120, 'aire');
      return nom;
    }
    // En el suelo: deslizar (slide) a pie o Manual en skate/bici
    if (this.enSuelo && this.estado === 'libre' && this.rapidezHorizontal() > 2.2) {
      if (this.modo === 'pie') {
        this.estado = 'deslizar';
        this.estadoT = 0.45;
        this._sumarTruco('Deslice Parkour', 60, 'parkour');
        return 'Deslice Parkour';
      } else {
        this._sumarTruco(this.modo === 'skate' ? 'Manual' : 'Caballito EnCicla', 85, 'aire');
        return 'Manual';
      }
    }
    return null;
  }

  rapidezHorizontal() {
    return Math.hypot(this.vel.x, this.vel.z);
  }

  _sumarTruco(nombre, basePts, categoria) {
    this.combo++;
    this.comboT = 3.2;
    const pts = Math.round(basePts * (1 + (this.combo - 1) * 0.35));
    this.comboPuntos += pts;
    this.ultimoTruco = `${nombre} +${pts}`;
    this.alEvento('truco', { nombre, pts, combo: this.combo, totalCombo: this.comboPuntos });

    if (this.skatepark) {
      const paradas = this.skatepark.verificarParadas(this.pos.x, this.pos.z, categoria);
      for (const p of paradas) {
        this.puntaje += 500;
        this.alEvento('parada', p);
      }
    }
  }

  _cerrarCombo() {
    if (this.comboPuntos > 0) {
      this.puntaje += this.comboPuntos;
      this.alEvento('comboCerrado', { puntos: this.comboPuntos, combo: this.combo, puntaje: this.puntaje });
    }
    this.combo = 0;
    this.comboPuntos = 0;
    this.comboT = 0;
  }

  /**
   * Paso físico fijo (60 Hz)
   * @param {number} dt Segundos
   * @param {object} entrada { moverX: -1..1, moverY: -1..1, sprint: bool }
   * @param {object} baseCam { adelante: Vector3, derecha: Vector3 }
   */
  paso(dt, entrada, baseCam) {
    const PK = ESCALA.parkour;

    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this._cerrarCombo();
    }
    if (this.saltoBufferT > 0) this.saltoBufferT = Math.max(0, this.saltoBufferT - dt);
    if (this.enSuelo) this.coyoteT = PK.coyoteSeg;
    else this.coyoteT = Math.max(0, this.coyoteT - dt);

    // 1. ESTADO GRIND SOBRE BARANDA METÁLICA
    if (this.estado === 'grind' && this.grindInfo) {
      const g = this.grindInfo;
      g.t += (g.dirSigno * g.vel / Math.max(0.5, g.baranda.len)) * dt;
      if (this.saltoBufferT > 0 || g.t <= 0.01 || g.t >= 0.99) {
        // Salir del grind (con salto o al final de la baranda)
        const salto = this.saltoBufferT > 0;
        this.saltoBufferT = 0;
        this.estado = 'libre';
        this.enSuelo = false;
        this.vel.y = salto ? PK.saltoVelSkate * 0.92 : 2.2;
        this.vel.x = g.baranda.dirNorm.x * g.dirSigno * g.vel;
        this.vel.z = g.baranda.dirNorm.z * g.dirSigno * g.vel;
        this.grindInfo = null;
        if (salto) this._sumarTruco('Ollie de Salida', 90, 'aire');
      } else {
        const p = new THREE.Vector3().lerpVectors(g.baranda.a, g.baranda.b, g.t);
        this.pos.set(p.x, p.y + 0.04, p.z);
        this.rumbo = Math.atan2(-g.baranda.dirNorm.x * g.dirSigno, -g.baranda.dirNorm.z * g.dirSigno);
        this.comboT = 3.0; // mantiene viva la racha mientras hace grind
        this._animar(dt);
        return;
      }
    }

    // 2. ESTADOS CORTOS DE PARKOUR (bóveda / trepado / deslizar / rodada)
    if (this.estado === 'boveda' || this.estado === 'trepado' || this.estado === 'rodada' || this.estado === 'deslizar') {
      this.estadoT -= dt;
      if (this.estado === 'boveda') {
        this.pos.x += this.vel.x * dt;
        this.pos.z += this.vel.z * dt;
        const u = 1 - clamp(this.estadoT / 0.32, 0, 1);
        this.pos.y = this._vaultY0 + Math.sin(u * Math.PI) * 1.15;
      } else if (this.estado === 'trepado') {
        const u = 1 - clamp(this.estadoT / 0.36, 0, 1);
        this.pos.lerpVectors(this._mantleA, this._mantleB, u * u * (3 - 2 * u));
      } else {
        this.pos.x += this.vel.x * dt;
        this.pos.z += this.vel.z * dt;
        this.vel.x *= Math.exp(-dt * 2.4);
        this.vel.z *= Math.exp(-dt * 2.4);
      }
      if (this.estadoT <= 0) {
        this.estado = 'libre';
        if (this._mantleB) { this.enSuelo = true; this._mantleB = null; }
      }
      this._animar(dt);
      return;
    }

    // 3. DIRECCIÓN DE MOVIMIENTO RELATIVA A LA CÁMARA
    const mag = Math.min(1, Math.hypot(entrada.moverX, entrada.moverY));
    let dx = 0, dz = 0;
    if (mag > 0.08) {
      dx = baseCam.derecha.x * entrada.moverX + baseCam.adelante.x * entrada.moverY;
      dz = baseCam.derecha.z * entrada.moverX + baseCam.adelante.z * entrada.moverY;
      const dl = Math.hypot(dx, dz) || 1;
      dx /= dl; dz /= dl;
    }

    // Velocidad objetivo y aceleración calibrada por modo + pendiente real del terreno
    const velMax = this.modo === 'skate'
      ? (entrada.sprint ? PK.velSkateMax : 9.8)
      : this.modo === 'bici'
        ? (entrada.sprint ? PK.velBiciMax : 8.2)
        : (entrada.sprint ? PK.velSprint : PK.velTrotar);

    const acel = this.modo === 'pie' ? 24 : this.modo === 'bici' ? 14 : 11.5;
    const freno = this.enSuelo ? (this.modo === 'pie' ? 16 : 3.4) : 0.7;

    if (mag > 0.08) {
      // Influencia de la pendiente real de la topografía 3D (se sienten las subidas y bajadas!)
      const nSuelo = this.terreno.getNormal(this.pos.x, this.pos.z);
      const pend = -(nSuelo.x * dx + nSuelo.z * dz); // > 0 subiendo, < 0 bajando
      const factorLoma = clamp(1 - pend * (this.modo === 'pie' ? 0.55 : 0.95), 0.58, 1.35);
      const tvx = dx * velMax * mag * factorLoma;
      const tvz = dz * velMax * mag * factorLoma;
      const k = 1 - Math.exp(-dt * (this.enSuelo ? acel : 4.2));
      this.vel.x += (tvx - this.vel.x) * k;
      this.vel.z += (tvz - this.vel.z) * k;

      // Rumbo suave hacia dirección deseada
      const rObj = Math.atan2(-dx, -dz);
      this.rumbo += angDif(this.rumbo, rObj) * (1 - Math.exp(-dt * (this.modo === 'pie' ? 14 : 9)));
    } else {
      const k = 1 - Math.exp(-dt * freno);
      this.vel.x *= (1 - k);
      this.vel.z *= (1 - k);
      if (Math.hypot(this.vel.x, this.vel.z) < 0.05) { this.vel.x = 0; this.vel.z = 0; }
    }

    // 4. SALTO CON COYOTE TIME + BÚFER DE ENTRADA + IMPULSO DE RAMPA
    if (this.saltoBufferT > 0 && this.coyoteT > 0) {
      this.saltoBufferT = 0;
      this.coyoteT = 0;
      this.enSuelo = false;
      const sup = this.skatepark ? this.skatepark.evaluarSuperficie(this.pos.x, this.pos.z, this.pos.y) : null;
      const multRampa = sup ? sup.impulso : 1.0;
      const velBase = this.modo === 'pie' ? PK.saltoVelPie : PK.saltoVelSkate;
      this.vel.y = velBase * multRampa;
      this.alturaCaida = this.pos.y;
      if (this.modo === 'skate') this._sumarTruco(multRampa > 1.15 ? 'Aire en Rampa' : 'Ollie', multRampa > 1.15 ? 110 : 50, 'aire');
      else if (this.modo === 'bici') this._sumarTruco('Bunny Hop', 60, 'aire');
    }

    // 5. GRAVEDAD + MOVIMIENTO + DETECCIÓN DE PARKOUR (BÓVEDA / TREPADO) Y COLISIONES
    this.vel.y -= PK.gravedad * dt;
    const nx = clamp(this.pos.x + this.vel.x * dt, -460, 460);
    const nz = clamp(this.pos.z + this.vel.z * dt, -460, 460);
    const ny = this.pos.y + this.vel.y * dt;

    // Comprobar bloques de Parkour del Skatepark (bóveda 0,45–1,25 m / trepado 1,25–2,35 m)
    let manejadoParkour = false;
    if (this.skatepark) {
      const rCol = ESCALA.persona.radioColision;
      for (const b of this.skatepark.bloquesParkour) {
        const choca = nx + rCol > b.minX && nx - rCol < b.maxX && nz + rCol > b.minZ && nz - rCol < b.maxZ;
        if (!choca) continue;
        const alturaRel = b.topY - this.pos.y;
        if (alturaRel <= 0.12) continue; // ya está encima
        if (alturaRel >= PK.bovedaMinAlto && alturaRel <= PK.bovedaMaxAlto && this.rapidezHorizontal() > 2.0) {
          // ¡Bóveda automática!
          this.estado = 'boveda';
          this.estadoT = 0.32;
          this._vaultY0 = this.pos.y;
          const sp = Math.max(5.5, this.rapidezHorizontal());
          this.vel.x = -Math.sin(this.rumbo) * sp;
          this.vel.z = -Math.cos(this.rumbo) * sp;
          this._sumarTruco('Bóveda Parkour', 100, 'parkour');
          manejadoParkour = true;
          break;
        } else if (alturaRel > PK.bovedaMaxAlto && alturaRel <= PK.trepadoMaxAlto && (!this.enSuelo || this.saltoBufferT > 0 || entrada.sprint)) {
          // ¡Trepado de cornisa (Ledge Mantle)!
          this.estado = 'trepado';
          this.estadoT = 0.36;
          this._mantleA = this.pos.clone();
          const cx = clamp(nx, b.minX + 0.45, b.maxX - 0.45);
          const cz = clamp(nz, b.minZ + 0.45, b.maxZ - 0.45);
          this._mantleB = new THREE.Vector3(cx, b.topY + 0.02, cz);
          this.vel.set(0, 0, 0);
          this._sumarTruco('Trepado de Cornisa', 130, 'parkour');
          manejadoParkour = true;
          break;
        }
      }
    }
    if (manejadoParkour) {
      this._animar(dt);
      return;
    }

    // Colisión lateral deslizante contra edificios y muros (eje X y eje Z separados)
    let fx = nx, fz = nz;
    const rCol = ESCALA.persona.radioColision;
    const bloquea = (px, pz, py) => {
      for (const c of this.colisiones) {
        if (px + rCol > c.minX && px - rCol < c.maxX && pz + rCol > c.minZ && pz - rCol < c.maxZ && py < c.maxY - 0.25) {
          return true;
        }
      }
      if (this.skatepark) {
        for (const b of this.skatepark.bloquesParkour) {
          if (px + rCol > b.minX && px - rCol < b.maxX && pz + rCol > b.minZ && pz - rCol < b.maxZ && py < b.topY - 0.45) {
            return true;
          }
        }
      }
      return false;
    };
    if (bloquea(fx, this.pos.z, this.pos.y)) { fx = this.pos.x; this.vel.x *= -0.15; }
    if (bloquea(fx, fz, this.pos.y)) { fz = this.pos.z; this.vel.z *= -0.15; }

    this.pos.x = fx;
    this.pos.z = fz;
    this.pos.y = ny;

    // 6. ENGANCHE MAGNÉTICO A BARANDA DE GRIND (si viene cayendo sobre una baranda en skate/bici)
    if (!this.enSuelo && this.vel.y <= 0.5 && this.skatepark && (this.modo === 'skate' || this.modo === 'bici')) {
      const hit = this.skatepark.buscarBaranda(this.pos);
      if (hit) {
        this.estado = 'grind';
        const dot = this.vel.x * hit.baranda.dirNorm.x + this.vel.z * hit.baranda.dirNorm.z;
        const dirSigno = dot >= 0 ? 1 : -1;
        this.grindInfo = {
          baranda: hit.baranda,
          t: hit.t,
          dirSigno,
          vel: clamp(Math.max(6.8, this.rapidezHorizontal() * 1.08), 6.8, 12.5),
        };
        this.pos.copy(hit.punto);
        this.vel.y = 0;
        const trucoGrind = this.modo === 'skate'
          ? (Math.abs(dot) > 3 ? '50-50 Grind' : 'Boardslide')
          : 'Feeble Grind EnCicla';
        this._sumarTruco(trucoGrind, 180, 'grind');
        this._animar(dt);
        return;
      }
    }

    // 7. RESOLUCIÓN DE PISO (Topografía 3D real + Rampas del Skatepark + Puente 4 Sur)
    let sueloY = this.terreno.getHeight(this.pos.x, this.pos.z);
    if (this.skatepark) {
      const sup = this.skatepark.evaluarSuperficie(this.pos.x, this.pos.z, this.pos.y);
      if (sup && sup.y > sueloY) sueloY = sup.y;
    }

    if (this.pos.y <= sueloY) {
      const caida = this.alturaCaida - sueloY;
      this.pos.y = sueloY;
      if (!this.enSuelo) {
        // Rodada de aterrizaje automática en parkour desde altura > 2,2 m
        if (this.modo === 'pie' && caida > PK.caidaRodadaAlto) {
          this.estado = 'rodada';
          this.estadoT = 0.34;
          this._sumarTruco('Rodada de Aterrizaje', 110, 'parkour');
        }
        this.enAireTruco = false;
      }
      this.vel.y = 0;
      this.enSuelo = true;
      this.alturaCaida = sueloY;
    } else {
      if (this.enSuelo) this.alturaCaida = this.pos.y;
      this.enSuelo = false;
    }

    this._animar(dt);
  }

  _animar(dt) {
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.rumbo;

    const rap = this.rapidezHorizontal();
    this.cicloPaso += dt * (2.5 + rap * 1.45);

    // Animación de extremidades según modo y estado
    if (this.estado === 'deslizar' || this.estado === 'rodada') {
      this.rigCuerpo.rotation.x = this.estado === 'rodada' ? this.estadoT * 18 : -0.65;
      this.rigCuerpo.position.y = 0.25;
    } else {
      this.rigCuerpo.rotation.x = this.modo === 'pie' ? clamp(rap * 0.025, 0, 0.22) : 0.14;
      this._sincronizarVehiculoVisual();
    }

    if (this.modo === 'pie' && this.enSuelo && this.estado === 'libre') {
      const amp = clamp(rap / 6.5, 0, 1) * 0.72;
      this.piernaI.rotation.x = Math.sin(this.cicloPaso) * amp;
      this.piernaD.rotation.x = -Math.sin(this.cicloPaso) * amp;
      this.brazoI.rotation.x = -Math.sin(this.cicloPaso) * amp * 0.85;
      this.brazoD.rotation.x = Math.sin(this.cicloPaso) * amp * 0.85;
    } else if (this.modo === 'skate') {
      this.piernaI.rotation.x = -0.18;
      this.piernaD.rotation.x = 0.18;
      this.brazoI.rotation.z = this.estado === 'grind' ? -0.95 : -0.35;
      this.brazoD.rotation.z = this.estado === 'grind' ? 0.95 : 0.35;
    } else if (this.modo === 'bici') {
      this.brazoI.rotation.x = -0.78;
      this.brazoD.rotation.x = -0.78;
      this.brazoI.rotation.z = 0; this.brazoD.rotation.z = 0;
      const ped = this.cicloPaso * 1.2;
      this.piernaI.rotation.x = -0.4 + Math.sin(ped) * 0.4;
      this.piernaD.rotation.x = -0.4 - Math.sin(ped) * 0.4;
      // Ruedas giratorias de verdad!
      for (const r of this.ruedasBici) r.rotation.x -= rap * dt / 0.33;
    }

    // Giro visual del skate/cuerpo en truco aéreo
    if (this.trucoRot > 0) {
      const paso = Math.min(this.trucoRot, dt * 16);
      this.trucoRot -= paso;
      this.rigSkate.rotation.z = this.trucoRot;
    } else {
      this.rigSkate.rotation.z = 0;
    }
  }
}
