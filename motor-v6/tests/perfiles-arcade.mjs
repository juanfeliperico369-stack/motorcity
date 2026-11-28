import assert from 'node:assert/strict';
import { perfilArcade, adaptarVelocidad, MULTIPLICADORES, pasoArcade } from '../src/fisica/arcade.js';
// Fuente: RunRunZero/src/data.js, blob c17abf254d3670fc78b4b36e71c7be4af57df7de, const VEH.
const original = {"foot":0.62,"quad":0.8,"inline":0.86,"skate":0.84,"long":0.88,"scooter":0.85,"uni":0.83,"bike":0.96,"trike":0.88,"ebike":1,"escooter":0.98,"euc":1,"moped":1.06,"moto":1.14,"auto":1.18,"camion":1.05,"jetpack":1.1};
assert.equal(Object.keys(original).length,17);
assert.deepEqual(MULTIPLICADORES,Object.fromEntries(Object.entries(original).filter(([id])=>id!=='foot')));
assert.deepEqual(perfilArcade('foot'),{velocidadMax:3.5,pie:true});
assert.deepEqual(perfilArcade('foot',{correr:true}),{velocidadMax:7,pie:true});
assert.deepEqual(perfilArcade('bike'),{velocidadMax:11,pie:false});
assert.throws(()=>perfilArcade('otro'),RangeError);
const estado={x:2,z:3,rumbo:1,velocidad:11};
const pie=adaptarVelocidad(estado,perfilArcade('foot'));
assert.deepEqual(pie,{x:2,z:3,rumbo:1,velocidad:3.5});
assert.equal(estado.velocidad,11);
assert.doesNotThrow(()=>pasoArcade(pie,{avance:1},1/60,perfilArcade('foot')));
assert.throws(()=>adaptarVelocidad({velocidad:-1},perfilArcade('foot')),RangeError);
console.log('OK: catálogo, perfiles a pie, bici y transición de modalidad');
