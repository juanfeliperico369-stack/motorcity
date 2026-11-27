/* Validación estructural de las propuestas de zonas y de su posición en el MC4. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const plan = JSON.parse(fs.readFileSync('contenido/zonas-detalladas.json', 'utf8'));
const bin = fs.readFileSync('datos/medellin/mundo.mc4');
assert.equal(bin.subarray(0, 4).toString('latin1'), 'MC4\0');
const longitud = bin.readUInt32LE(4);
const mundo = JSON.parse(bin.subarray(8, 8 + longitud).toString('utf8'));
assert.equal(plan.ciudad, mundo.ciudad);
const ids = new Set();
for (const zona of plan.zonas) {
  assert(!ids.has(zona.id), 'zona repetida'); ids.add(zona.id);
  const [oeste, sur, este, norte] = zona.bbox;
  assert(oeste < este && sur < norte, 'límites inválidos');
  assert(oeste >= mundo.lon0 && este <= mundo.lon1 && sur >= mundo.latS && norte <= mundo.latN,
    'la zona debe estar dentro del mundo');
  assert.equal(zona.estado, 'propuesta');
  for (const ancla of zona.anclas) {
    assert(ancla.lon >= oeste && ancla.lon <= este && ancla.lat >= sur && ancla.lat <= norte,
      'ancla fuera de la zona');
    assert(['verificada', 'aproximada', 'desconocida'].includes(ancla.precision));
    assert(fs.existsSync(ancla.fuente), 'falta la fuente local');
  }
}
console.log('✓', ids.size, 'zona propuesta y sus anclas dentro del MC4 de Medellín');
