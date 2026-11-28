/* Guardado local explícito, versionado; no guarda datos personales. */
export const CLAVE='run-city.orbe.v1';
export function validarGuardado(raw,ids){
 if(!raw||raw.version!==1||raw.mundo!=='orbe-g0'||!Number.isFinite(raw.x)||!Number.isFinite(raw.z)||raw.x<0||raw.x>=3000||raw.z<0||raw.z>=2000||!Number.isFinite(raw.rumbo)||!ids.includes(raw.vehiculo)||!Number.isFinite(raw.distancia)||raw.distancia<0||!Number.isSafeInteger(raw.cruces)||raw.cruces<0)return null;
 return {version:1,mundo:'orbe-g0',x:raw.x,z:raw.z,rumbo:Math.atan2(Math.sin(raw.rumbo),Math.cos(raw.rumbo)),vehiculo:raw.vehiculo,distancia:raw.distancia,cruces:raw.cruces};
}
export function leerGuardado(storage,ids){try{return validarGuardado(JSON.parse(storage.getItem(CLAVE)),ids);}catch{return null;}}
export function escribirGuardado(storage,raw,ids){try{const v=validarGuardado(raw,ids);if(!v)return false;storage.setItem(CLAVE,JSON.stringify(v));return true;}catch{return false;}}
