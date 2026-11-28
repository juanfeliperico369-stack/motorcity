/* Audio procedural original, sin recursos externos ni autoplay. */
export class SonidoRodar{
 constructor(){this.ctx=null;this.activo=false;this.ganancia=null;this.osc=null;this.filtro=null;}
 async alternar(){
   if(this.activo){this.activo=false;this.actualizar(0,false);return false;}
   try{
     if(!this.ctx){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return false;this.ctx=new Audio();this.osc=this.ctx.createOscillator();this.osc.type='triangle';this.filtro=this.ctx.createBiquadFilter();this.filtro.type='lowpass';this.filtro.frequency.value=140;this.ganancia=this.ctx.createGain();this.ganancia.gain.value=0;this.osc.connect(this.filtro).connect(this.ganancia).connect(this.ctx.destination);this.osc.start();}
     await this.ctx.resume();this.activo=this.ctx.state==='running';return this.activo;
   }catch{this.activo=false;return false;}
 }
 actualizar(v,motor){if(!this.ctx||!this.ganancia)return;const t=this.ctx.currentTime;const volumen=this.activo?Math.min(.045,Math.max(0,v)*.003):0;this.osc.frequency.setTargetAtTime((motor?48:28)+v*(motor?6:3),t,.08);this.filtro.frequency.setTargetAtTime(100+v*12,t,.1);this.ganancia.gain.setTargetAtTime(volumen,t,.05);}
}
