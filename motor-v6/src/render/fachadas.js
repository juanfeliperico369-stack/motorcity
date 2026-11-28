/* Motor City 6 · render/fachadas.js — las fachadas de los edificios, sin texturas: ventanas por piso (cada 3 m), vitrinas
   en el primero, el antepecho sin ventanas y el techo un poco más claro. Colores planos y facetas, al estilo de Run Scooter
   y de Chinatown Wars (plan de Run City § 9). Se hace en el sombreador con la posición del mundo, así que sirve para los
   edificios fusionados por sector y no pesa nada en la memoria. Necesita el atributo aFachada (la base y el tope de cada
   edificio, en metros); sin él, el material queda plano.
   - De lejos, cuando una ventana ocupa pocos píxeles, el patrón se promedia a un tono: no hay moiré ni parpadeo.
   - Convive con render/oclusion.js (que encadena este onBeforeCompile) y se vuelve a aplicar en su copia fantasma. */

const VERTICE = /* glsl */`
attribute vec2 aFachada;
varying vec3 vFachMundo; varying vec3 vFachNormal; varying vec2 vFachada;`;
const FRAGMENTO = /* glsl */`
varying vec3 vFachMundo; varying vec3 vFachNormal; varying vec2 vFachada;
float fachBanda(float f, float a, float b, float w) { return smoothstep(a - w, a + w, f) * (1.0 - smoothstep(b - w, b + w, f)); }`;
const PATRON = /* glsl */`
  if (vFachada.y > vFachada.x + 0.5) {
    vec3 nrm = normalize(vFachNormal);
    if (abs(nrm.y) < 0.5) {
      float h = vFachMundo.y - vFachada.x, piso = floor(h / 3.0), fy = fract(h / 3.0);
      vec2 tg = normalize(vec2(-nrm.z, nrm.x));
      float u = dot(vFachMundo.xz, tg) / 2.7, fx = fract(u);
      float wy = max(fwidth(h / 3.0), 1e-4), wx = max(fwidth(u), 1e-4);
      float ventana = fachBanda(fy, 0.32, 0.8, wy) * fachBanda(fx, 0.2, 0.8, wx) * step(1.0, piso);
      float vitrina = fachBanda(fy, 0.1, 0.82, wy) * fachBanda(fx, 0.06, 0.94, wx) * (1.0 - step(1.0, piso));
      float v = max(ventana, vitrina * 0.9) * step(1.1, vFachada.y - vFachMundo.y);   /* el antepecho no tiene ventanas */
      float lejos = clamp(max(wy, wx) * 2.2 - 0.45, 0.0, 1.0);
      v = mix(v, 0.3, lejos);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.12, 0.18, 0.24), v * 0.68);
    } else if (nrm.y > 0.5) diffuseColor.rgb *= 1.07;
  }`;

/** Pone las fachadas en un material estándar (MeshStandardMaterial o MeshLambertMaterial). Devuelve el mismo material. */
export function aplicarFachadas(material) {
  if (!material || material.userData.fachadas) return material;
  material.userData.fachadas = true;
  const previo = material.onBeforeCompile;
  material.onBeforeCompile = (sh, r) => {
    previo?.call(material, sh, r);
    sh.vertexShader = VERTICE + '\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      #ifdef USE_INSTANCING
        vFachMundo = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
      #else
        vFachMundo = (modelMatrix * vec4(transformed, 1.0)).xyz;
      #endif
      vFachNormal = normalize(mat3(modelMatrix) * objectNormal);
      vFachada = aFachada;`);
    sh.fragmentShader = FRAGMENTO + '\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + PATRON);
  };
  const clave = material.customProgramCacheKey?.bind(material);
  material.customProgramCacheKey = () => (clave ? clave() : '') + '|fachadas';
  material.userData.alClonar = m => aplicarFachadas(m);   /* la copia fantasma de render/oclusion.js la vuelve a pedir */
  material.needsUpdate = true;
  return material;
}
