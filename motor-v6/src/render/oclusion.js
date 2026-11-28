/* Motor City 6 · render/oclusion.js — «lo que tapa al jugador se vuelve transparente, como en Chinatown Wars» (plan § 5).
   Los edificios llegan fusionados por sector (mundo/sectores-3d.js), así que no se puede volver transparente «un edificio»:
   se hace en el sombreador, con un cono de visión entre la cámara y el jugador (angosto en la cámara y de ~4 m junto al
   jugador, que crece con la distancia):
   - pasada opaca: lo que cae dentro del cono no se dibuja (no tapa ni escribe profundidad, así se ve lo de atrás);
   - pasada fantasma: la misma geometría (compartida, sin memoria extra), transparente y sin profundidad, dibuja SOLO lo de
     dentro del cono, con un 30 % de opacidad. Queda el edificio como un vidrio: se sabe que está y no tapa.
   Sin tramado ajedrezado ni problemas de orden. El fantasma solo se dibuja si la cámara avisa que algo tapa
   (camara.pose().oclusion.activa) y si su lote toca el cono.
   Uso: const oc = crearOclusion(THREE); oc.aplicar(material) y oc.fantasma(malla) a los edificios; cada cuadro
   oc.actualizar(pose.oclusion). */

const GLSL_COMUN = /* glsl */`
uniform vec3 uOcOjo; uniform vec3 uOcJugador; uniform float uOcRadio; uniform float uOcActiva; uniform float uOcAlfa;
varying vec3 vOcMundo;
float ocDentro() {
  vec3 ab = uOcJugador - uOcOjo; float L2 = max(dot(ab, ab), 1e-4);
  float t = clamp(dot(vOcMundo - uOcOjo, ab) / L2, 0.0, 1.0);
  float d = distance(vOcMundo, uOcOjo + ab * t);
  float r = mix(uOcRadio * 0.3, uOcRadio, t);
  float dentro = 1.0 - smoothstep(r * 0.5, r, d);                      /* 1 en el eje, 0 en el borde: borde suave */
  dentro *= step(t, 0.985) * step(uOcJugador.y - 1.7, vOcMundo.y);   /* solo entre la cámara y el jugador, y no bajo sus pies */
  return dentro * uOcActiva;
}`;

export function crearOclusion(THREE) {
  const U = {
    uOcOjo: { value: new THREE.Vector3() }, uOcJugador: { value: new THREE.Vector3() }, uOcRadio: { value: 4 },
    uOcActiva: { value: 0 }, uOcAlfa: { value: 0.3 },
  };
  const parchados = new WeakSet(), fantasmas = new Set(), materialesFantasma = new Map();
  const segmento = { a: new THREE.Vector3(), b: new THREE.Vector3(), q: new THREE.Vector3(), esfera: new THREE.Sphere() };

  function inyectar(material, modo) {
    const previo = material.onBeforeCompile;
    material.onBeforeCompile = (sh, r) => {
      previo?.call(material, sh, r);
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'varying vec3 vOcMundo;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
        #ifdef USE_INSTANCING
          vOcMundo = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
          vOcMundo = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif`);
      sh.fragmentShader = GLSL_COMUN + '\n' + sh.fragmentShader;
      /* lo opaco se corta en todo el cono; el fantasma lo rellena con opacidad que va de 1 en el borde a uOcAlfa en el eje:
         así no se ve el borde del corte */
      if (modo === 'opaco') sh.fragmentShader = sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n if (ocDentro() > 0.0) discard;');
      else sh.fragmentShader = sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n float ocF = ocDentro(); if (ocF <= 0.0) discard;')
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.a *= mix(1.0, uOcAlfa, ocF);');
    };
    const clave = material.customProgramCacheKey?.bind(material);
    material.customProgramCacheKey = () => (clave ? clave() : '') + '|oclusion-' + modo;
    material.needsUpdate = true;
  }
  /** El material de los edificios: lo de dentro del cono deja de tapar. */
  function aplicar(material) { if (!material || parchados.has(material)) return material; parchados.add(material); inyectar(material, 'opaco'); return material; }
  function materialFantasma(base) {
    let m = materialesFantasma.get(base);
    if (!m) { m = base.clone(); m.userData = {}; base.userData.alClonar?.(m); m.transparent = true; m.depthWrite = false; m.opacity = 1; inyectar(m, 'fantasma'); materialesFantasma.set(base, m); }
    return m;
  }
  /** Agrega a la malla su fantasma (comparte la geometría). */
  function fantasma(malla) {
    if (!malla?.isMesh || malla.userData.ocFantasma) return null;
    aplicar(malla.material);
    const f = new THREE.Mesh(malla.geometry, materialFantasma(malla.material));
    f.name = 'oclusion-fantasma'; f.renderOrder = 10; f.visible = false; f.matrixAutoUpdate = false; f.userData.esFantasma = true;
    malla.add(f); malla.userData.ocFantasma = f; fantasmas.add(f);
    f.addEventListener?.('removed', () => fantasmas.delete(f));
    return f;
  }
  /** Cada cuadro, con pose.oclusion de la cámara: { activa, ojo, jugador, radio } */
  function actualizar(oc) {
    const activa = !!oc?.activa;
    U.uOcActiva.value = activa ? 1 : 0;
    if (activa) { U.uOcOjo.value.set(oc.ojo.x, oc.ojo.y, oc.ojo.z); U.uOcJugador.value.set(oc.jugador.x, oc.jugador.y, oc.jugador.z); U.uOcRadio.value = oc.radio; }
    let vivos = 0;
    for (const f of fantasmas) {
      let raiz = f; while (raiz.parent) raiz = raiz.parent;
      if (!raiz.isScene) { fantasmas.delete(f); continue; }            /* su lote se soltó de la escena */
      let ver = false;
      if (activa) {
        const g = f.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
        segmento.esfera.copy(g.boundingSphere).applyMatrix4(f.parent.matrixWorld);
        segmento.a.set(oc.ojo.x, oc.ojo.y, oc.ojo.z); segmento.b.set(oc.jugador.x, oc.jugador.y, oc.jugador.z);
        const ab = segmento.q.subVectors(segmento.b, segmento.a), L2 = ab.lengthSq() || 1;
        const t = Math.max(0, Math.min(1, segmento.esfera.center.clone().sub(segmento.a).dot(ab) / L2));
        const masCerca = segmento.a.clone().addScaledVector(ab, t);
        ver = masCerca.distanceTo(segmento.esfera.center) <= segmento.esfera.radius + oc.radio;
      }
      f.visible = ver; if (ver) vivos++;
    }
    return vivos;
  }
  return { uniforms: U, aplicar, fantasma, actualizar, get fantasmas() { return fantasmas.size; } };
}
