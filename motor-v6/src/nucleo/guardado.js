/* Motor City 6 · nucleo/guardado.js — el guardado versionado, con migraciones (rescata la idea de js/92-guardado.js).
   - Cada juego guarda bajo su clave un sobre { v, datos, fecha }. Al leer, los datos de una versión vieja pasan por las
     migraciones en orden (1→2→3…) hasta la actual, y se validan; lo que no valida se descarta sin romper el juego.
   - Si lo guardó una versión MÁS NUEVA del juego (alguien volvió a una APK vieja), no se pisa: se lee como vacío y se
     conserva, para no perder la partida.
   - Si el texto está dañado, se aparta en «<clave>.danado» para poder revisarlo, y se sigue de cero.
   - Si el navegador no deja guardar (modo privado, cuota llena), sigue en la memoria y lo dice (persistente: false).
   No guarda datos personales: solo lo que el juego le pase. */

export class Almacen {
  constructor({ clave, version = 1, migraciones = {}, validar = d => d, almacenamiento } = {}) {
    if (typeof clave !== 'string' || !clave) throw new TypeError('El almacén necesita una clave');
    if (!Number.isInteger(version) || version < 1) throw new RangeError('La versión es un entero desde 1');
    this.clave = clave; this.version = version; this.migraciones = migraciones; this.validar = validar;
    this.almacen = almacenamiento === undefined ? Almacen.local() : almacenamiento; this.memoria = null; this.persistente = !!this.almacen; this.ultimoError = null;
  }
  static local() { try { const s = globalThis.localStorage; const k = '__mc6_prueba__'; s.setItem(k, '1'); s.removeItem(k); return s; } catch { return null; } }
  /* lo último escrito en esta sesión manda (si el navegador no lo dejó guardar, solo está en memoria) */
  _crudo() { if (this.memoria !== null) return this.memoria; try { return this.almacen ? this.almacen.getItem(this.clave) : null; } catch (e) { this.ultimoError = e; return null; } }
  /** Los datos en la versión actual, o null (nunca lanza). */
  leer() {
    const texto = this._crudo();
    if (texto == null) return null;
    let sobre;
    try { sobre = JSON.parse(texto); } catch (e) { this._apartar(texto); this.ultimoError = e; return null; }
    if (!sobre || typeof sobre !== 'object' || !Number.isInteger(sobre.v) || !('datos' in sobre)) { this._apartar(texto); return null; }
    if (sobre.v > this.version) { this.futuro = sobre.v; return null; }      // de un juego más nuevo: no se toca
    let datos = sobre.datos;
    try {
      for (let v = sobre.v; v < this.version; v++) {
        const migrar = this.migraciones[v];
        if (typeof migrar !== 'function') throw new Error(`Falta la migración ${v}→${v + 1}`);
        datos = migrar(structuredClone(datos));
      }
      return this.validar(datos) ?? null;
    } catch (e) { this.ultimoError = e; return null; }
  }
  /** Guarda los datos (validados) en la versión actual. Devuelve true si quedó guardado (en el navegador o, si no deja, en memoria). */
  escribir(datos) {
    if (this.futuro) return false;                                         // no pisar una partida de una versión más nueva
    let v;
    try { v = this.validar(structuredClone(datos)); } catch (e) { this.ultimoError = e; return false; }
    if (v == null) return false;
    const texto = JSON.stringify({ v: this.version, datos: v, fecha: new Date().toISOString() });
    this.memoria = texto;
    try { if (this.almacen) this.almacen.setItem(this.clave, texto); return true; } catch (e) { this.ultimoError = e; this.persistente = false; return true; }
  }
  borrar() { this.memoria = null; this.futuro = undefined; try { this.almacen?.removeItem(this.clave); } catch { /* sin almacén */ } }
  _apartar(texto) { try { this.almacen?.setItem(this.clave + '.danado', texto); } catch { /* sin espacio: se pierde la copia, no la partida nueva */ } }
}

/** Un almacenamiento en memoria con la misma forma que localStorage (para las pruebas y como respaldo). */
export class MemoriaLocal {
  constructor(lleno = false) { this.m = new Map(); this.lleno = lleno; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { if (this.lleno) { const e = new Error('Cuota llena'); e.name = 'QuotaExceededError'; throw e; } this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}
