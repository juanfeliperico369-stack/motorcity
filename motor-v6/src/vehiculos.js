/* Catálogo de Run Scooter: IDs, nombres, multiplicadores y manejo de
 * RunRunZero/src/data.js VEH. Las dimensiones son parámetros de diseño
 * de modelos simplificados en metros, no medidas de marcas reales. */
import { perfilArcade } from './fisica/arcade.js';
export const VEHICULOS=Object.freeze([
 ['bike','Bicicleta','ciclo',.94,.7,1.7],
 ['foot','A pie','pie',1.3,.6,.6],
 ['correr','Correr','pie',1.3,.6,.6],
 ['quad','Patines quad','quad',1.32,.6,.5],
 ['inline','Patines en línea','inline',1.18,.6,.5],
 ['skate','Skate','tabla',1.06,.65,.9],
 ['long','Longboard','long',.96,.65,1.2],
 ['scooter','Monopatín','scooter',1,.55,1.05],
 ['uni','Monociclo','uni',1.2,.6,.65],
 ['trike','Triciclo de carga','trike',.9,1.1,2.05],
 ['ebike','Bicicleta eléctrica','ebike',.96,.7,1.8],
 ['escooter','Monopatín eléctrico','escooter',1,.65,1.2],
 ['euc','Monociclo eléctrico','euc',1.12,.65,.7],
 ['moped','Scooter eléctrico','moped',.98,.75,1.8],
 ['moto','Moto de reparto','moto',1,.85,2.1],
 ['auto','Auto de prensa','auto',.92,1.8,4.2],
 ['camion','Camión EMSAY','camion',.82,2.2,5.8],
 ['jetpack','Jetpack','jetpack',1.15,.85,.7]
].map(([id,nombre,tipo,manejo,ancho,largo])=>Object.freeze({id,nombre,tipo,manejo,ancho,largo})));
export function perfilVehiculo(v){
 const p=perfilArcade(v.id==='correr'?'foot':v.id,{correr:v.id==='correr'});
 return {...p,manejo:v.manejo};
}
export const radioVehiculo=v=>Math.max(.36,Math.hypot(v.ancho,v.largo)/2);
export const admiteCarrera=v=>!['moto','auto','camion','jetpack'].includes(v.id);
