// Banco interactivo sintético: no es Orbe ni el videojuego de producción.
import * as THREE from '../../js/vendor/three-0.170.0.module.min.js';
import { MundoSectores } from '../src/mundo-sectores.js';
import { pasoArcade, perfilArcade } from '../src/fisica/arcade.js';
import { Bucle } from '../src/nucleo/bucle.js';
const escena=new THREE.Scene();escena.background=new THREE.Color(0x9ab6ca);
const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:false});
renderer.setSize(412,860,false);renderer.setPixelRatio(1);
const cam=new THREE.PerspectiveCamera(48,412/860,.1,600);
escena.add(new THREE.HemisphereLight(0xffffff,0x777777,2));
const sol=new THREE.DirectionalLight(0xffffff,2);sol.position.set(100,150,50);escena.add(sol);
const indice=await fetch('/datos/indice.json').then(r=>{if(!r.ok)throw Error('Índice');return r.json();});
const mundo=new MundoSectores({indice,opcionesCarga:{baseURL:new URL('/datos/indice.json',location.href),tope:2,concurrencia:2}});
escena.add(mundo.raiz);
const avatar=new THREE.Mesh(new THREE.BoxGeometry(.8,1.7,.8),new THREE.MeshStandardMaterial({color:0x176fc0}));
escena.add(avatar);
let estado={x:244,z:125,velocidad:0,rumbo:Math.PI/2},entrada=false,cuadros=0;
let antes={listo:false};
let ultima={};
const input=new Set();
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown'].includes(e.code)){e.preventDefault();input.add(e.code);}});
addEventListener('keyup',e=>input.delete(e.code));
addEventListener('blur',()=>input.clear());
function paso(dt){
    const y=mundo.altura(estado.x,estado.z);
    const propuesta=pasoArcade(estado,{avance:input.has('ArrowUp')?1:0,freno:input.has('ArrowDown')},dt,perfilArcade('bike'));
    // Limita la prueba al terreno existente; el jugador no teletransporta.
    if(antes.listo && y!==undefined && mundo.altura(propuesta.x,propuesta.z)!==undefined){estado=propuesta;entrada=true;}
    else estado={...estado,velocidad:0};
}
function dibujar(){
  mundo.actualizar({...estado,radio:260,radioVisible:5});
  antes=mundo.procesar({maxLotes:1});
  const altura=mundo.altura(estado.x,estado.z);
  if(altura!==undefined)avatar.position.set(estado.x,altura+.85,estado.z);
  avatar.rotation.y=estado.rumbo;
  cam.position.set(estado.x-23,30,estado.z+18);cam.lookAt(estado.x+7,0,estado.z);
  renderer.render(escena,cam);cuadros++;
  ultima={...estado,entrada,cuadros,escena:mundo.estado(),render:{drawCalls:renderer.info.render.calls,triangulos:renderer.info.render.triangles,geometrias:renderer.info.memory.geometries}};
}
const bucle=new Bucle({actualizar:paso,dibujar});
window.banco={estado:()=>ultima,cerrar:()=>{
  bucle.detener();input.clear();mundo.cerrar();avatar.geometry.dispose();avatar.material.dispose();avatar.removeFromParent();
  renderer.render(escena,cam);
  const resultado={lotes:mundo.estado().lotes,geometrias:renderer.info.memory.geometries};
  renderer.dispose();return resultado;
}};
bucle.iniciar();
