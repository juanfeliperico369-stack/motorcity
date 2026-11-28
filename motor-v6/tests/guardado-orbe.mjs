import assert from 'node:assert/strict';
import {CLAVE,validarGuardado,leerGuardado,escribirGuardado} from '../src/guardado-orbe.js';
const ids=['bike','foot'],mem=new Map(),storage={getItem:k=>mem.get(k),setItem:(k,v)=>mem.set(k,v)};
const raw={version:1,mundo:'orbe-g0',x:1350,z:1110,rumbo:0,vehiculo:'bike',distancia:8,cruces:1};
assert.equal(leerGuardado(storage,ids),null);assert.equal(escribirGuardado(storage,raw,ids),true);assert.deepEqual(leerGuardado(storage,ids),raw);
for(const inval of [{version:2},{x:-1},{z:2000},{vehiculo:'desconocido'},{distancia:-1},{cruces:.5},{rumbo:Infinity}])assert.equal(validarGuardado({...raw,...inval},ids),null);
mem.set(CLAVE,'{');assert.equal(leerGuardado(storage,ids),null);assert.equal(escribirGuardado({setItem(){throw Error('sin espacio');}},raw,ids),false);
console.log('OK: guardado versionado, persistencia local y datos inválidos rechazados');
