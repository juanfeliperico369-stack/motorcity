# Mundo de sectores v1: adaptador 3D experimental

Este módulo es independiente del slice fijo del Puente de la 4 Sur y del futuro juego. No crea ni usa datos reales de Orbe. Importa la misma versión de Three.js 0.170 ya vendorizada. Se ubica en src/mundo-sectores.js para conservar la reescritura del import durante la exportación.

## API
```js
const mundo = new MundoSectores({indice, opcionesCarga:{baseURL:urlAbsolutaIndice, preferirBinario:true, tope:16}, origenRender:[0,0,0]});
escena.add(mundo.raiz);
// cada frame: posición global SI, radio de precarga y visibilidad
mundo.actualizar({x,z,rumbo,radio:500,radioVisible:160});
const estado = mundo.procesar({maxLotes:1});
// altura global, undefined si no existe suelo renderizado
const y = mundo.altura(x,z);
// al finalizar:
mundo.cerrar();
```

Puede pasarse visibles explícito para usar frustum del integrador. Una celda se planifica cuando están residentes ella y sus dependencias directas. Terreno solo de celdas visibles; vías y edificios de propietarios dependientes se incluyen si sus cajas conservadoras intersectan alguna celda lista. IDs globales únicos por tipo; el propietario se emite una vez. Grupos por propietario y tipo de material, una malla por lote. Se preserva lote si firma de contenido/propietarios no cambia, se elimina si deja de estar visible y se llama dispose de geometría; materiales compartidos se eliminan al cerrar. Se renderiza la entidad completa, no se recorta por celda. No hay LOD, rebasing dinámico, instancing, colisiones ni frustum preciso todavía.

Relieve: rejilla RCS1 nx/nz, alturas fila z/columna x, triangulación a,c,b / b,c,d con normales hacia arriba. altura() devuelve la misma superficie por interpolación triangular, no bilineal. No crea suelo plano si faltan datos. Costuras y continuidad de fuente deben verificarse en la tubería; no se garantiza continuidad solo por usar esta malla. Vías: cinta por polilínea, alturas de extremos interpoladas por arco horizontal, junta acotada al semiancho; offsets de superficie 2 cm y 3,5 cm para separar calzada/ciclo. No hay curva suavizada, ajuste DEM de rasante ni puentes físicamente resueltos. Edificios: huella validada, altura_m positiva relativa a base_m explícita (ambos en metros); si falta alguno se reporta omisión, no se inventa. Triangulación de techo y caras laterales; máximo 512 vértices de huella y lote máximo configurable, por defecto 120.000 vértices. Este es un límite experimental, no memoria máxima ni garantía de tiempo por frame.

El estado distingue carga, faltantesDatos, pendientesLotes, errores, omisiones, vértices, triángulos y bytes de arrays de geometría (no VRAM/heap). listo exige sin faltantes, omisiones ni errores. Los callbacks no construyen mallas; procesar limita número de lotes, no milisegundos. El integrador debe mantener al jugador dentro de suelo y vías listas, revisar omisiones y usar coordenadas globales SI menos origenRender para render. No se conecta a PersonajeController automáticamente ni altera demo.html. Se prueba Three real y ciclo de vida en Node; no se afirma rendimiento en dispositivo.
