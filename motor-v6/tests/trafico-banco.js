/* Banco WebGL: tráfico sobre topología compilada de Orbe.
   No es juego/orbe/ ni sustituye la escena de producción. */
import * as THREE from '../src/render/three.js';
import {crearCarrilesViales,muestraVial} from '../src/fisica/trafico.js';
import {RedTrafico} from '../src/fisica/red-trafico.js';
import {bloqueaJugador,pasoProtegidoJugador} from '../src/fisica/choques-trafico.js';
import {CapaTrafico} from '../src/render/trafico.js';
import {Bucle} from '../src/nucleo/bucle.js';
const ss=await fetch('/topologia.json').then(r=>r.json()),red=crearCarrilesViales(ss);
const sim=new RedTrafico(red),capa=new CapaTrafico({tope:16}),escena=new THREE.Scene();
escena.background=new THREE.Color(0xacc7ca);
const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true});
renderer.setSize(innerWidth,innerHeight);
const cam=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,1000);
escena.add(new THREE.HemisphereLight(0xffffff,0x627467,2),capa.raiz);
const suelo=new THREE.Mesh(new THREE.PlaneGeometry(220,220),new THREE.MeshStandardMaterial({color:0x77977c}));suelo.rotation.x=-Math.PI/2;suelo.position.set(1350,14.8,1110);escena.add(suelo);
const v=[...red.carriles.values()].find(c=>c.hasta==='n_km0'&&c.largo>100),d=[...red.carriles.values()].find(c=>c.desde==='n_km0'&&c.tramo!==v.tramo&&c.largo>100);
const entrada=v.largo-45;sim.agregar({id:'correo',ruta:[v.id,d.id],s:entrada});
const p=muestraVial(v,entrada+10);
let jugador={x:p.x,y:p.y,z:p.z,radio:.4,alto:1.72},verde=false,choques=0,cuadros=0;
const avatar=new THREE.Mesh(new THREE.CapsuleGeometry(.35,1,4,8),new THREE.MeshStandardMaterial({color:0xffcf57}));escena.add(avatar);
for(const c of red.carriles.values()){
 if(c.sentido!==1)continue;
 const puntos=[0,c.transicion_m,c.largo-c.transicion_m,c.largo].map(s=>muestraVial(c,s));
 if(!puntos.some(q=>Math.hypot(q.x-1350,q.z-1110)<180))continue;
 const material=new THREE.LineBasicMaterial({color:0x40535d});
 const geo=new THREE.BufferGeometry().setFromPoints(puntos.map(q=>new THREE.Vector3(q.x,q.y+.07,q.z)));escena.add(new THREE.Line(geo,material));
}
const teclas=new Set();addEventListener('keydown',e=>{teclas.add(e.code);if(e.repeat)return;if(e.code==='KeyG')verde=!verde;if(e.code==='KeyP')bucle.pausado?bucle.reanudar():bucle.pausar();});addEventListener('keyup',e=>teclas.delete(e.code));
let e=sim.estado();
const bucle=new Bucle({actualizar:dt=>{
 const dx=Number(teclas.has('ArrowRight'))-Number(teclas.has('ArrowLeft')),dz=Number(teclas.has('ArrowDown'))-Number(teclas.has('ArrowUp'));
 const q={...jugador,x:jugador.x+dx*3.5*dt,z:jugador.z+dz*3.5*dt};
 if(bloqueaJugador(e.actores,jugador,q))choques++;else jugador=q;
 e=pasoProtegidoJugador(sim,dt,jugador,{verde:()=>verde});
},dibujar:()=>{
 avatar.position.set(jugador.x,jugador.y+.85,jugador.z);capa.actualizar(e.actores,{x:jugador.x,z:jugador.z,radio:250});
 cam.position.set(jugador.x+20,jugador.y+32,jugador.z-24);cam.lookAt(jugador.x,jugador.y,jugador.z);renderer.render(escena,cam);cuadros++;
 document.querySelector('output').textContent=(verde?'Verde':'Rojo')+' · '+e.cruces+' cruces · '+(bucle.pausado?'Pausa':'En marcha');
}});
window.bancoTrafico={estado:()=>({jugador:{...jugador},eje:Math.abs(v.dx)>Math.abs(v.dz)?'z':'x',trafico:e,verde,choques,cuadros,pasos:bucle.pasos,pausa:bucle.pausado,drawCalls:renderer.info.render.calls,triangulos:renderer.info.render.triangles,instancias:capa.lotes.map(l=>l.count)}),cerrar:()=>{bucle.detener();capa.cerrar();renderer.dispose();}};
bucle.iniciar();
