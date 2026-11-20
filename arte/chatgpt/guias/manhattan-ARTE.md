# C-A15 · Arte original de TURNO CERO

## Entregables
- `manhattan-concepto-editorial.svg` — lámina 1440×960 con escena esquemática de conducción nocturna, sedán ficticio, referencias de fachadas y paleta; las formas son vectoriales **originales**. No captura del juego.
- `manhattan-interfaz-movil.svg` — wireframe 412×860 en el que los carriles, HUD, misión y botones táctiles conviven. No indica pantalla ejecutable ni rendimiento.

**Nota artística:** se creó además una pintura conceptual en gouache y tinta en el chat para inspirar atmósfera. Los SVG del repositorio son una especificación de formas y capas editable por otra IA; no incluyen píxeles ni assets de los títulos usados como referencia.

## Cómo convertirlos en arte del motor
1. Extraer cada fachada en ortografía frontal/lateral con altura, ancho y profundidad en metros y coordenadas UV verificadas.
2. Convertir el sedán en 5 vistas ortográficas (frente, atrás, izquierda, derecha, techo), escala métrica consistente; sin marca de fabricante.
3. Construir un atlas propio de texturas de edificio con 32 px/m para LOD cercano y 8 px/m para lejano (propuestas, no tamaños finales).
4. En 3D usar materiales PBR simplificados / WebGL1 con sombreador propio y reflejos limitados; en Canvas usar la misma posición.
5. Validar en 320×640 y 412×860 que los controles no interceptan las calles. El wireframe no modifica MC.UI hasta que se pruebe.
6. Textura de impresión sutil opcional; nunca degradado cian/violeta genérico, iconos brillantes o sombras enormes de tarjetas.

## Derecho y procedencia
Dibujos vectoriales redactados desde cero para Motor City. No se copiarion logotipos, imágenes, mapas, tipografías o personajes propietarios. Los nombres de zonas son referencias de orientación, **no un mapa georreferenciado**. Todo el grafismo sigue siendo una guía de preproducción.
