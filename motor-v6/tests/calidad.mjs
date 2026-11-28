/* El regulador de calidad (nucleo/calidad.js): baja el detalle, nunca la fluidez. Uso: node motor-v6/tests/calidad.mjs */
import assert from 'node:assert/strict';
import { Calidad } from '../src/nucleo/calidad.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const correr = (c, ms, seg) => { for (let t = 0; t < seg * 1000; t += ms) c.cuadro(ms); return c.valor; };
{ const vistos = [], c = new Calidad({ maximo: 1.5, alCambiar: v => vistos.push(v) });
  ok(c.valor === 1.5, 'empieza en el máximo del aparato');
  correr(c, 55, 20); ok(c.valor === 0.6 && vistos.join() === '1.25,1,0.85,0.7,0.6', 'si va lento baja de a un escalón hasta el piso: ' + vistos.join());
  correr(c, 12, 30); ok(c.valor === 1.5, 'si sobra, vuelve a subir hasta el máximo');
  const antes = c.cambios.length; correr(c, 28, 20); ok(c.cambios.length === antes, 'en la franja intermedia no cambia (no oscila)'); }
{ const c = new Calidad({ maximo: 1 }); ok(c.niveles[0] === 1 && c.valor === 1, 'en un aparato de densidad 1 no pasa de 1');
  correr(c, 12, 30); ok(c.valor === 1, 'ni aunque sobre'); }
{ const c = new Calidad({ maximo: 2.75 }); ok(c.valor === 1.5, 'en un celular de densidad 2,75 empieza en 1,5 (el tope del motor)'); }
{ const c = new Calidad(); c.cuadro(5000); c.cuadro(-3); ok(c.muestras.length === 0, 'las pausas largas y los valores raros no cuentan'); }
{ const c = new Calidad(); correr(c, 55, 1.1); const tras1 = c.valor; correr(c, 55, 1.5); ok(tras1 === 1.25 && c.valor === 1.25, 'después de cambiar espera 2 s antes del siguiente escalón'); }
console.log(`✓ el regulador de calidad: ${n} pruebas`);
