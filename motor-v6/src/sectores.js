/* Carga por cercanía. El catálogo aporta {id,url,x,z} en metros y el juego
 * decide qué sectores son visibles. Para el formato v1 de Run City el centro
 * es origen[0,1] + tamano_m / 2. La caché no conserva más de `tope` sectores.
 * El formato de datos final y la construcción de mallas pertenecen al juego. */
export class CargadorSectores {
  constructor({ catalogo, tope = 32, concurrencia = 2, trabajador, alCargar = () => {}, alError = () => {} }) {
    if (!Number.isInteger(tope) || tope < 1 || !Number.isInteger(concurrencia) || concurrencia < 1) throw new RangeError('Límites inválidos');
    this.catalogo = new Map();
    for (const s of catalogo) {
      if (this.catalogo.has(s.id) || typeof s.id !== 'string' || !s.url || !Number.isFinite(s.x) || !Number.isFinite(s.z)) throw new TypeError('Catálogo inválido');
      this.catalogo.set(s.id, s);
    }
    this.tope = tope; this.concurrencia = concurrencia; this.alCargar = alCargar; this.alError = alError;
    this.cache = new Map(); this.pendientes = new Map(); this.cola = []; this.deseados = new Set(); this.cerrado = false;
    this.trabajador = trabajador || new Worker(new URL('./mundo/trabajador-sectores.js', import.meta.url), { type: 'module' });
    this.recibir = e => this._recibir(e.data);
    this.trabajador.addEventListener('message', this.recibir);
  }
  actualizar({ x, z, rumbo = 0, visibles = [], radio = 500 }) {
    if (this.cerrado) throw new Error('Cargador cerrado');
    if (![x, z, rumbo, radio].every(Number.isFinite) || radio < 0) throw new RangeError('Posición o radio inválido');
    const vista = new Set(visibles);
    for (const id of vista) if (!this.catalogo.has(id)) throw new RangeError(`Sector desconocido: ${id}`);
    if (vista.size > this.tope) throw new RangeError('La caché no alcanza para los sectores visibles');
    // Siempre primero lo visible; después cercanía y sesgo hacia el rumbo (+z).
    const candidatos = [...this.catalogo.values()].map(s => {
      const dx = s.x - x, dz = s.z - z, distancia = Math.hypot(dx, dz);
      return { s, distancia, prioridad: distancia - (dx * Math.sin(rumbo) + dz * Math.cos(rumbo)) * .35 };
    }).filter(c => vista.has(c.s.id) || c.distancia <= radio)
      .sort((a, b) => Number(vista.has(b.s.id)) - Number(vista.has(a.s.id)) || a.prioridad - b.prioridad || a.s.id.localeCompare(b.s.id)).slice(0, this.tope);
    this.deseados = new Set(candidatos.map(c => c.s.id));
    for (const { s } of candidatos) if (this.cache.has(s.id)) { const v = this.cache.get(s.id); this.cache.delete(s.id); this.cache.set(s.id, v); }
    this.cola = candidatos.map(c => c.s).filter(s => !this.cache.has(s.id) && !this.pendientes.has(s.id));
    this._despachar();
  }
  _despachar() {
    while (!this.cerrado && this.pendientes.size < this.concurrencia && this.cola.length) {
      const s = this.cola.shift(); this.pendientes.set(s.id, s); this.trabajador.postMessage({ id: s.id, url: s.url });
    }
  }
  _recibir({ id, sector, error }) {
    if (!this.pendientes.has(id) || this.cerrado) return;
    this.pendientes.delete(id);
    if (error) this.alError(id, error);
    else if (this.deseados.has(id)) {
      this.cache.delete(id); this.cache.set(id, sector);
      while (this.cache.size > this.tope) {
        const expulsar = [...this.cache.keys()].find(clave => !this.deseados.has(clave)) ?? this.cache.keys().next().value;
        this.cache.delete(expulsar);
      }
      this.alCargar(id, sector);
    }
    this._despachar();
  }
  obtener(id) { if (!this.cache.has(id)) return undefined; const v = this.cache.get(id); this.cache.delete(id); this.cache.set(id, v); return v; }
  cerrar() { this.cerrado = true; this.cola = []; this.pendientes.clear(); this.trabajador.removeEventListener('message', this.recibir); this.trabajador.terminate(); }
}
