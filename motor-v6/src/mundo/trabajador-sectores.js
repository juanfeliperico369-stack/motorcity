/* Descarga acotada y parseo fuera del hilo de dibujo. Una petición lleva un
 * identificador único: cancelar una no afecta otras descargas del trabajador. */
const activos = new Map();
const LIMITE = 200000;
const punto = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
const nombre = v => typeof v === 'string' && v.length > 0;
function validar(s, id) {
  if (!s || typeof s !== 'object' || Array.isArray(s) || s.id !== id || s.version !== 1 || s.unidad !== 'm' ||
      !punto(s.origen) || !Number.isFinite(s.tamano_m) || s.tamano_m < 250 || s.tamano_m > 500 ||
      !Array.isArray(s.nodos) || !Array.isArray(s.tramos) || !Array.isArray(s.objetos)) throw new Error('Cabecera de sector inválida');
  if (!s.nodos.every(n => n && nombre(n.id) && punto(n.posicion) && Number.isFinite(n.altura_m) && ['ninguno', 'semaforo', 'cebra', 'prioridad'].includes(n.cruce)) ||
      !s.tramos.every(t => t && nombre(t.id) && ['vial', 'ciclovia'].includes(t.red) && nombre(t.desde) && nombre(t.hasta) && Number.isFinite(t.ancho_m) && t.ancho_m > 0 && Number.isFinite(t.pendiente) && Number.isInteger(t.nivel) && Array.isArray(t.puntos) && t.puntos.length >= 2 && t.puntos.every(punto)) ||
      !s.objetos.every(o => o && nombre(o.id) && Array.isArray(o.huella) && o.huella.length >= 3 && o.huella.every(punto))) throw new Error('Contenido de sector inválido');
}
async function leer(respuesta, controller) {
  const longitud = respuesta.headers.get('content-length');
  if (longitud !== null && Number(longitud) > LIMITE) { controller.abort(); throw new Error('Sector supera 200 KB'); }
  if (!respuesta.body || !respuesta.body.getReader) {
    const bytes = await respuesta.arrayBuffer();
    if (bytes.byteLength > LIMITE) throw new Error('Sector supera 200 KB');
    return new Uint8Array(bytes);
  }
  const lector = respuesta.body.getReader(), partes = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await lector.read();
      if (done) break;
      total += value.byteLength;
      if (total > LIMITE) { controller.abort(); throw new Error('Sector supera 200 KB'); }
      partes.push(value);
    }
  } finally { lector.releaseLock(); }
  const bytes = new Uint8Array(total);
  let pos = 0; for (const parte of partes) { bytes.set(parte, pos); pos += parte.byteLength; }
  return bytes;
}
self.addEventListener('message', async ({ data }) => {
  if (data.tipo === 'cancelar') { activos.get(data.token)?.abort(); return; }
  const { id, url, token } = data;
  const controller = new AbortController(); activos.set(token, controller);
  try {
    const respuesta = await fetch(url, { signal: controller.signal });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    const bytes = await leer(respuesta, controller);
    const sector = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    validar(sector, id);
    self.postMessage({ id, token, sector, bytes: bytes.byteLength });
  } catch (error) {
    if (!controller.signal.aborted) self.postMessage({ id, token, error: String(error.message || error) });
    else if (String(error.message).includes('200 KB')) self.postMessage({ id, token, error: String(error.message) });
  } finally { activos.delete(token); }
});
