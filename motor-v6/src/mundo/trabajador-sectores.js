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
// RCS1: cabecera LE de 16 B, gzip y CRC32 del JSON. No se importa código
// ni se descomprime fuera del Worker; la salida se limita a la longitud declarada.
function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
async function leerRCS1(bytes, controller) {
  if (bytes.length <= 16 || bytes.length > LIMITE || bytes[0] !== 82 || bytes[1] !== 67 || bytes[2] !== 83 || bytes[3] !== 49) throw new Error('Cabecera RCS1 inválida');
  const cab = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const n = cab.getUint32(4,true), m = cab.getUint32(8,true), crc = cab.getUint32(12,true);
  if (n < 1 || n > LIMITE || m !== bytes.length - 16 || m < 18) throw new Error('Longitudes RCS1 inválidas');
  if (cab.getUint32(bytes.length-8,true) !== crc || cab.getUint32(bytes.length-4,true) !== n) throw new Error('Trailer gzip RCS1 inválido');
  const lector = new Blob([bytes.subarray(16)]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const raw = new Uint8Array(n); let pos = 0;
  const cancelar = () => { lector.cancel().catch(()=>{}); };
  controller.signal.addEventListener('abort', cancelar, {once:true});
  try {
    while (true) {
      if (controller.signal.aborted) throw new Error('Cancelado');
      const {done,value} = await lector.read();
      if (done) break;
      if (pos + value.byteLength > n) { await lector.cancel(); throw new Error('Expansión RCS1 excede límite declarado'); }
      raw.set(value,pos); pos += value.byteLength;
    }
    if (controller.signal.aborted) throw new Error('Cancelado');
  } finally {
    controller.signal.removeEventListener('abort',cancelar);
    lector.releaseLock();
  }
  if (pos !== n || crc32(raw) !== crc) throw new Error('Longitud o CRC RCS1 inválido');
  return raw;
}
self.addEventListener('message', async ({ data }) => {
  if (data.tipo === 'cancelar') { activos.get(data.token)?.abort(); return; }
  const { id, url, urlBinaria, token } = data;
  const controller = new AbortController(); activos.set(token, controller);
  try {
    const binario = !!urlBinaria && typeof DecompressionStream === 'function' && typeof Blob === 'function' && typeof Blob.prototype.stream === 'function';
    const respuesta = await fetch(binario ? urlBinaria : url, { signal: controller.signal });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    const bytes = await leer(respuesta, controller);
    const raw = binario ? await leerRCS1(bytes, controller) : bytes;
    const sector = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw));
    validar(sector, id);
    self.postMessage({ id, token, sector, bytes: bytes.byteLength, formato: binario ? 'RCS1' : 'json' });
  } catch (error) {
    if (!controller.signal.aborted) self.postMessage({ id, token, error: String(error.message || error) });
    else if (String(error.message).includes('200 KB')) self.postMessage({ id, token, error: String(error.message) });
  } finally { activos.delete(token); }
});
