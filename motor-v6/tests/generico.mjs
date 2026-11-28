/* Pruebas de lo genérico (mundo/generico.js): las reglas del craqueo del plan de Run City (§ 13.2), una por una.
   Uso: node motor-v6/tests/generico.mjs */
import assert from 'node:assert/strict';
import { generarGenerico, semontan, distSegPoligono, ESTILOS_GENERICOS, azarDe } from '../src/mundo/generico.js';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
/* un sector de prueba: dos avenidas de 10 m que se cruzan, una calle curva de 7 m, una ciclorruta de 4,5 m pegada a la
   avenida, un río (prohibido), un hito y una ladera con una loma */
const avenidaX = { id: 'vx', red: 'vial', ancho_m: 10, puntos: [[0, 250], [500, 250]] };
const avenidaZ = { id: 'vz', red: 'vial', ancho_m: 10, puntos: [[250, 0], [250, 500]] };
const curva = { id: 'vc', red: 'vial', ancho_m: 7, puntos: Array.from({ length: 12 }, (_, i) => [60 + i * 15, 420 - Math.sin(i / 3) * 60]) };
const ciclo = { id: 'c1', red: 'ciclovia', ancho_m: 4.5, puntos: [[0, 262], [500, 262]] };
const tramos = [avenidaX, avenidaZ, curva, ciclo];
const hito = { id: 'sede', huella: [[100, 180], [160, 180], [160, 232], [100, 232]] };
const rio = (x, z) => x > 380 && x < 420;
const altura = (x, z) => z * 0.02 + 8 * Math.exp(-((x - 120) ** 2 + (z - 380) ** 2) / 5000);
const base = { id: 'P1', celda: [0, 0, 500, 500], tramos, objetos: [hito], altura, prohibido: rio, estilo: 'centro', semilla: 'prueba' };
const g = generarGenerico(base);

ok(JSON.stringify(g) === JSON.stringify(generarGenerico(base)), 'la misma semilla da la misma ciudad (nada se guarda)');
ok(JSON.stringify(g) !== JSON.stringify(generarGenerico({ ...base, semilla: 'otra' })), 'otra semilla, otra ciudad');
ok(g.objetos.length >= 60, `el centro llena los frentes de las calles: ${g.objetos.length} edificios`);
ok(g.arboles.length >= 40, `y siembra los andenes: ${g.arboles.length} árboles`);
const segs = tramos.flatMap(t => t.puntos.slice(1).map((b, i) => ({ a: t.puntos[i], b, libre: t.ancho_m / 2 + (t.red === 'ciclovia' ? 1.5 : 3), medio: t.ancho_m / 2, t })));
let malos = { vias: 0, rio: 0, celda: 0, hito: 0, montados: 0, ladera: 0, alto: 0 };
for (const o of g.objetos) {
  for (const s of segs) if (distSegPoligono(s.a, s.b, o.huella) < s.libre - 1e-6) malos.vias++;
  if (o.huella.some(([x, z]) => rio(x, z))) malos.rio++;
  if (o.huella.some(([x, z]) => x <= 0 || x >= 500 || z <= 0 || z >= 500)) malos.celda++;
  if (semontan(o.huella, hito.huella, 3.9)) malos.hito++;
  if (o.base_m > Math.min(...o.huella.map(([x, z]) => altura(x, z))) + 1e-6) malos.ladera++;
  if (!(o.altura_m >= 3 && o.altura_m <= ESTILOS_GENERICOS.centro.altura[1] + 7)) malos.alto++;
}
for (let i = 0; i < g.objetos.length; i++) for (let j = i + 1; j < g.objetos.length; j++) if (semontan(g.objetos[i].huella, g.objetos[j].huella, 0.5)) malos.montados++;
ok(malos.vias === 0, 'ningún edificio sobre una vía ni una ciclorruta, ni sobre su andén');
ok(malos.rio === 0, 'ninguno en el agua');
ok(malos.celda === 0, 'cada uno entero dentro de su sector');
ok(malos.hito === 0, 'ninguno sobre el hito (con 4 m de aire)');
ok(malos.montados === 0, 'ninguno encima de otro');
ok(malos.ladera === 0, 'anclados a la ladera: la base es la cota más baja de su huella');
ok(malos.alto === 0, 'alturas dentro del estilo (pisos de 3 m)');
let arbolMal = 0;
for (const a of g.arboles) {
  for (const s of segs) { const dx = s.b[0] - s.a[0], dz = s.b[1] - s.a[1], l2 = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((a.x - s.a[0]) * dx + (a.z - s.a[1]) * dz) / l2)); if (Math.hypot(a.x - s.a[0] - dx * t, a.z - s.a[1] - dz * t) < s.medio + 0.5) arbolMal++; }
  if (rio(a.x, a.z) || g.objetos.some(o => distSegPoligono([a.x, a.z], [a.x + 1e-3, a.z], o.huella) < 1)) arbolMal++;
}
ok(arbolMal === 0, 'ningún árbol en la calzada, en el agua ni dentro de un edificio');

/* los estilos cambian la ciudad */
const cuenta = estilo => generarGenerico({ ...base, estilo }).objetos.length;
ok(cuenta('ninguno') === 0, 'el estilo «ninguno» deja el sector libre (el aeropuerto, por ejemplo)');
ok(cuenta('parque') < cuenta('barrio') && cuenta('campo') < cuenta('centro'), 'el parque y el campo son más ralos que el barrio y el centro');
const alturaMedia = estilo => { const os = generarGenerico({ ...base, estilo }).objetos; return os.reduce((s, o) => s + o.altura_m, 0) / os.length; };
ok(alturaMedia('centro') > alturaMedia('costa') + 4, 'el centro es más alto que la costa');

/* dos sectores vecinos con la misma avenida en el borde no se montan */
const izq = generarGenerico({ ...base, id: 'A', celda: [0, 0, 250, 500], tramos: [avenidaZ, avenidaX] });
const der = generarGenerico({ ...base, id: 'B', celda: [250, 0, 500, 500], tramos: [avenidaZ, avenidaX] });
let cruzados = 0; for (const a of izq.objetos) for (const b of der.objetos) if (semontan(a.huella, b.huella, 0)) cruzados++;
ok(izq.objetos.length > 0 && der.objetos.length > 0 && cruzados === 0, 'dos sectores vecinos nunca se montan en su borde');

/* una pendiente excesiva no se construye */
const empinado = generarGenerico({ ...base, altura: (x, z) => x * 0.5 });
ok(empinado.objetos.every(o => { const hs = o.huella.map(([x, z]) => x * 0.5); return Math.max(...hs) - Math.min(...hs) <= 6 + 1e-6; }), 'donde la ladera es muy empinada no se construye');
/* sin relieve cargado no se inventa nada */
ok(generarGenerico({ ...base, altura: () => undefined }).objetos.length === 0, 'sin relieve no se construye a ciegas');
/* el azar es repetible */
const a1 = azarDe('x'), a2 = azarDe('x'); ok([1, 2, 3].every(() => a1() === a2()), 'el azar con semilla es repetible');
console.log(`✓ lo genérico: ${n} pruebas (${g.objetos.length} edificios y ${g.arboles.length} árboles en el sector de prueba)`);
