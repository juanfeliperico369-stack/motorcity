/* Punto de entrada del motor sectorizado con datos de Orbe. El contenido
 * de la isla se exporta en Run-City; no hay copia inventada del mapa aquí. */
import * as THREE from '../../js/vendor/three-0.170.0.module.min.js';
import { MundoSectores } from './mundo-sectores.js';
import { Bucle, mezclar } from './nucleo/bucle.js';
import { pasoArcade, perfilArcade, adaptarVelocidad } from './fisica/arcade.js';
import { CamaraCenitalInteligente } from './camara.js';
import { chocaHuella } from './fisica/huellas.js';
import { crearRedCiclo } from './fisica/red-ciclo.js';
import { candidatoCarrera, iniciarCarrera, posicionCarrera, pasoCarrera } from './fisica/carrera.js';
const $=id=>document.getElementById(id);
import { VEHICULOS, perfilVehiculo, radioVehiculo, admiteCarrera } from './vehiculos.js';
import { crearGaraje } from './garaje-3d.js';
import { leerGuardado, escribirGuardado } from './guardado-orbe.js';
import { SonidoRodar } from './sonido-rodar.js';
const modos=VEHICULOS;
async function iniciar(){
  const url=new URL('../datos/orbe/indice.json',import.meta.url);
  const resp=await fetch(url);if(!resp.ok)throw Error('No se pudo cargar el mapa de Orbe');
  const indice=await resp.json();
  const redResp=await fetch(new URL('red-ciclo.json',url));if(!redResp.ok)throw Error('No se pudo cargar la red de ciclorrutas');
  const red=crearRedCiclo(await redResp.json(),{completo:true});
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
  let listo=false,cuadros=0,estadoMundo={listo:false},carrera=null,rama=null;
  let distanciaUltima=0,crucesUltimos=0;
  let firmaRamas='';
  const ids=modos.map(v=>v.id),sonido=new SonidoRodar();let restaurando=null,guardado=false;
  try{restaurando=leerGuardado(localStorage,ids);}catch{}
  if(restaurando){estado={x:restaurando.x,z:restaurando.z,rumbo:restaurando.rumbo,velocidad:0};anterior={...estado};modo=ids.indexOf(restaurando.vehiculo);distanciaUltima=restaurando.distancia;crucesUltimos=restaurando.cruces;}
  const avatar=new THREE.Group(),garaje=crearGaraje();let modelo=garaje.get(modos[modo].id);
  avatar.add(modelo);escena.add(avatar);$('modo').textContent=modos[modo].nombre;
  let vuelo=0,velVertical=0,impulsos=4,ultimoImpulso=false;
  const selector=$('garaje');for(const [i,v] of modos.entries()){const b=document.createElement('button');b.textContent=v.nombre;b.dataset.vehiculo=v.id;b.onclick=()=>{seleccionar(i);selector.hidden=true;};selector.append(b);}
  const threeCam=new THREE.PerspectiveCamera(50,1,.3,1000);
  const terrenoCam={getHeight:(x,z)=>mundo.altura(x,z)??y};
  const cam=new CamaraCenitalInteligente(threeCam,{terreno:terrenoCam,colisiones:[]});
  cam.yaw=estado.rumbo+Math.PI;cam.blanco.set(estado.x,y+1.3,estado.z);cam.ojo.set(estado.x-18,y+25,estado.z+10);cam.zoom=cam.zoomObj=.64;
  const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);threeCam.aspect=innerWidth/innerHeight;threeCam.updateProjectionMatrix();};addEventListener('resize',resize);resize();
  const hud=document.querySelector('.hud');const ajustarPaneles=()=>document.documentElement.style.setProperty('--panel-top',Math.ceil(hud.getBoundingClientRect().bottom+8)+'px');new ResizeObserver(ajustarPaneles).observe(hud);ajustarPaneles();
  const teclas=new Set(),toques=new Map();
  const activo=k=>teclas.has(k)||[...toques.values()].includes(k);
  function limpiar(){teclas.clear();toques.clear();}
  function perfil(){return perfilVehiculo(modos[modo]);}
  const celda=(x,z)=>indice.sectores.find(s=>x>=s.x-indice.tamano_m/2&&x<s.x+indice.tamano_m/2&&z>=s.z-indice.tamano_m/2&&z<s.z+indice.tamano_m/2);
  function piso(x,z){const c=celda(x,z),s=c&&mundo.cargador.cache.get(c.id);return s&&s.zona!=='mar'?mundo.altura(x,z):undefined;}
  function obstaculo(a,b,altura){
    for(const s of mundo.cargador.cache.values())for(const o of s.objetos){
      if(!Number.isFinite(o.base_m)||!Number.isFinite(o.altura_m))continue;
      if(altura+1.72<=o.base_m||altura>=o.base_m+o.altura_m)continue;
      if(chocaHuella([a.x,a.z],[b.x,b.z],o.huella,radioVehiculo(modos[modo])))return true;
    }return false;
  }
  function alternarCarrera(){
    if(pausa||!listo)return;
    if(!carrera&&(!admiteCarrera(modos[modo])||vuelo>0))return;
    if(carrera){
      const p=posicionCarrera(red,carrera);
      const suelo=piso(estado.x,estado.z);
      if(p.nivel!==0||suelo===undefined||Math.abs(suelo-y)>.65){$('mensajeCarrera').textContent='Sal de la vía elevada antes de explorar.';return;}
      distanciaUltima=carrera.distancia;crucesUltimos=carrera.cruces;
      carrera=null;rama=null;estado={...estado,velocidad:0};anterior={...estado};yAnterior=y;
      return;
    }
    const pos={...estado,y,nivel:0};
    const c=iniciarCarrera(red,pos);if(c){carrera=c;rama=null;estado={...estado,velocidad:0};}
  }
  function paso(dt){
    anterior={...estado};yAnterior=y;
    if(!listo||restaurando){estado={...estado,velocidad:0};return;}
    const giro=Number(activo('derecha'))-Number(activo('izquierda'));
    if(carrera){
      const c=pasoCarrera(red,carrera,{lateral:giro,freno:activo('freno'),rama},dt,perfil(),bucle.t);
      const p=posicionCarrera(red,c);
      if(piso(p.x,p.z)!==undefined&&!obstaculo(estado,p,p.y)){carrera=c;estado={x:p.x,z:p.z,rumbo:p.rumbo,velocidad:c.velocidad};y=p.y;if(!c.opciones.some(o=>o.tramo===rama))rama=null;}
      else{carrera={...carrera,velocidad:0};estado={...estado,velocidad:0};}
      cam.actualizar(dt,{pos:new THREE.Vector3(estado.x,y,estado.z),vel:new THREE.Vector3(Math.sin(estado.rumbo)*estado.velocidad,0,Math.cos(estado.rumbo)*estado.velocidad),rumbo:estado.rumbo+Math.PI,rapidez:estado.velocidad});
      return;
    }
    const nuevo=pasoArcade(estado,{avance:activo('avanzar')?1:0,giro,freno:activo('freno')},dt,perfil());
    const altura=piso(nuevo.x,nuevo.z),sueloActual=piso(estado.x,estado.z);
    const impulso=activo('impulso');
    if(modos[modo].id==='jetpack'&&impulso&&!ultimoImpulso&&impulsos>0){velVertical=4;impulsos--;}
    ultimoImpulso=impulso;
    if(modos[modo].id==='jetpack'){velVertical=Math.max(-2.2,velVertical-4*dt);vuelo=Math.max(0,Math.min(8,vuelo+velVertical*dt));if(vuelo===0){velVertical=0;impulsos=4;}if(vuelo===8)velVertical=Math.min(0,velVertical);}
    else{vuelo=0;velVertical=0;impulsos=4;}
    const nuevaY=altura===undefined?y:altura+vuelo;
    if(altura===undefined||sueloActual===undefined||(vuelo===0&&Math.abs(altura-sueloActual)>Math.max(.5,Math.hypot(nuevo.x-estado.x,nuevo.z-estado.z)*.65))||obstaculo(estado,nuevo,Math.min(y,nuevaY))){
      if(nuevo.x!==estado.x||nuevo.z!==estado.z)choques++;
      estado={...estado,velocidad:0,rumbo:nuevo.rumbo};
      if(modos[modo].id==='jetpack'&&sueloActual!==undefined&&!obstaculo(estado,estado,Math.min(y,sueloActual+vuelo)))y=sueloActual+vuelo;
    }else{estado=nuevo;y=nuevaY;}
    cam.actualizar(dt,{pos:new THREE.Vector3(estado.x,y,estado.z),vel:new THREE.Vector3(Math.sin(estado.rumbo)*estado.velocidad,0,Math.cos(estado.rumbo)*estado.velocidad),rumbo:estado.rumbo+Math.PI,rapidez:estado.velocidad});
  }
  function dibujar(alfa){
    mundo.actualizar({...estado,radio:650,radioVisible:65});estadoMundo=mundo.procesar({maxLotes:2});
    const h=piso(estado.x,estado.z);listo=estadoMundo.listo&&h!==undefined;
    if(restaurando&&estadoMundo.listo){
      if(h===undefined||obstaculo(estado,estado,h)){estado={x:1350,z:1110,velocidad:0,rumbo:Math.PI/2};anterior={...estado};y=yAnterior=15;listo=false;modo=0;avatar.remove(modelo);modelo=garaje.get(modos[modo].id);avatar.add(modelo);$('modo').textContent=modos[modo].nombre;}
      else{y=yAnterior=h;anterior={...estado};guardado=true;}
      cam.blanco.set(estado.x,y+1.3,estado.z);cam.ojo.set(estado.x-18,y+25,estado.z+10);cam.yaw=estado.rumbo+Math.PI;
      restaurando=null;
    }else if(listo&&bucle.pasos===0){y=yAnterior=h;}
    sonido.actualizar(pausa?0:estado.velocidad,['moto','auto','camion','moped','jetpack'].includes(modos[modo].id));
    avatar.position.set(mezclar(anterior.x,estado.x,pausa?1:alfa),mezclar(yAnterior,y,pausa?1:alfa),mezclar(anterior.z,estado.z,pausa?1:alfa));avatar.rotation.y=estado.rumbo;
    $('impulso').hidden=modos[modo].id!=='jetpack';
    const c=celda(estado.x,estado.z),s=c&&mundo.cargador.cache.get(c.id);
    $('barrio').textContent=s?.barrio||'Orbe';$('vel').textContent=Math.round(estado.velocidad*3.6)+' km/h · '+modos[modo].nombre;
    const disponible=!!carrera||(listo&&admiteCarrera(modos[modo])&&vuelo===0&&!!candidatoCarrera(red,{...estado,nivel:0}));
    $('carrera').hidden=!disponible;$('carrera').textContent=carrera?'Salir de la carrera':'Seguir ciclorruta';
    $('modo').disabled=!!carrera||pausa;$('vehiculos').disabled=!!carrera||pausa;$('guardar').disabled=!listo||!!carrera||vuelo>0;
    $('panelCarrera').hidden=!carrera;
    if(carrera){
      $('distancia').textContent=Math.floor(carrera.distancia)+' m · '+carrera.cruces+' cruces seguros';
      const luces={verde:'Verde',ambar:'Ámbar',rojo:'Rojo',ninguno:''};
      $('mensajeCarrera').textContent=carrera.fase==='entrada'?'Entrando a la ciclorruta…':carrera.fase==='fin'?'Fin de la vía. Sal para explorar.':carrera.sem!=='ninguno'?'Semáforo: '+luces[carrera.sem]:carrera.opciones.length>1?'Elige el camino':'Sigue la ciclorruta';
      const firma=carrera.opciones.map(o=>o.tramo).join('|');
      if(firma!==firmaRamas){firmaRamas=firma;const panel=$('ramas');panel.replaceChildren();for(const [i,o] of carrera.opciones.entries()){const b=document.createElement('button');b.textContent=o.angulo>.35?'Derecha':o.angulo<-.35?'Izquierda':'Recto';b.setAttribute('aria-label',b.textContent+' · '+(i+1));b.dataset.rama=o.tramo;b.onclick=()=>{rama=o.tramo;};panel.append(b);}}
      for(const b of $('ramas').children)b.setAttribute('aria-pressed',String(b.dataset.rama===rama));
    }else{firmaRamas='';$('ramas').replaceChildren();}
    $('aviso').hidden=listo||pausa;$('aviso').textContent=estadoMundo.errores?.length?'Error de geometría; revisa los datos':'Cargando terreno y vías…';
    renderer.render(escena,threeCam);cuadros++;
  }
  const bucle=new Bucle({actualizar:paso,dibujar});
  function pausar(valor=!pausa){pausa=valor;limpiar();anterior={...estado};yAnterior=y;if(pausa)bucle.pausar();else bucle.reanudar();$('pausa').textContent=pausa?'Continuar':'Pausa';$('pausa').setAttribute('aria-pressed',String(pausa));}
  function seleccionar(i){if(pausa||carrera||vuelo>0||!modos[i])return;const anteriorModo=modo;modo=i;if(obstaculo(estado,estado,y)){modo=anteriorModo;return;}estado=adaptarVelocidad(estado,perfil());avatar.remove(modelo);modelo=garaje.get(modos[modo].id);avatar.add(modelo);$('modo').textContent=modos[modo].nombre;}
  function cambiar(){seleccionar((modo+1)%modos.length);}
  function guardar(){if(!listo||carrera||vuelo>0)return;try{guardado=escribirGuardado(localStorage,{version:1,mundo:'orbe-g0',x:estado.x,z:estado.z,rumbo:estado.rumbo,vehiculo:modos[modo].id,distancia:distanciaUltima,cruces:crucesUltimos},ids);}catch{guardado=false;}$('guardar').textContent=guardado?'Guardado':'No guardado';}
  $('guardar').onclick=guardar;
  $('sonido').onclick=async()=>{const on=await sonido.alternar();$('sonido').textContent=on?'Sonido sí':'Sonido no';$('sonido').setAttribute('aria-pressed',String(on));};
  $('zoom').onclick=()=>cam.siguienteAcercamiento();
  const dedos=new Map();let pellizco=0;
  $('cv').addEventListener('wheel',e=>{e.preventDefault();cam.ajustarZoom(e.deltaY<0?.08:-.08);},{passive:false});
  $('cv').addEventListener('pointerdown',e=>{$('cv').setPointerCapture(e.pointerId);dedos.set(e.pointerId,{x:e.clientX,y:e.clientY});if(dedos.size===2){const [a,b]=[...dedos.values()];pellizco=Math.hypot(a.x-b.x,a.y-b.y);}});
  $('cv').addEventListener('pointermove',e=>{const a=dedos.get(e.pointerId);if(!a)return;dedos.set(e.pointerId,{x:e.clientX,y:e.clientY});if(dedos.size===1){cam.orbitarManual(-(e.clientX-a.x)*.007,(e.clientY-a.y)*.004);cam.pausaManualSeg=2.5;}else if(dedos.size===2){const [u,v]=[...dedos.values()],d=Math.hypot(u.x-v.x,u.y-v.y);if(pellizco>5)cam.ajustarZoom((d-pellizco)*.004);pellizco=d;}});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('cv').addEventListener(ev,e=>{dedos.delete(e.pointerId);pellizco=0;});
  const mapa={ArrowUp:'avanzar',KeyW:'avanzar',ArrowLeft:'izquierda',KeyA:'izquierda',ArrowRight:'derecha',KeyD:'derecha',ArrowDown:'freno',KeyS:'freno',Space:'freno',KeyJ:'impulso'};
  addEventListener('keydown',e=>{if(mapa[e.code]){e.preventDefault();if(!pausa)teclas.add(mapa[e.code]);}else if(!e.repeat&&(e.code==='KeyP'||e.code==='Escape'))pausar();else if(!e.repeat&&e.code==='KeyV')cambiar();else if(!e.repeat&&e.code==='KeyR')alternarCarrera();else if(!e.repeat&&carrera&&/^Digit[1-9]$/.test(e.code)){const o=carrera.opciones[Number(e.code.slice(-1))-1];if(o)rama=o.tramo;}});
  addEventListener('keyup',e=>{if(mapa[e.code])teclas.delete(mapa[e.code]);});
  for(const id of ['avanzar','izquierda','derecha','freno','impulso']){const btn=$(id);btn.addEventListener('pointerdown',e=>{e.preventDefault();if(!pausa){btn.setPointerCapture(e.pointerId);toques.set(e.pointerId,id);}});for(const evento of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(evento,e=>toques.delete(e.pointerId));}
  $('ajustes').onclick=()=>{selector.hidden=true;$('opciones').hidden=!$('opciones').hidden;};$('vehiculos').onclick=()=>{if(!carrera&&!pausa){$('opciones').hidden=true;selector.hidden=!selector.hidden;}};$('carrera').onclick=alternarCarrera;$('modo').onclick=cambiar;$('pausa').onclick=()=>pausar();addEventListener('blur',()=>pausar(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)pausar(true);});
  window.RUN_CITY_MOTOR={estado:()=>({x:estado.x,z:estado.z,y,velocidad:estado.velocidad,modo:modos[modo].nombre,vehiculo:modos[modo].id,vuelo,impulsos,pausa,listo,choques,carrera:carrera?{fase:carrera.fase,distancia:carrera.distancia,cruces:carrera.cruces,evento:carrera.evento,tramo:carrera.ruta.tramo,sem:carrera.sem,opciones:carrera.opciones.map(o=>o.tramo)}:null,distanciaUltima,crucesUltimos,guardado,sonido:sonido.activo,camYaw:cam.yaw,camZoom:cam.zoom,cuadros,pasos:bucle.pasos,carga:estadoMundo,drawCalls:renderer.info.render.calls})};
  cam.actualizar(1/60,{pos:new THREE.Vector3(estado.x,y,estado.z),vel:new THREE.Vector3(),rumbo:estado.rumbo+Math.PI,rapidez:0});
  bucle.iniciar();
}
iniciar().catch(e=>{$('aviso').hidden=false;$('aviso').textContent='No se pudo abrir Orbe: '+e.message;console.error(e);});
