# Guatapé y la Piedra del Peñol · exportado de Motor City 2.8.0

Caja: 2186, 1341, 2786, 1941 (metros del mundo; 600 × 600 m alrededor de 2486, 1641).
- `mundo.glb`: glTF 2.0, con terreno, 300 edificios, 66 vías y 1396 árboles. Un material con colores por vértice; +Y arriba, en metros, y el origen en el centro de la caja.
- `alturas.r16` y `alturas.json`: 151 × 151 muestras cada 4 m, de 1875.3 a 1936.8 m.
- `escena.json`: edificios, vías, árboles y lugares, para poner la lógica y el arte propios.

## Cómo se abre
- **Godot 4:** arrastra `mundo.glb` a la carpeta del proyecto y luego a la escena. Para la lógica, lee `escena.json` con `JSON.parse_string`.
- **Unity:** importa `mundo.glb` con el paquete *glTFast* (Unity). Para un *Terrain*: Import Raw → `alturas.r16` (16 bits, Windows/little endian, 151 × 151). El alto es 61.5 m.
- **Unreal 5:** File → Import → `mundo.glb` (Interchange). O un *Landscape* desde `alturas.r16`, con la escala Z = (max − min) / 512 × 100.
- **Blender:** Archivo → Importar → glTF 2.0.
- **three.js y Babylon:** `GLTFLoader` y `SceneLoader` cargan `mundo.glb` tal cual.

Atribución: © colaboradores de OpenStreetMap (ODbL) vía Overture Maps; relieve SRTM/NASA (AWS Terrain Tiles).
