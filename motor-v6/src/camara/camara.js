/* Motor City 6 · camara/camara.js — LA CÁMARA ÚNICA de Run City (plan § 5: lo crucial).
   Lo que pidió el autor: «cenital enteramente, ligeramente inclinada como en tercera persona y de estilo panorámica […]
   no muy cercana ni lejana, lo justo, donde se puede notar la diferencia de tamaños […] se redirecciona según la dirección
   en la que va de frente el jugador […] mover a gusto la cámara y hacer el zoom necesario».
   - Lo justo: ~50° de inclinación, a ~36 m, con el campo de visión según la pantalla (en vertical se abre para ver más
     ciudad) y mirando un poco adelante del rumbo. El zoom va de «de lejos» (120 m, 62°) a «casi tercera persona» (7 m, 21°).
   - Sigue el rumbo con un resorte críticamente amortiguado (sin rebote), con zona muerta (12°, con histéresis), giro máximo
     (100°/s) y quieto no gira. Corre en el paso fijo del bucle, así que tarda lo mismo a 30, 60 o 144 cuadros por segundo.
   - A gusto: girar, inclinar y acercar (dos dedos, pellizco o rueda); después de tocarla espera 2,5 s antes de volver a
     seguir el rumbo. centrar() la pone detrás del jugador otra vez.
   - Nada se interpone: si el ojo quedaría dentro de un edificio, primero sube (como una grúa, para no perder la panorámica)
     y si no alcanza, el brazo se encoge, con un resorte rápido al encoger y lento al estirar. Nunca queda dentro: si el
     resorte no llegó, se corrige en el mismo paso. Lo que tapa al jugador se vuelve transparente (render/oclusion.js, con
     el dato pose().oclusion).
   - La carrera: pasa a la persecución de Run Scooter (RunRunZero/src/render.js:55-59) en 0,8 s y vuelve igual.
   - Al ir rápido se abre un poco y mira más adelante; con menosMovimiento no.
   Sin Three.js ni DOM: el adaptador es camara/three.js. Convención de rumbo de la física: 0 avanza hacia +z, π/2 hacia +x. */
import { angDif, limitar, suave } from './geometria.js';

const G = Math.PI / 180;

export const PERFIL_CAMARA = Object.freeze({
  zoomInicial: 0.36,                                            // «lo justo»
  lejos: Object.freeze({ distancia: 120, inclinacion: 62 * G, altura: 1.0 }),
  justo: Object.freeze({ distancia: 36, inclinacion: 50 * G, altura: 1.1 }),
  cerca: Object.freeze({ distancia: 7, inclinacion: 21 * G, altura: 1.55 }),
  /* persecución de Run Scooter: el ojo ~6,6 m detrás y ~3,4 m arriba, mirando 10 m adelante a 1,1 m, con 62° */
  carrera: Object.freeze({ distancia: 16.8, inclinacion: 8 * G, altura: 1.1, adelanto: 10, fov: 62 * G }),
  fovHorizontal: 36 * G, fovMin: 40 * G, fovMax: 62 * G, fovCerca: 6 * G,
  adelantoSeg: 0.55, adelantoMax: 9, adelantoLado: 0.45, adelantoAtras: 0.15, tAdelanto: 0.35, tAltura: 0.15,
  rapidezMinima: 0.8, zonaMuerta: 12 * G, zonaQuieta: 1.5 * G, omega: 3.9, giroMax: 100 * G, omegaCarrera: 7,
  esperaManual: 2.5, ajusteMax: 25 * G, inclinacionMin: 15 * G, inclinacionMax: 80 * G, tZoom: 0.12,
  margen: 0.9, margenSuelo: 1.4, subirMax: 22 * G, pasosSubida: 6, tEncoger: 0.06, tEstirar: 0.7, tBajar: 0.8, tapaCerca: 0.45,
  transicion: 0.8,
  velocidad: Object.freeze({ desde: 4, hasta: 14, distancia: 0.12, fov: 5 * G }),
});

const mezclar = (a, b, k) => a + (b - a) * k;
const acercarExp = (v, meta, tau, dt) => (tau <= 0 ? meta : meta + (v - meta) * Math.exp(-dt / tau));

export class Camara {
  /** colisiones: un Obstaculos (camara/geometria.js) o algo con rayo(a, b) y contiene(p, margen); terreno: (x, z) => altura | undefined */
  constructor({ perfil = PERFIL_CAMARA, colisiones = null, terreno = null, aspecto = 412 / 860 } = {}) {
    this.p = perfil; this.colisiones = colisiones; this.terreno = terreno; this.aspecto = aspecto;
    this.guinada = 0; this.vGuinada = 0; this.alineando = false; this.centrando = false; this.espera = 0;
    this.zoom = perfil.zoomInicial; this.zoomObj = this.zoom; this.ajuste = 0;
    this.carrera = 0; this.enCarrera = false; this.menosMovimiento = false; this.seguirRumbo = true;
    this.brazo = 1; this.subida = 0; this.adelanto = { x: 0, z: 0 }; this.alturaBlanco = null;
    this.ojo = { x: 0, y: 30, z: -30 }; this.blanco = { x: 0, y: 0, z: 0 }; this.fov = 50 * G;
    this.oclusion = { activa: false, ids: [] }; this.correcciones = 0; this.colocada = false;
    this._prev = null;
  }

  /* ---------- a gusto del jugador ---------- */
  girar(d) { if (!Number.isFinite(d) || this.enCarrera) return; this.guinada += d; this.vGuinada = 0; this._tocada(); }
  inclinar(d) { if (!Number.isFinite(d) || this.enCarrera) return; this.ajuste = limitar(this.ajuste + d, -this.p.ajusteMax, this.p.ajusteMax); this._tocada(); }
  /** d > 0 acerca (pellizco abriendo, rueda hacia adelante) */
  acercar(d) { if (!Number.isFinite(d)) return; this.zoomObj = limitar(this.zoomObj + d, 0, 1); this._tocada(); }
  fijarZoom(z) { if (Number.isFinite(z)) this.zoomObj = limitar(z, 0, 1); }
  /** El botón «centrar»: detrás del jugador, la inclinación y el zoom de siempre. */
  centrar() { this.espera = 0; this.centrando = true; this.ajuste = 0; this.zoomObj = this.p.zoomInicial; }
  _tocada() { this.espera = this.p.esperaManual; this.alineando = false; this.centrando = false; }
  entrarCarrera() { this.enCarrera = true; this.espera = 0; }
  salirCarrera() { this.enCarrera = false; }
  get tocadaHace() { return this.p.esperaManual - this.espera; }

  /** Adelante y derecha EN PANTALLA, sobre el plano: para que la palanca vaya según la pantalla. */
  base() {
    const s = Math.sin(this.guinada), c = Math.cos(this.guinada);
    return { adelante: { x: s, z: c }, derecha: { x: -c, z: s } };
  }

  /** Los parámetros del encuadre para un zoom (sin la carrera ni la velocidad). */
  encuadre(z = this.zoom) {
    const P = this.p, zi = P.zoomInicial;
    const [a, b, k] = z <= zi ? [P.lejos, P.justo, zi > 0 ? z / zi : 1] : [P.justo, P.cerca, (z - zi) / (1 - zi)];
    const distancia = Math.exp(mezclar(Math.log(a.distancia), Math.log(b.distancia), k));
    const cercania = z <= zi ? 0 : suave(k);
    return { distancia, inclinacion: mezclar(a.inclinacion, b.inclinacion, k), altura: mezclar(a.altura, b.altura, k), cercania };
  }
  /** fov vertical según la pantalla: en vertical (celular parado) se abre para ver más ciudad a los lados. */
  fovBase(aspecto = this.aspecto) {
    const P = this.p; return limitar(2 * Math.atan(Math.tan(P.fovHorizontal / 2) / aspecto), P.fovMin, P.fovMax);
  }

  /** Pone la cámara detrás del jugador de una vez (al empezar o al aparecer en otro lugar). */
  colocar(obj) {
    this.guinada = obj.rumbo || 0; this.vGuinada = 0; this.alineando = false; this.espera = 0;
    this.adelanto = { x: 0, z: 0 }; this.alturaBlanco = obj.y; this.brazo = 1; this.subida = 0; this.zoom = this.zoomObj;
    this.carrera = this.enCarrera ? 1 : 0; this.colocada = true;
    this._componer(obj, 0, true); this._prev = this._foto();
  }

  /** Un paso fijo (dt = 1/60 s). obj: { x, y, z, rumbo, rapidez, rumboVia? } */
  paso(dt, obj) {
    if (!this.colocada) this.colocar(obj);
    this._prev = this._foto();
    const P = this.p;
    /* el zoom (llega justo a sus extremos) y la transición a la carrera */
    this.zoom = acercarExp(this.zoom, this.zoomObj, P.tZoom, dt); if (Math.abs(this.zoom - this.zoomObj) < 1e-4) this.zoom = this.zoomObj;
    this.carrera = limitar(this.carrera + (this.enCarrera ? dt : -dt) / P.transicion, 0, 1);
    /* el rumbo */
    this._seguirRumbo(dt, obj);
    this._componer(obj, dt, false);
  }

  _seguirRumbo(dt, obj) {
    const P = this.p;
    if (this.espera > 0) this.espera = Math.max(0, this.espera - dt);
    let meta = null, omega = P.omega, tope = P.giroMax;
    if (this.enCarrera) { meta = Number.isFinite(obj.rumboVia) ? obj.rumboVia : obj.rumbo; omega = P.omegaCarrera; tope = P.giroMax * 2.5; }
    else if (this.espera > 0) meta = null;                                    // la tocaron: espera
    else if (this.centrando) { meta = obj.rumbo; if (Math.abs(angDif(this.guinada, meta)) < P.zonaQuieta) this.centrando = false; }
    else if (this.seguirRumbo && (obj.rapidez || 0) > P.rapidezMinima) {     // quieto, no gira (y el jugador puede apagarlo)
      const e = Math.abs(angDif(this.guinada, obj.rumbo));
      if (!this.alineando && e > P.zonaMuerta) this.alineando = true;
      if (this.alineando && e < P.zonaQuieta) this.alineando = false;
      if (this.alineando) meta = obj.rumbo;
    } else this.alineando = false;
    if (meta === null) { this.vGuinada *= Math.exp(-dt * 12); if (Math.abs(this.vGuinada) < 1e-4) this.vGuinada = 0; this.guinada += this.vGuinada * dt; return; }
    /* resorte críticamente amortiguado, con la solución exacta del paso (no rebota ni depende de dt) */
    const y0 = -angDif(this.guinada, meta), v0 = this.vGuinada, ex = Math.exp(-omega * dt);
    let y1 = (y0 + (v0 + omega * y0) * dt) * ex, v1 = (v0 - omega * (v0 + omega * y0) * dt) * ex;
    let d = y1 - y0;
    if (Math.abs(d) > tope * dt) { d = Math.sign(d) * tope * dt; v1 = Math.sign(d) * tope; }
    this.guinada += d; this.vGuinada = v1;
  }

  /** Arma el ojo, el blanco y el fov; aplica el brazo y la subida contra los edificios y el relieve. */
  _componer(obj, dt, deUna) {
    const P = this.p, e = this.encuadre(), k = suave(this.carrera), C = P.carrera;
    /* la velocidad se siente (sin marear: con menosMovimiento no) */
    const rap = obj.rapidez || 0, kv = this.menosMovimiento ? 0 : limitar((rap - P.velocidad.desde) / (P.velocidad.hasta - P.velocidad.desde), 0, 1);
    let distancia = mezclar(e.distancia * (1 + P.velocidad.distancia * kv), C.distancia, k);
    const inclinacionBase = limitar(mezclar(e.inclinacion + this.ajuste, C.inclinacion, k), P.inclinacionMin * (1 - k), P.inclinacionMax);
    const altura = mezclar(e.altura, C.altura, k);
    const fov = mezclar(this.fovBase() + P.fovCerca * e.cercania + P.velocidad.fov * kv, C.fov, k);
    /* mira un poco adelante del rumbo (suavizado, para que un giro no dé un salto). Pero el jugador nunca sale de la
       pantalla: lo que se corra de lado respecto a la cámara se limita a una franja segura (en vertical la vista es
       angosta), y en la carrera mira solo hacia donde ya mira la cámara mientras gira hacia la vía. */
    const sR = Math.sin(obj.rumbo || 0), cR = Math.cos(obj.rumbo || 0), sG = Math.sin(this.guinada), cG = Math.cos(this.guinada);
    const largo = mezclar(Math.min(rap * P.adelantoSeg, P.adelantoMax) * limitar(e.distancia / P.justo.distancia, 0.25, 1.6), C.adelanto, k);
    const frente = (sR * sG + cR * cG) * largo, lado = (sR * -cG + cR * sG) * largo;
    const ladoMax = P.adelantoLado * distancia * Math.tan(Math.atan(Math.tan(fov / 2) * this.aspecto)) * (1 - k);
    const frenteC = Math.max(mezclar(frente, largo, k), -P.adelantoAtras * distancia), ladoC = limitar(lado, -ladoMax, ladoMax);
    const ax = sG * frenteC - cG * ladoC, az = cG * frenteC + sG * ladoC;
    if (deUna) this.adelanto = { x: ax, z: az };
    else { this.adelanto.x = acercarExp(this.adelanto.x, ax, P.tAdelanto * (1 - k * 0.8), dt); this.adelanto.z = acercarExp(this.adelanto.z, az, P.tAdelanto * (1 - k * 0.8), dt); }
    this.alturaBlanco = deUna || this.alturaBlanco === null ? obj.y : acercarExp(this.alturaBlanco, obj.y, P.tAltura, dt);
    const blanco = { x: obj.x + this.adelanto.x, y: this.alturaBlanco + altura, z: obj.z + this.adelanto.z };
    /* el brazo. Lo que tapa cerca del JUGADOR se vuelve transparente (render/oclusion.js); lo que taparía cerca de la
       CÁMARA (una pared contra el lente) no se deja: primero sube como una grúa para pasar por encima, y si no alcanza,
       el brazo se encoge. Y el ojo nunca queda dentro de un edificio. */
    const ojoCon = (incl, frac) => ({ x: blanco.x - sG * Math.cos(incl) * distancia * frac, y: blanco.y + Math.sin(incl) * distancia * frac, z: blanco.z - cG * Math.cos(incl) * distancia * frac });
    const cabeza = { x: obj.x, y: obj.y + 1.5, z: obj.z };
    const bien = q => this._libre(q) && !this._tapaCerca(cabeza, q);
    let subidaObj = 0, brazoObj = 1;
    if (!bien(ojoCon(inclinacionBase, 1))) {
      const maxSub = Math.max(0, Math.min(P.subirMax, P.inclinacionMax - inclinacionBase)) * (1 - k);
      subidaObj = null;
      for (let i = 1; i <= P.pasosSubida && maxSub > 0; i++) { const s = maxSub * i / P.pasosSubida; if (bien(ojoCon(inclinacionBase + s, 1))) { subidaObj = s; break; } }
      if (subidaObj === null) { subidaObj = maxSub; brazoObj = this._brazoLibre(bien, ojoCon, inclinacionBase + subidaObj); }
    }
    if (deUna) { this.subida = subidaObj; this.brazo = brazoObj; }
    else {
      this.subida = acercarExp(this.subida, subidaObj, subidaObj > this.subida ? P.tEncoger : P.tBajar, dt);
      this.brazo = acercarExp(this.brazo, brazoObj, brazoObj < this.brazo ? P.tEncoger : P.tEstirar, dt);
    }
    let ojo = ojoCon(inclinacionBase + this.subida, this.brazo);
    /* nunca dentro: si el resorte no llegó, se corrige en este mismo paso */
    if (!this._libre(ojo)) {
      this.subida = subidaObj; this.brazo = Math.min(this.brazo, brazoObj); ojo = ojoCon(inclinacionBase + this.subida, this.brazo);
      if (!this._libre(ojo)) { this.brazo = this._brazoLibre(q => this._libre(q), ojoCon, inclinacionBase + this.subida); ojo = ojoCon(inclinacionBase + this.subida, this.brazo); }
      this.correcciones++;
    }
    if (this.terreno) { const h = this.terreno(ojo.x, ojo.z); if (Number.isFinite(h) && ojo.y < h + P.margenSuelo) ojo.y = h + P.margenSuelo; }
    this.ojo = ojo; this.blanco = blanco; this.fov = fov; this.distancia = distancia * this.brazo; this.inclinacion = inclinacionBase + this.subida;
    /* lo que tapa al jugador (de la cabeza al ojo): render/oclusion.js lo vuelve transparente */
    const ids = this.colisiones?.cruzan ? this.colisiones.cruzan(ojo, cabeza) : [];
    this.oclusion = { activa: ids.length > 0, ids, jugador: cabeza, ojo: { ...ojo }, radio: limitar(this.distancia * 0.09, 2.2, 6) };
  }

  /** ¿Algo (un edificio o el relieve) tapa la vista cerca de la cámara, en la parte del brazo más allá de tapaCerca? */
  _tapaCerca(cabeza, q) {
    const P = this.p;
    if (this.colisiones?.rayo) { const r = this.colisiones.rayo(cabeza, q); if (r && r.t > P.tapaCerca) return true; }
    if (this.terreno) for (let i = 0; i <= 6; i++) {
      const t = P.tapaCerca + (1 - P.tapaCerca) * i / 6, x = cabeza.x + (q.x - cabeza.x) * t, z = cabeza.z + (q.z - cabeza.z) * t, y = cabeza.y + (q.y - cabeza.y) * t, h = this.terreno(x, z);
      if (Number.isFinite(h) && y < h + 0.5) return true;
    }
    return false;
  }

  /** ¿Ese ojo está fuera de los edificios (con margen) y sobre el relieve? */
  _libre(q) {
    if (this.colisiones && this.colisiones.contiene(q, this.p.margen) !== null) return false;
    if (this.terreno) { const h = this.terreno(q.x, q.z); if (Number.isFinite(h) && q.y < h + this.p.margenSuelo * 0.5) return false; }
    return true;
  }
  /** La fracción del brazo más larga que la regla acepta (encogiendo de a 15 %, con un piso de 0,12). */
  _brazoLibre(acepta, ojoCon, incl) {
    let frac = 1;
    while (frac > 0.12 && !acepta(ojoCon(incl, frac))) frac *= 0.85;
    return Math.max(0.12, frac);
  }
  _foto() { return { ojo: { ...this.ojo }, blanco: { ...this.blanco }, fov: this.fov }; }
  /** La pose para dibujar, interpolada entre el paso anterior y el actual (alfa ∈ [0, 1) del bucle). */
  pose(alfa = 1) {
    const a = this._prev || this._foto(), b = this._foto(), m = (u, v) => ({ x: mezclar(u.x, v.x, alfa), y: mezclar(u.y, v.y, alfa), z: mezclar(u.z, v.z, alfa) });
    return { ojo: m(a.ojo, b.ojo), blanco: m(a.blanco, b.blanco), fov: mezclar(a.fov, b.fov, alfa), oclusion: this.oclusion };
  }
  estado() {
    return { guinada: this.guinada, zoom: this.zoom, zoomObj: this.zoomObj, ajuste: this.ajuste, espera: this.espera, alineando: this.alineando, carrera: this.carrera,
      distancia: this.distancia, inclinacion: this.inclinacion, fov: this.fov, brazo: this.brazo, subida: this.subida, oclusion: this.oclusion.activa, correcciones: this.correcciones };
  }
}
