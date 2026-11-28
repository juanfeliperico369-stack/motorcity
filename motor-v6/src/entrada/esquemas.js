/* Motor City 6 · entrada/esquemas.js — de la palanca (o el teclado o el mando) a lo que entiende la física.
   - directo (por defecto): la palanca marca hacia dónde ir SEGÚN LA PANTALLA; con la base de la cámara (camara.base())
     se pasa al mundo. Así empujar hacia arriba siempre va hacia donde mira la cámara, como en EnCicla.
   - manubrio: la palanca de lado gira (como un timón) y hacia arriba acelera; hacia abajo frena.
   Las dos salen en el formato de fisica/arcade.js moverArcade(). */

export const ESQUEMAS = Object.freeze(['directo', 'manubrio']);

/** v: { x, y, m } (x derecha, y arriba); base: { adelante: {x, z}, derecha: {x, z} } */
export function mandoDesdeVector(v, base, esquema = 'directo', { freno = false, umbralFreno = 0.35 } = {}) {
  if (!v || !(v.m > 0)) return { freno };
  if (esquema === 'manubrio') return { giro: v.x, avance: Math.max(0, v.y), freno: freno || v.y < -umbralFreno };
  const wx = base.adelante.x * v.y + base.derecha.x * v.x, wz = base.adelante.z * v.y + base.derecha.z * v.x;
  return { direccion: Math.atan2(wx, wz), magnitud: Math.min(1, v.m), freno };
}

/** El vector de la palanca para un rumbo del mundo (lo inverso de lo de arriba): sirve a las pruebas y a los bots. */
export function vectorHacia(rumbo, base, m = 1) {
  const dx = Math.sin(rumbo), dz = Math.cos(rumbo);
  const y = dx * base.adelante.x + dz * base.adelante.z, x = dx * base.derecha.x + dz * base.derecha.z, l = Math.hypot(x, y) || 1;
  return { x: x / l * m, y: y / l * m, m };
}
