/* Colisión horizontal: cápsula barrida (segmento de movimiento + radio).
 * Huellas simples del contrato v1, metros. No modela bóvedas ni interiores. */
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const dist=(p,a,b)=>{const x=b[0]-a[0],z=b[1]-a[1],l=x*x+z*z,t=l?Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*z)/l)):0;return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*z);};
function dentro(p,pol){let r=false;for(let i=0,j=pol.length-1;i<pol.length;j=i++){const a=pol[i],b=pol[j];if(dist(p,a,b)<1e-9)return true;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])r=!r;}return r;}
export function chocaHuella(a,b,pol,radio){
  if(!Number.isFinite(radio)||radio<0||!Array.isArray(pol)||pol.length<3)throw new RangeError('Huella o radio inválido');
  if(dentro(a,pol)||dentro(b,pol))return true;
  for(let i=0;i<pol.length;i++){const c=pol[i],d=pol[(i+1)%pol.length];if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)return true;if(Math.min(dist(a,c,d),dist(b,c,d),dist(c,a,b),dist(d,a,b))<=radio)return true;}
  return false;
}
