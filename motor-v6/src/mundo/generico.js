/* Motor City 6 · mundo/generico.js — LO GENÉRICO (plan de Run City § 4.1 y § 13.3: «lo genérico se genera con una semilla
   y no se guarda»; plano motor-city.md: se rescatan las reglas de js/12-generador, manzanas y casas a la manera de Townscaper).
   Llena el frente de cada calle con edificios que dan a la calle, como en una ciudad de verdad, y siembra árboles en los
   andenes. Es igual para Orbe (diseñada) y para el valle (craqueado): solo necesita la red, el relieve y qué no se toca.
   Las reglas del craqueo (§ 13.2) se cumplen por construcción y se prueban (tests/generico.mjs):
   - nada encima de las vías ni de las ciclorrutas: cada edificio queda detrás del andén (ancho/2 + andén);
   - nada en el agua ni donde el juego lo prohíba (el aeropuerto, una plaza…): prohibido(x, z);
   - nada encima de los hitos ni de otro edificio, y cada uno queda entero dentro de su sector (no se cruzan entre sectores);
   - las casas se anclan a la ladera: la base es la cota más baja de su huella (con zócalo), y no se construye si la
     pendiente es excesiva.
   Determinista: la misma semilla y el mismo sector dan siempre la misma ciudad (y no se guarda nada). Unidades SI. */

const fin = Number.isFinite;
/** Generador pseudoaleatorio pequeño y repetible (mulberry32) desde un texto. */
export function azarDe(texto) {
  let h = 1779033703 ^ texto.length;
  for (let i = 0; i < texto.length; i++) { h = Math.imul(h ^ texto.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let s = h >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const entre = (r, [a, b]) => a + (b - a) * r();

/** Los estilos de manzana. El juego dice cuál va en cada barrio (y puede traer los suyos). Medidas en metros. */
export const ESTILOS_GENERICOS = Object.freeze({
  centro: Object.freeze({ frente: [11, 24], fondo: [13, 22], altura: [10, 44], torres: 0.22, hueco: [0.5, 2.5], llenar: 0.94, segundaFila: true, arboles: 14 }),
  barrio: Object.freeze({ frente: [8, 15], fondo: [10, 16], altura: [6, 16], torres: 0.08, hueco: [1, 3.5], llenar: 0.88, segundaFila: true, arboles: 11 }),
  puerto: Object.freeze({ frente: [18, 34], fondo: [16, 26], altura: [7, 13], torres: 0, hueco: [3, 8], llenar: 0.75, segundaFila: false, arboles: 22 }),
  costa: Object.freeze({ frente: [9, 15], fondo: [9, 14], altura: [4, 9], torres: 0.04, hueco: [2.5, 7], llenar: 0.7, segundaFila: false, arboles: 9 }),
  loma: Object.freeze({ frente: [8, 13], fondo: [8, 12], altura: [4, 10], torres: 0, hueco: [2, 6], llenar: 0.72, segundaFila: true, arboles: 10 }),
  campo: Object.freeze({ frente: [9, 14], fondo: [9, 13], altura: [4, 7], torres: 0, hueco: [14, 34], llenar: 0.45, segundaFila: false, arboles: 8 }),
  parque: Object.freeze({ frente: [10, 16], fondo: [10, 14], altura: [4, 8], torres: 0, hueco: [24, 50], llenar: 0.3, segundaFila: false, arboles: 6 }),
  ninguno: Object.freeze({ frente: [10, 10], fondo: [10, 10], altura: [4, 4], torres: 0, hueco: [1, 1], llenar: 0, segundaFila: false, arboles: 0 }),
});

/* ---- geometría plana ---- */
function distPuntoSeg(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)) : 0;
  return Math.hypot(px - ax - dx * t, pz - az - dz * t);
}
function cruzan(a, b, c, d) {
  const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}
function dentro(px, pz, ps) {
  let r = false;
  for (let i = 0, j = ps.length - 1; i < ps.length; j = i++) { const [xi, zi] = ps[i], [xj, zj] = ps[j]; if ((zi > pz) !== (zj > pz) && px < (xj - xi) * (pz - zi) / (zj - zi) + xi) r = !r; }
  return r;
}
/** Distancia de un segmento a un polígono (0 si se tocan o el segmento entra). */
export function distSegPoligono(a, b, ps) {
  if (dentro(a[0], a[1], ps) || dentro(b[0], b[1], ps)) return 0;
  let d = Infinity;
  for (let i = 0, j = ps.length - 1; i < ps.length; j = i++) {
    if (cruzan(a, b, ps[j], ps[i])) return 0;
    d = Math.min(d, distPuntoSeg(a[0], a[1], ps[j][0], ps[j][1], ps[i][0], ps[i][1]), distPuntoSeg(b[0], b[1], ps[j][0], ps[j][1], ps[i][0], ps[i][1]),
      distPuntoSeg(ps[i][0], ps[i][1], a[0], a[1], b[0], b[1]));
  }
  return d;
}
/** ¿Se montan dos polígonos convexos, con una separación mínima? (ejes separadores) */
export function semontan(p, q, separacion = 0) {
  for (const ps of [p, q]) for (let i = 0; i < ps.length; i++) {
    const a = ps[i], b = ps[(i + 1) % ps.length], nx = -(b[1] - a[1]), nz = b[0] - a[0], l = Math.hypot(nx, nz) || 1;
    let pmin = Infinity, pmax = -Infinity, qmin = Infinity, qmax = -Infinity;
    for (const v of p) { const t = (v[0] * nx + v[1] * nz) / l; pmin = Math.min(pmin, t); pmax = Math.max(pmax, t); }
    for (const v of q) { const t = (v[0] * nx + v[1] * nz) / l; qmin = Math.min(qmin, t); qmax = Math.max(qmax, t); }
    if (pmax + separacion <= qmin || qmax + separacion <= pmin) return false;
  }
  return true;
}
function caja(ps, m = 0) { let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity; for (const [x, z] of ps) { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); } return [x0 - m, z0 - m, x1 + m, z1 + m]; }

class Rejilla {
  constructor(c = 32) { this.c = c; this.m = new Map(); }
  _ks([x0, z0, x1, z1]) { const c = this.c, ks = []; for (let i = Math.floor(x0 / c); i <= Math.floor(x1 / c); i++) for (let j = Math.floor(z0 / c); j <= Math.floor(z1 / c); j++) ks.push(i + ',' + j); return ks; }
  poner(b, v) { for (const k of this._ks(b)) { let l = this.m.get(k); if (!l) this.m.set(k, l = []); l.push(v); } }
  cerca(b) { const s = new Set(); for (const k of this._ks(b)) for (const v of this.m.get(k) || []) s.add(v); return s; }
}

/** El rectángulo de un edificio: centro, dirección de la calle (ux, uz), medio frente y medio fondo. */
function rectangulo(cx, cz, ux, uz, hw, hd) {
  const nx = -uz, nz = ux;
  return [[cx - ux * hw - nx * hd, cz - uz * hw - nz * hd], [cx + ux * hw - nx * hd, cz + uz * hw - nz * hd], [cx + ux * hw + nx * hd, cz + uz * hw + nz * hd], [cx - ux * hw + nx * hd, cz - uz * hw + nz * hd]];
}

/**
 * Genera la ciudad genérica de un sector.
 * @param {object} p
 *   id, celda [x0, z0, x1, z1]; tramos (los del sector y sus vecinos: { id, red: 'vial'|'ciclovia', ancho_m, puntos }),
 *   objetos (los hitos y edificios que ya existen: { huella }), altura(x, z) → cota o undefined, prohibido(x, z) → bool,
 *   estilo (un nombre de ESTILOS_GENERICOS o un objeto), semilla, andenVial (3 m), andenCiclo (1,5 m), pendienteMax (6 m).
 * @returns {{ objetos: Array, arboles: Array }}
 */
export function generarGenerico({ id, celda, tramos = [], objetos = [], altura = () => 0, prohibido = () => false, estilo = 'barrio', semilla = 'mc6', andenVial = 3, andenCiclo = 1.5, pendienteMax = 6 }) {
  const E = typeof estilo === 'string' ? ESTILOS_GENERICOS[estilo] || ESTILOS_GENERICOS.barrio : estilo;
  const r = azarDe(semilla + ':' + id), [x0, z0, x1, z1] = celda, salida = { objetos: [], arboles: [] };
  if (!E || E.llenar <= 0) return salida;
  /* las vías y las ciclorrutas, con su andén, en una rejilla */
  const segs = new Rejilla(32), lista = [];
  for (const t of tramos) {
    if (!Array.isArray(t.puntos) || t.puntos.length < 2 || !fin(t.ancho_m)) continue;
    const libre = t.ancho_m / 2 + (t.red === 'ciclovia' ? andenCiclo : andenVial);
    for (let i = 1; i < t.puntos.length; i++) { const s = { a: t.puntos[i - 1], b: t.puntos[i], libre, red: t.red, tramo: t.id }; lista.push(s); segs.poner(caja([s.a, s.b], libre), s); }
  }
  /* lo que ya existe (hitos y edificios de los datos), con 4 m de aire */
  const ocupado = new Rejilla(32), puestos = new Rejilla(32);
  for (const o of objetos) if (Array.isArray(o.huella) && o.huella.length >= 3) ocupado.poner(caja(o.huella, 4), caja(o.huella, 4));
  const libreDeVias = (ps, holgura = 0) => { for (const s of segs.cerca(caja(ps, 1))) if (distSegPoligono(s.a, s.b, ps) < s.libre + holgura) return false; return true; };
  const libreDeObjetos = ps => { const b = caja(ps); for (const o of ocupado.cerca(b)) if (b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]) return false; return true; };
  const libreDePuestos = (ps, sep) => { for (const q of puestos.cerca(caja(ps, sep))) if (semontan(ps, q, sep)) return false; return true; };
  const borde = andenVial + 0.5;                             /* lejos del borde de la celda: la vía de un vecino nunca queda en su andén */
  const enCelda = ps => ps.every(([x, z]) => x > x0 + borde && x < x1 - borde && z > z0 + borde && z < z1 - borde);
  function intentar(ps, tono) {
    if (!enCelda(ps) || ps.some(([x, z]) => prohibido(x, z))) return false;
    const [cx, cz] = [(ps[0][0] + ps[2][0]) / 2, (ps[0][1] + ps[2][1]) / 2];
    if (prohibido(cx, cz)) return false;
    const hs = [...ps.map(([x, z]) => altura(x, z)), altura(cx, cz)];
    if (!hs.every(fin)) return false;
    const hmin = Math.min(...hs), hmax = Math.max(...hs);
    if (hmax - hmin > pendienteMax) return false;
    if (!libreDeVias(ps) || !libreDeObjetos(ps) || !libreDePuestos(ps, 0.6)) return false;
    const torre = r() < E.torres, h = torre ? entre(r, [E.altura[1] * 0.7, E.altura[1]]) : E.altura[0] + (E.altura[1] * 0.6 - E.altura[0]) * r() ** 1.6;
    const alto = Math.max(3, Math.round(h / 3) * 3) + 0.6 + (hmax - hmin);   /* pisos de 3 m, el antepecho, y el zócalo de la ladera */
    salida.objetos.push({ id: `gen_${id}_${salida.objetos.length}`, huella: ps.map(([x, z]) => [Math.round(x * 100) / 100, Math.round(z * 100) / 100]), base_m: Math.round((hmin - 0.3) * 100) / 100, altura_m: Math.round(alto * 100) / 100, tono, generico: true });
    puestos.poner(caja(ps), ps);
    return true;
  }
  /* los frentes: a cada lado de cada vía, de punta a punta */
  for (const t of tramos) {
    if (t.red !== 'vial' || !Array.isArray(t.puntos) || t.puntos.length < 2) continue;
    const libre = t.ancho_m / 2 + andenVial;
    for (const lado of [-1, 1]) for (let i = 1; i < t.puntos.length; i++) {
      const [ax, az] = t.puntos[i - 1], [bx, bz] = t.puntos[i], L = Math.hypot(bx - ax, bz - az); if (L < 6) continue;
      const ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz * lado, nz = ux * lado;
      let s = 4 + r() * 3;                                     /* las esquinas quedan libres */
      while (s < L - 4) {
        if (r() > E.llenar) { s += entre(r, E.frente) * 0.6; continue; }
        const w = entre(r, E.frente), d = entre(r, E.fondo);
        if (s + w > L - 4) break;
        const off = libre + 0.4 + d / 2, cx = ax + ux * (s + w / 2) + nx * off, cz = az + uz * (s + w / 2) + nz * off;
        const tono = r();
        if (intentar(rectangulo(cx, cz, ux, uz, w / 2, d / 2), tono)) {
          if (E.segundaFila && r() < 0.6) { const d2 = entre(r, E.fondo) * 0.8, off2 = off + d / 2 + 2 + d2 / 2; intentar(rectangulo(ax + ux * (s + w / 2) + nx * off2, az + uz * (s + w / 2) + nz * off2, ux, uz, w * 0.45, d2 / 2), r()); }
          s += w + entre(r, E.hueco);
        } else s += 3;
      }
    }
  }
  /* los árboles, en los andenes de las vías y a la orilla de las ciclorrutas */
  if (E.arboles > 0) for (const t of tramos) {
    if (!Array.isArray(t.puntos) || t.puntos.length < 2 || !fin(t.ancho_m)) continue;
    const off = t.ancho_m / 2 + (t.red === 'ciclovia' ? andenCiclo * 0.7 : andenVial * 0.6);
    for (const lado of [-1, 1]) for (let i = 1; i < t.puntos.length; i++) {
      const [ax, az] = t.puntos[i - 1], [bx, bz] = t.puntos[i], L = Math.hypot(bx - ax, bz - az); if (L < 10) continue;
      const ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz * lado, nz = ux * lado;
      for (let s = 6 + r() * E.arboles; s < L - 6; s += E.arboles * (0.8 + r() * 0.4)) {
        const x = ax + ux * s + nx * off, z = az + uz * s + nz * off;
        if (x < x0 || x >= x1 || z < z0 || z >= z1 || prohibido(x, z)) continue;
        let ok = true;
        for (const sg of segs.cerca([x - 2, z - 2, x + 2, z + 2])) if (distPuntoSeg(x, z, sg.a[0], sg.a[1], sg.b[0], sg.b[1]) < (sg.libre - (sg.red === 'ciclovia' ? andenCiclo : andenVial)) + 0.8) { ok = false; break; }
        if (!ok) continue;
        for (const q of puestos.cerca([x - 2, z - 2, x + 2, z + 2])) if (dentro(x, z, q) || q.some((v, k) => distPuntoSeg(x, z, v[0], v[1], q[(k + 1) % 4][0], q[(k + 1) % 4][1]) < 1.2)) { ok = false; break; }
        if (!ok || !libreDeObjetos([[x - 1, z - 1], [x + 1, z - 1], [x + 1, z + 1], [x - 1, z + 1]])) continue;
        const y = altura(x, z); if (!fin(y)) continue;
        salida.arboles.push({ x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100, y: Math.round(y * 100) / 100, escala: Math.round((0.8 + r() * 0.5) * 100) / 100, tipo: r() < 0.5 ? 0 : 1 });
      }
    }
  }
  return salida;
}
