/* Carga por cercanía. Catálogo {id,url,x,z}, centro en metros. Para formato v1
 * de Run City: x=origen[0]+tamano_m/2, z=origen[1]+tamano_m/2.
 * El juego decide visibilidad y crea/descarta mallas. La caché limita cantidad;
 * cada respuesta JSON tiene como máximo 200.000 bytes antes del parseo. */
export class CargadorSectores {
  constructor({ catalogo, tope = 32, concurrencia = 2, timeoutMs = 8000, reintentos = 1, baseUrl, baseURL = baseUrl ?? globalThis.document?.baseURI, preferirBinario = false, trabajador, alCargar = () => {}, alError = () => {}, alExpulsar = () => {} }) {
    if (!Number.isInteger(tope) || tope < 1 || !Number.isInteger(concurrencia) || concurrencia < 1 || !Number.isFinite(timeoutMs) || timeoutMs <= 0 || !Number.isInteger(reintentos) || reintentos < 0) throw new RangeError('Límites inválidos');
    this.catalogo = new Map();
    for (const s of catalogo) {
      if (this.catalogo.has(s.id) || typeof s.id !== 'string' || !s.id || typeof s.url !== 'string' || !s.url || !Number.isFinite(s.x) || !Number.isFinite(s.z)) throw new TypeError('Catálogo inválido');
      if (s.dependencias !== undefined && (!Array.isArray(s.dependencias) || !s.dependencias.every(id => typeof id === 'string' && id))) throw new TypeError('Dependencias inválidas');
      let url, urlBinaria;
      try { url = new URL(s.url, baseURL).href; if (s.url_binaria) urlBinaria = new URL(s.url_binaria, baseURL).href; } catch { throw new TypeError(`URL inválida para ${s.id}`); }
      this.catalogo.set(s.id, { ...s, url, urlBinaria, dependencias: [...new Set(s.dependencias || [])] });
    }
    for (const s of this.catalogo.values()) for (const id of s.dependencias) if (!this.catalogo.has(id)) throw new RangeError(`Dependencia desconocida: ${id}`);
    Object.assign(this, { tope, concurrencia, timeoutMs, reintentos, preferirBinario, alCargar, alError, alExpulsar });
    this.cache = new Map(); this.pesos = new Map(); this.requeridos = new Set(); this.erroresCallbacks = []; this.pendientes = new Map(); this.cola = []; this.deseados = new Set(); this.intentos = new Map(); this.fallidos = new Set(); this.secuencia = 0; this.cerrado = false; this.fatal = null;
    this.trabajador = trabajador || new Worker(new URL('./mundo/trabajador-sectores.js', import.meta.url), { type: 'module' });
    this.recibir = e => this._recibir(e.data);
    this.errorTrabajador = e => this._fatal(e.message || 'Falló el trabajador de sectores');
    this.trabajador.addEventListener('message', this.recibir);
    this.trabajador.addEventListener('error', this.errorTrabajador);
    this.trabajador.addEventListener('messageerror', this.errorTrabajador);
  }
  actualizar({ x, z, rumbo = 0, visibles = [], radio = 500 }) {
    if (this.cerrado || this.fatal) throw new Error(this.fatal || 'Cargador cerrado');
    if (![x, z, rumbo, radio].every(Number.isFinite) || radio < 0) throw new RangeError('Posición o radio inválido');
    const vista = new Set(visibles);
    for (const id of vista) if (!this.catalogo.has(id)) throw new RangeError(`Sector desconocido: ${id}`);
    // El índice contiene todos los propietarios y nodos necesarios por celda.
    // Sus dependencias son directas: recorrerlas de nuevo extendería la carga
    // por toda la red vial aunque solo una celda esté visible.
    const directas = (id, elegidos) => {
      const nuevos = new Set();
      for (const actual of [id, ...this.catalogo.get(id).dependencias]) if (!elegidos.has(actual)) nuevos.add(actual);
      return nuevos;
    };
    const elegidos = new Set();
    for (const id of vista) for (const dependencia of directas(id, elegidos)) elegidos.add(dependencia);
    if (elegidos.size > this.tope) throw new RangeError('La caché no alcanza para los sectores visibles y sus dependencias');
    const obligatorios = new Set(elegidos);
    const candidatos = [...this.catalogo.values()].map(s => {
      const dx = s.x - x, dz = s.z - z, distancia = Math.hypot(dx, dz);
      return { s, distancia, prioridad: distancia - (dx * Math.sin(rumbo) + dz * Math.cos(rumbo)) * .35 };
    }).filter(c => elegidos.has(c.s.id) || c.distancia <= radio)
      .sort((a, b) => Number(vista.has(b.s.id)) - Number(vista.has(a.s.id)) || Number(elegidos.has(b.s.id)) - Number(elegidos.has(a.s.id)) || a.prioridad - b.prioridad || a.s.id.localeCompare(b.s.id));
    // Cada candidato adicional se incorpora con todas sus dependencias, o se omite.
    for (const { s } of candidatos) {
      if (elegidos.has(s.id)) continue;
      const nuevos = directas(s.id, elegidos);
      if (elegidos.size + nuevos.size <= this.tope) for (const id of nuevos) elegidos.add(id);
    }
    // Las dependencias directas visibles preceden a la precarga, incluso fuera del radio.
    const ordenados = [...vista, ...[...obligatorios].filter(id => !vista.has(id))];
    for (const { s } of candidatos) if (elegidos.has(s.id) && !obligatorios.has(s.id)) ordenados.push(s.id);
    for (const id of elegidos) if (!ordenados.includes(id)) ordenados.push(id);
    const seleccionados = ordenados.map(id => this.catalogo.get(id));
    this.requeridos = obligatorios; this.deseados = elegidos;
    for (const id of this.intentos.keys()) if (!this.deseados.has(id)) { this.intentos.delete(id); this.fallidos.delete(id); }
    for (const [id, p] of this.pendientes) if (!this.deseados.has(id)) this._cancelar(id, p);
    for (const s of seleccionados) if (this.cache.has(s.id)) { const v = this.cache.get(s.id); this.cache.delete(s.id); this.cache.set(s.id, v); }
    this.cola = seleccionados.filter(s => !this.cache.has(s.id) && !this.pendientes.has(s.id) && !this.fallidos.has(s.id));
    this._despachar();
  }
  _cancelar(id, p) {
    clearTimeout(p.timer); this.pendientes.delete(id);
    this.trabajador.postMessage({ tipo: 'cancelar', token: p.token });
  }
  _despachar() {
    while (!this.cerrado && !this.fatal && this.pendientes.size < this.concurrencia && this.cola.length) {
      const s = this.cola.shift(), token = ++this.secuencia;
      this.intentos.set(s.id, (this.intentos.get(s.id) || 0) + 1);
      const timer = setTimeout(() => this._terminar(s.id, token, null, 'Tiempo de espera agotado'), this.timeoutMs);
      this.pendientes.set(s.id, { token, timer });
      try { this.trabajador.postMessage({ tipo: 'cargar', id: s.id, url: s.url, urlBinaria: this.preferirBinario ? s.urlBinaria : undefined, token }); }
      catch (e) { this._fatal(`No se pudo enviar al trabajador: ${e.message}`); }
    }
  }
  _recibir(data) {
    if (!data || typeof data !== 'object') return;
    const { id, token, sector, error, bytes, formato } = data;
    if (!error && (!sector || sector.id !== id || !Number.isInteger(bytes) || bytes < 0 || bytes > 200000)) return this._terminar(id, token, null, 'Respuesta inválida del trabajador');
    this._terminar(id, token, sector, error, bytes, formato);
  }
  _terminar(id, token, sector, error, bytes, formato) {
    const p = this.pendientes.get(id);
    if (!p || p.token !== token || this.cerrado || this.fatal) return;
    if (error) this._cancelar(id, p); else { clearTimeout(p.timer); this.pendientes.delete(id); }
    if (!this.deseados.has(id)) return this._despachar();
    if (error) {
      if (this.intentos.get(id) <= this.reintentos) this.cola.unshift(this.catalogo.get(id));
      else { this.fallidos.add(id); try { this._avisar('alError', id, error); } finally { this._despachar(); } return; }
    } else {
      this.intentos.delete(id);
      if (!this.cache.has(id) && this.cache.size >= this.tope) {
        const expulsar = [...this.cache.keys()].find(clave => !this.deseados.has(clave));
        if (expulsar === undefined) { this._fatal('Invariante de caché violada'); return; }
        this._expulsar(expulsar);
      }
      this.cache.delete(id); this.cache.set(id, sector);
      this.pesos.set(id, { bytes, formato: formato || 'json' });
      try { this._avisar('alCargar', id, sector); } finally { this._despachar(); } return;
    }
    this._despachar();
  }
  _fatal(error) {
    if (this.fatal || this.cerrado) return;
    this.fatal = `Trabajador de sectores: ${error}`;
    const ids = new Set([...this.pendientes.keys(), ...this.cola.map(s => s.id)]);
    for (const p of this.pendientes.values()) clearTimeout(p.timer);
    this.pendientes.clear(); this.cola = [];
    this.trabajador.terminate();
    for (const id of ids) this._avisar('alError', id, this.fatal);
  }
  _avisar(nombre, ...args) {
    try { this[nombre](...args); } catch (e) {
      this.erroresCallbacks.push({ callback: nombre, id: args[0], error: String(e.message || e) });
      if (this.erroresCallbacks.length > 16) this.erroresCallbacks.shift();
    }
  }
  _expulsar(id) {
    const sector = this.cache.get(id);
    this.cache.delete(id); this.pesos.delete(id);
    this._avisar('alExpulsar', id, sector);
  }
  estado() {
    return {
      requeridos: this.requeridos.size,
      faltantes: [...this.requeridos].filter(id => !this.cache.has(id)),
      pendientes: this.pendientes.size, cola: this.cola.length, cache: this.cache.size,
      bytesDescargadosCache: [...this.pesos.values()].reduce((n, p) => n + p.bytes, 0),
      formatos: Object.fromEntries([...this.pesos].map(([id,p]) => [id,p.formato])),
      fallos: [...this.fallidos], fatal: this.fatal, erroresCallbacks: this.erroresCallbacks.map(e => ({...e}))
    };
  }
  obtener(id) { if (!this.cache.has(id)) return undefined; const v = this.cache.get(id); this.cache.delete(id); this.cache.set(id, v); return v; }
  cerrar() {
    if (this.cerrado) return;
    this.cerrado = true; this.cola = [];
    for (const p of this.pendientes.values()) clearTimeout(p.timer);
    this.pendientes.clear();
    for (const id of [...this.cache.keys()]) this._expulsar(id);
    this.requeridos.clear(); this.deseados.clear(); this.intentos.clear(); this.fallidos.clear();
    this.trabajador.removeEventListener('message', this.recibir);
    this.trabajador.removeEventListener('error', this.errorTrabajador);
    this.trabajador.removeEventListener('messageerror', this.errorTrabajador);
    this.trabajador.terminate();
  }
}
