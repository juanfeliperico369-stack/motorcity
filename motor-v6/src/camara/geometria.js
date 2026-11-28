/* Motor City 6 · camara/geometria.js — la geometría que necesita la cámara, sin Three.js ni DOM (se prueba en Node).
   - Obstaculos: los edificios como prismas (una huella en el plano x‑z, una base y una altura), en una rejilla
     espacial para que cada consulta mire solo lo cercano. Es el mismo dato de los sectores (huella, base_m y altura_m).
   - rayo(): la primera entrada de un segmento en un prisma (el brazo de la cámara y la oclusión).
   - contiene(): si un punto queda dentro de un prisma, con margen («la cámara nunca queda dentro de un edificio»).
   - proyectar(): de un punto del mundo a la pantalla, con la misma convención de Three.js (para las pruebas).
   Unidades SI: metros. El eje y es la altura. */

const fin = Number.isFinite;

/** Ángulo de a hacia b, en (−π, π]. */
export const angDif = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
export const limitar = (v, a, b) => (v < a ? a : v > b ? b : v);
export const suave = t => { t = limitar(t, 0, 1); return t * t * (3 - 2 * t); };

/** ¿El punto (x, z) está dentro del polígono? (par‑impar; la huella puede ser cóncava) */
export function dentroPoligono(x, z, ps) {
  let dentro = false;
  for (let i = 0, j = ps.length - 1; i < ps.length; j = i++) {
    const [xi, zi] = ps[i], [xj, zj] = ps[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) dentro = !dentro;
  }
  return dentro;
}

/** Distancia del punto (x, z) al borde del polígono. */
export function distanciaBorde(x, z, ps) {
  let d = Infinity;
  for (let i = 0, j = ps.length - 1; i < ps.length; j = i++) {
    const [ax, az] = ps[j], [bx, bz] = ps[i], ex = bx - ax, ez = bz - az, l2 = ex * ex + ez * ez;
    const t = l2 > 0 ? limitar(((x - ax) * ex + (z - az) * ez) / l2, 0, 1) : 0;
    d = Math.min(d, Math.hypot(x - ax - ex * t, z - az - ez * t));
  }
  return d;
}

/** Cruces del segmento 2D o→o+d (t ∈ [0, 1]) con los lados del polígono, ordenados. */
function cruces2D(ox, oz, dx, dz, ps) {
  const ts = [];
  for (let i = 0, j = ps.length - 1; i < ps.length; j = i++) {
    const [ax, az] = ps[j], [bx, bz] = ps[i], ex = bx - ax, ez = bz - az, den = dx * ez - dz * ex;
    if (Math.abs(den) < 1e-12) continue;   // paralelos: el borde no cambia de dentro a fuera
    const t = ((ax - ox) * ez - (az - oz) * ex) / den, u = ((ax - ox) * dz - (az - oz) * dx) / den;
    if (t > 0 && t < 1 && u >= 0 && u < 1) ts.push(t);
  }
  return ts.sort((a, b) => a - b);
}

/** Primera entrada (t ∈ [0, 1]) del segmento o→o+d en el prisma, o Infinity si no lo toca. */
export function entradaPrisma(o, d, prisma) {
  const { huella, base, tope } = prisma;
  const ts = cruces2D(o.x, o.z, d.x, d.z, huella);
  let dentro = dentroPoligono(o.x, o.z, huella), t0 = 0;
  const bordes = [...ts, 1];
  for (const t1 of bordes) {
    if (dentro && t1 > t0) {
      /* dentro de la huella entre t0 y t1: ¿la altura del segmento está entre la base y el tope? */
      let a = t0, b = t1;
      if (Math.abs(d.y) < 1e-12) { if (o.y < base || o.y > tope) { a = 1; b = 0; } }
      else {
        const tb = (base - o.y) / d.y, tt = (tope - o.y) / d.y, lo = Math.min(tb, tt), hi = Math.max(tb, tt);
        a = Math.max(a, lo); b = Math.min(b, hi);
      }
      if (a <= b) return a;
    }
    dentro = !dentro; t0 = t1;
  }
  return Infinity;
}

/** Los edificios del mundo como prismas, en una rejilla espacial. */
export class Obstaculos {
  constructor({ celda = 32 } = {}) { this.celda = celda; this.rejilla = new Map(); this.lista = []; this.porId = new Map(); }
  get tamano() { return this.lista.length; }
  limpiar() { this.rejilla.clear(); this.lista = []; this.porId.clear(); }
  /** o: { id, huella: [[x, z], …], base_m, altura_m } (el formato de los sectores) o { id, huella, base, tope } */
  agregar(o) {
    const huella = o.huella, base = fin(o.base) ? o.base : o.base_m, tope = fin(o.tope) ? o.tope : base + o.altura_m;
    if (!Array.isArray(huella) || huella.length < 3 || !huella.every(p => fin(p[0]) && fin(p[1])) || !fin(base) || !fin(tope) || tope <= base) return false;
    if (o.id != null && this.porId.has(o.id)) return false;
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const [x, z] of huella) { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); }
    const p = { id: o.id ?? this.lista.length, huella, base, tope, caja: [x0, z0, x1, z1] };
    this.lista.push(p); if (o.id != null) this.porId.set(o.id, p);
    for (const k of this._celdas(x0, z0, x1, z1)) { let c = this.rejilla.get(k); if (!c) this.rejilla.set(k, c = []); c.push(p); }
    return true;
  }
  _celdas(x0, z0, x1, z1) {
    const c = this.celda, ks = [];
    for (let i = Math.floor(x0 / c); i <= Math.floor(x1 / c); i++) for (let j = Math.floor(z0 / c); j <= Math.floor(z1 / c); j++) ks.push(i + ',' + j);
    return ks;
  }
  /** Prismas cuya caja toca la caja [x0, z0, x1, z1] (sin repetir). */
  cerca(x0, z0, x1, z1) {
    const vistos = new Set(), out = [];
    for (const k of this._celdas(x0, z0, x1, z1)) for (const p of this.rejilla.get(k) || []) {
      if (vistos.has(p)) continue; vistos.add(p);
      if (p.caja[0] <= x1 && p.caja[2] >= x0 && p.caja[1] <= z1 && p.caja[3] >= z0) out.push(p);
    }
    return out;
  }
  /** Primera entrada del segmento a→b en algún prisma: { t ∈ [0, 1], id } o null. */
  rayo(a, b) {
    const d = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    let mejor = null;
    for (const p of this.cerca(Math.min(a.x, b.x), Math.min(a.z, b.z), Math.max(a.x, b.x), Math.max(a.z, b.z))) {
      const t = entradaPrisma(a, d, p);
      if (t < (mejor ? mejor.t : Infinity)) mejor = { t, id: p.id };
    }
    return mejor;
  }
  /** Todos los prismas que cruza el segmento a→b (los que tapan). */
  cruzan(a, b) {
    const d = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z }, ids = [];
    for (const p of this.cerca(Math.min(a.x, b.x), Math.min(a.z, b.z), Math.max(a.x, b.x), Math.max(a.z, b.z))) if (entradaPrisma(a, d, p) <= 1) ids.push(p.id);
    return ids;
  }
  /** El id del prisma que contiene el punto, con un margen alrededor, o null. */
  contiene(q, margen = 0) {
    for (const p of this.cerca(q.x - margen, q.z - margen, q.x + margen, q.z + margen)) {
      if (q.y < p.base - margen || q.y > p.tope + margen) continue;
      if (dentroPoligono(q.x, q.z, p.huella) || (margen > 0 && distanciaBorde(q.x, q.z, p.huella) < margen)) return p.id;
    }
    return null;
  }
}

/* ---- Proyección como la de Three.js (lookAt con y arriba y perspectiva con fov vertical), para las pruebas ---- */
function normal(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
function cruz(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
/** De un punto del mundo a la pantalla: { x, y } en [−1, 1] (y hacia arriba) y prof > 0 si está delante. */
export function proyectar(pose, q, aspecto) {
  const e = pose.ojo, t = pose.blanco;
  const zc = normal([e.x - t.x, e.y - t.y, e.z - t.z]), xc = normal(cruz([0, 1, 0], zc)), yc = cruz(zc, xc);
  const v = [q.x - e.x, q.y - e.y, q.z - e.z];
  const cx = v[0] * xc[0] + v[1] * xc[1] + v[2] * xc[2], cy = v[0] * yc[0] + v[1] * yc[1] + v[2] * yc[2], cz = v[0] * zc[0] + v[1] * zc[1] + v[2] * zc[2];
  const f = 1 / Math.tan(pose.fov / 2), prof = -cz;
  return { x: f * cx / (aspecto * prof), y: f * cy / prof, prof };
}
