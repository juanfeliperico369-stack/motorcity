/* Motor City 6 · camara/three.js — aplica la pose de la cámara única (camara/camara.js) a una THREE.PerspectiveCamera.
   Sin importar Three: recibe la cámara del juego. El fov de Three es vertical y en grados. */
export function aplicarPose(camara, pose, { cerca = 0.3, lejos = 2000 } = {}) {
  camara.position.set(pose.ojo.x, pose.ojo.y, pose.ojo.z);
  camara.up.set(0, 1, 0);
  camara.lookAt(pose.blanco.x, pose.blanco.y, pose.blanco.z);
  const fov = pose.fov * 180 / Math.PI;
  if (Math.abs(camara.fov - fov) > 1e-4 || camara.near !== cerca || camara.far !== lejos) { camara.fov = fov; camara.near = cerca; camara.far = lejos; camara.updateProjectionMatrix(); }
}
