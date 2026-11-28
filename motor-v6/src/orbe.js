/* Punto de entrada del motor sectorizado con datos de Orbe. El contenido
 * de la isla se exporta en Run-City; no hay copia inventada del mapa aquí. */
import * as THREE from '../../js/vendor/three-0.170.0.module.min.js';
import { MundoSectores } from './mundo-sectores.js';
import { Bucle, mezclar } from './nucleo/bucle.js';
import { pasoArcade, perfilArcade, adaptarVelocidad } from './fisica/arcade.js';
import { CamaraCenitalInteligente } from './camara.js';
import { chocaHuella } from './fisica/huellas.js';
const $=id=>document.getElementById(id);
const modos=[['bike','Bicicleta'],['foot','A pie'],['correr','Correr']];
async function iniciar(){
  const url=new URL('../datos/orbe/indice.json',import.meta.url);
  const resp=await fetch(url);if(!resp.ok)throw Error('No se pudo cargar el mapa de Orbe');
  const indice=await resp.json();
  const renderer=new THREE.WebGLRenderer({canvas:$('cv'),antialias:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));renderer.shadowMap.enabled=false;
  const escena=new THREE.Scene();escena.background=new THREE.Color(0xaecbd7);escena.fog=new THREE.Fog(0xaecbd7,200,800);
  escena.add(new THREE.HemisphereLight(0xfff6df,0x717d83,2.1));
  const sol=new THREE.DirectionalLight(0xffecd1,2.1);sol.position.set(110,145,75);escena.add(sol);
  const mundo=new MundoSectores({indice,opcionesCarga:{baseURL:url,preferirBinario:true,tope:16,concurrencia:2}});
  mundo.materiales.ciclovia.color.set(0xe76f51);mundo.materiales.vial.color.set(0x4f555c);
  escena.add(mundo.raiz);
  // Posición de salida del diseño G-0: Kilómetro Cero, frente a la sede.
  let estado={x:1350,z:1110,velocidad:0,rumbo:Math.PI/2},anterior={...estado},y=15,yAnterior=15,modo=0,pausa=false,choques=0;
  let listo=false,cuadros=0,estadoMundo={listo:false};
  const avatar=new THREE.Group(),material=new THREE.MeshStandardMaterial({color:0x176f87}),ropa=new THREE.Mesh(new THREE.CapsuleGeometry(.29,.76,3,8),material);
  ropa.position.y=1.05;avatar.add(ropa);
  const cabeza=new THREE.Mesh(new THREE.SphereGeometry(.21,8,6),new THREE.MeshStandardMaterial({color:0xc88e66}));cabeza.position.y=1.51;avatar.add(cabeza);
  const bici=new THREE.Group(),llanta=new THREE.MeshStandardMaterial({color:0x29323b});
  for(const z of [-.64,.64]){const rueda=new THREE.Mesh(new THREE.TorusGeometry(.31,.043,5,14),llanta);rueda.rotation.y=Math.PI/2;rueda.position.set(0,.34,z);bici.add(rueda);}
  const cuerpo=new THREE.Mesh(new THREE.BoxGeometry(.17,.18,1.15),material);cuerpo.position.y=.48;bici.add(cuerpo);avatar.add(bici);escena.add(avatar);
  const threeCam=new THREE.PerspectiveCamera(50,1,.3,1000);
  const terrenoCam={getHeight:(x,z)=>mundo.altura(x,z)??y};
  const cam=new CamaraCenitalInteligente(threeCam,{terreno:terrenoCam,colisiones:[]});
  cam.yaw=estado.rumbo+Math.PI;cam.blanco.set(estado.x,y+1.3,estado.z);cam.ojo.set(estado.x-18,y+25,estado.z+10);cam.zoom=cam.zoomObj=.64;
  const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);threeCam.aspect=innerWidth/innerHeight;threeCam.updateProjectionMatrix();};addEventListener('resize',resize);resize();
  const teclas=new Set(),toques=new Map();
  const activo=k=>teclas.has(k)||[...toques.values()].includes(k);
  function limpiar(){teclas.clear();toques.clear();}
  function perfil(){return modo===2?perfilArcade('foot',{correr:true}):perfilArcade(modos[modo][0]);}
  const celda=(x,z)=>indice.sectores.find(s=>x>=s.x-indice.tamano_m/2&&x<s.x+indice.tamano_m/2&&z>=s.z-indice.tamano_m/2&&z<s.z+indice.tamano_m/2);
  function piso(x,z){const c=celda(x,z),s=c&&mundo.cargador.cache.get(c.id);return s&&s.zona!=='mar'?mundo.altura(x,z):undefined;}
  function obstaculo(a,b,altura){
    for(const s of mundo.cargador.cache.values())for(const o of s.objetos){
      if(!Number.isFinite(o.base_m)||!Number.isFinite(o.altura_m))continue;
      if(altura+1.72<=o.base_m||altura>=o.base_m+o.altura_m)continue;
      if(chocaHuella([a.x,a.z],[b.x,b.z],o.huella,.36))return true;
    }return false;
  }
  function paso(dt){
    anterior={...estado};yAnterior=y;
    if(!listo){estado={...estado,velocidad:0};return;}
    const giro=Number(activo('derecha'))-Number(activo('izquierda'));
    const nuevo=pasoArcade(estado,{avance:activo('avanzar')?1:0,giro,freno:activo('freno')},dt,perfil());
    const altura=piso(nuevo.x,nuevo.z);
    if(altura===undefined||Math.abs(altura-y)>Math.max(.5,Math.hypot(nuevo.x-estado.x,nuevo.z-estado.z)*.65)||obstaculo(estado,nuevo,y)){
      if(nuevo.x!==estado.x||nuevo.z!==estado.z)choques++;
      estado={...estado,velocidad:0,rumbo:nuevo.rumbo};
    }else{estado=nuevo;y=altura;}
    cam.actualizar(dt,{pos:new THREE.Vector3(estado.x,y,estado.z),vel:new THREE.Vector3(Math.sin(estado.rumbo)*estado.velocidad,0,Math.cos(estado.rumbo)*estado.velocidad),rumbo:estado.rumbo+Math.PI,rapidez:estado.velocidad});
  }
  function dibujar(alfa){
    mundo.actualizar({...estado,radio:650,radioVisible:65});estadoMundo=mundo.procesar({maxLotes:2});
    const h=piso(estado.x,estado.z);listo=estadoMundo.listo&&h!==undefined;
    if(listo&&bucle.pasos===0){y=yAnterior=h;}
    avatar.position.set(mezclar(anterior.x,estado.x,pausa?1:alfa),mezclar(yAnterior,y,pausa?1:alfa),mezclar(anterior.z,estado.z,pausa?1:alfa));avatar.rotation.y=estado.rumbo;
    bici.visible=modo===0;
    const c=celda(estado.x,estado.z),s=c&&mundo.cargador.cache.get(c.id);
    $('barrio').textContent=s?.barrio||'Orbe';$('vel').textContent=Math.round(estado.velocidad*3.6)+' km/h · '+modos[modo][1];
    $('aviso').hidden=listo||pausa;$('aviso').textContent=estadoMundo.errores?.length?'Error de geometría; revisa los datos':'Cargando terreno y vías…';
    renderer.render(escena,threeCam);cuadros++;
  }
  const bucle=new Bucle({actualizar:paso,dibujar});
  function pausar(valor=!pausa){pausa=valor;limpiar();anterior={...estado};yAnterior=y;if(pausa)bucle.pausar();else bucle.reanudar();$('pausa').textContent=pausa?'Continuar':'Pausa';$('pausa').setAttribute('aria-pressed',String(pausa));}
  function cambiar(){if(pausa)return;modo=(modo+1)%modos.length;estado=adaptarVelocidad(estado,perfil());$('modo').textContent=modos[modo][1];}
  const mapa={ArrowUp:'avanzar',KeyW:'avanzar',ArrowLeft:'izquierda',KeyA:'izquierda',ArrowRight:'derecha',KeyD:'derecha',ArrowDown:'freno',KeyS:'freno',Space:'freno'};
  addEventListener('keydown',e=>{if(mapa[e.code]){e.preventDefault();if(!pausa)teclas.add(mapa[e.code]);}else if(!e.repeat&&(e.code==='KeyP'||e.code==='Escape'))pausar();else if(!e.repeat&&e.code==='KeyV')cambiar();});
  addEventListener('keyup',e=>{if(mapa[e.code])teclas.delete(mapa[e.code]);});
  for(const id of ['avanzar','izquierda','derecha','freno']){const btn=$(id);btn.addEventListener('pointerdown',e=>{e.preventDefault();if(!pausa){btn.setPointerCapture(e.pointerId);toques.set(e.pointerId,id);}});for(const evento of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(evento,e=>toques.delete(e.pointerId));}
  $('modo').onclick=cambiar;$('pausa').onclick=()=>pausar();addEventListener('blur',()=>pausar(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)pausar(true);});
  window.RUN_CITY_MOTOR={estado:()=>({x:estado.x,z:estado.z,y,velocidad:estado.velocidad,modo:modos[modo][1],pausa,listo,choques,cuadros,pasos:bucle.pasos,carga:estadoMundo,drawCalls:renderer.info.render.calls})};
  cam.actualizar(1/60,{pos:new THREE.Vector3(estado.x,y,estado.z),vel:new THREE.Vector3(),rumbo:estado.rumbo+Math.PI,rapidez:0});
  bucle.iniciar();
}
iniciar().catch(e=>{$('aviso').hidden=false;$('aviso').textContent='No se pudo abrir Orbe: '+e.message;console.error(e);});
