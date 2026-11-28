/* Trayectoria poligonal 3D en metros. Interpolación lineal por longitud de
 * arco: OpenStax, University Physics vol. 1, §2.3 (vectores y componentes).
 * Es una guía geométrica, no simula tracción, estaciones ni catenaria. */
export function crearRecorrido(puntos) {
  if (!Array.isArray(puntos) || puntos.length < 2) throw new RangeError('Se requieren al menos dos puntos');
  const copia = puntos.map(p => {
    if (!p || ![p.x, p.y, p.z].every(Number.isFinite)) throw new RangeError('Punto inválido');
    return Object.freeze({ x: p.x, y: p.y, z: p.z });
  });
  const tramos = []; let longitud = 0;
  for (let i = 1; i < copia.length; i++) {
    const a = copia[i - 1], b = copia[i];
    const largo = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    if (!Number.isFinite(largo) || largo === 0 || !Number.isFinite(longitud + largo)) throw new RangeError('Tramo inválido');
    tramos.push(Object.freeze({ a, b, inicio: longitud, largo })); longitud += largo;
  }
  return Object.freeze({ longitud, tramos: Object.freeze(tramos) });
}

/** s en metros desde el inicio; velocidad firmada en m/s y dt en segundos.
 * Se detiene en los extremos, sin extrapolar ni invertir automáticamente. */
export function avanzarRecorrido(recorrido, s, velocidad, dt) {
  if (!recorrido || !Array.isArray(recorrido.tramos) || !recorrido.tramos.length || !Number.isFinite(recorrido.longitud) || recorrido.longitud <= 0 ||
      ![s, velocidad, dt].every(Number.isFinite) || s < 0 || s > recorrido.longitud || dt < 0) throw new RangeError('Recorrido o movimiento inválido');
  const nueva = Math.max(0, Math.min(recorrido.longitud, s + velocidad * dt));
  const tramo = recorrido.tramos.find(t => nueva < t.inicio + t.largo) ?? recorrido.tramos.at(-1);
  const u = (nueva - tramo.inicio) / tramo.largo;
  const { a, b } = tramo;
  return { s: nueva, x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u,
    extremo: nueva === 0 || nueva === recorrido.longitud };
}
