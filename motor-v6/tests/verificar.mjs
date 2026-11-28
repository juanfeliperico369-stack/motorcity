#!/usr/bin/env node
/* =====================================================================
   MOTOR 3D v6 · PRUEBAS HONESTAS (ESCALA SI, DATOS HERO Y SINTAXIS)
   Sin teletransportes ni tautologías.
   ===================================================================== */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ESCALA, validarProporcionesSI } from '../src/nucleo/escala.js';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 1. Verificar sintaxis limpia en todos los módulos de src/ y sus carpetas (nucleo, camara, entrada, fisica, mundo, render, sonido)
const listar = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? listar(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []);
const mods = listar(path.join(DIR, 'src')).sort();
assert.ok(mods.length >= 7, 'Faltan módulos base en motor-v6/src');
for (const m of mods) {
  execFileSync(process.execPath, ['--check', m], { stdio: 'pipe' });
}
for (const carpeta of ['nucleo', 'camara', 'entrada', 'fisica', 'mundo', 'render', 'sonido']) assert.ok(fs.existsSync(path.join(DIR, 'src', carpeta)), 'Falta la carpeta del plano: ' + carpeta);
console.log(`✓ Sintaxis válida en ${mods.length} módulos ES`);

// 2. Validar Biblia de Escala SI (1 u = 1 m)
const errEscala = validarProporcionesSI();
assert.deepEqual(errEscala, [], 'Errores de proporción SI: ' + errEscala.join('; '));
assert.equal(ESCALA.persona.alto, 1.72);
assert.ok(ESCALA.parkour.coyoteSeg >= 0.10 && ESCALA.parkour.bufferSaltoSeg >= 0.12);
console.log('✓ Proporciones SI y umbrales de parkour verificados');

// 3. Validar catálogo de 12 Zonas Hero + 5 Skateparks reales
const cat = JSON.parse(fs.readFileSync(path.join(DIR, 'datos/zonas-hero-medellin.json'), 'utf8'));
assert.equal(cat.total_zonas_hero, 12, 'Deben existir 12 Zonas Hero');
assert.ok(cat.total_skateparks >= 5, 'Deben existir al menos 5 Skateparks reales');
let totalEdif = 0;
for (const z of cat.zonas) {
  assert.ok(z.topografia_real.desnivel_m > 5, `Topografía plana en ${z.id}`);
  assert.ok(z.edificaciones_reales.total > 50, `Pocos edificios reales en ${z.id}`);
  assert.ok(z.vias_reales.total_segmentos >= 20, `Pocas vías reales en ${z.id}`);
  totalEdif += z.edificaciones_reales.total;
}
console.log(`✓ Catálogo Hero verificado: 12 zonas, ${cat.total_skateparks} skateparks, ${totalEdif} edificios reales medidos`);

// 4. Validar vertical slice real de Puente 4 Sur (hero-4sur.json) y peso ligero (< 50 KB!)
const slicePath = path.join(DIR, 'datos/hero-4sur.json');
const sliceSize = fs.statSync(slicePath).size;
assert.ok(sliceSize < 50 * 1024, `hero-4sur.json demasiado pesado: ${sliceSize} B`);
const slice = JSON.parse(fs.readFileSync(slicePath, 'utf8'));
assert.equal(slice.dem_n, 33);
assert.ok(slice.edificios.length >= 60);
assert.ok(slice.vias.length >= 20);
console.log(`✓ Zona Hero Puente 4 Sur verificada (${(sliceSize / 1024).toFixed(1)} KB, ${slice.edificios.length} edificios, ${slice.vias.length} vías)`);

// 5. Validar que existan las 9 texturas WebP y las 4 láminas de diseño
const texs = fs.readdirSync(path.join(DIR, 'arte/texturas')).filter((f) => f.endsWith('.webp'));
const dis = fs.readdirSync(path.join(DIR, 'arte/disenos')).filter((f) => f.endsWith('.webp'));
assert.equal(texs.length, 9, 'Deben existir las 9 texturas PBR WebP');
assert.equal(dis.length, 4, 'Deben existir las 4 láminas de diseño WebP');
console.log(`✓ Arte verificado: ${texs.length} texturas WebP + ${dis.length} láminas de diseño`);
console.log('RESULTADO MOTOR-V6: OK');
