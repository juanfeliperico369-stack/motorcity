import assert from 'node:assert/strict';
import {VEHICULOS,perfilVehiculo,admiteCarrera,radioVehiculo} from '../src/vehiculos.js';
import {MULTIPLICADORES,pasoArcade} from '../src/fisica/arcade.js';
import {crearGaraje} from '../src/garaje-3d.js';
assert.equal(VEHICULOS.length,18);assert.deepEqual(VEHICULOS.filter(v=>v.id!=='correr').map(v=>v.id).sort(),Object.keys(MULTIPLICADORES).sort());
const modelos=crearGaraje();assert.equal(modelos.size,18);
for(const v of VEHICULOS){const p=perfilVehiculo(v);assert.ok(radioVehiculo(v)>=.36);assert.ok(modelos.get(v.id).children.length>0);let s={x:0,z:0,rumbo:0,velocidad:0};for(let i=0;i<120;i++)s=pasoArcade(s,{avance:1},1/60,p);assert.ok(Math.abs(s.velocidad-p.velocidadMax)<1e-8,v.id);for(let i=0;i<48;i++)s=pasoArcade(s,{freno:true},1/60,p);assert.ok(s.velocidad<1e-8,v.id);}
assert.equal(admiteCarrera(VEHICULOS.find(v=>v.id==='camion')),false);
console.log('OK: 17 vehículos originales, caminar/correr, 18 modelos Three, aceleración y freno por perfil');
