# G-H1 · Revisión visual real de Mandados y portada (20-nov-2026)

**Evidencia:** PNG auténticos de Chromium 412×860 (DPR 2), generados por `node motor.mjs capturas` en [GitHub Actions #44752235751](https://github.com/juanfeliperico369-stack/motorcity/actions/runs/44752235751). Las imágenes no son recreaciones ni arte generado.

| Fotografía inspeccionada | Hallazgo | Gravedad | Intervención |
|---|---|---|---|
| `capturas/cenital-10h.png` | Dos bloques en el HUD muestran la misma misión («De Hecho Con Amor Deli…») y el aviso inicial ocupa gran parte del centro; distrae del punto de inicio. | Media | Se suprime el aviso redundante del **primer** mandado; vuelve a mostrarse cuando se han completado entregas. |
| `capturas/cenital-10h.png` | Algunos rótulos amarillos del mundo se leen detrás de la columna fija de botones; no son elementos CSS, se dibujan en Canvas. | Media | `MC.Vista2D.etiquetas` admite rectángulos de exclusión; Mandados reserva 84 px CSS a la derecha y se añade prueba. |
| `capturas/lateral-20h30.png` | Zócalos, árboles, iluminación nocturna y la relación de escalas son legibles; el paisaje mantiene la profundidad. Los rótulos también llegan bajo los botones. | Baja-media | Misma exclusión de etiquetas. |
| `capturas/portada-412.png` | La nueva portada editorial muestra una acción principal clara, tipografía contenida y ausencia de clichés neón/gradientes genéricos; el diseño no aparenta ser una captura del juego. | Sin hallazgos graves | Se conserva el diseño y se amplía la prueba responsiva. |

**Alcance:** aquí se examinaron **tres capturas del juego/portada**, no la totalidad de las 14 capturas del juego. La auditoría de las otras 12 capturas existentes en el artefacto, además de la revisión física en Android/iOS, permanece pendiente.

**Regla estructural:** los rótulos excluidos siguen teniendo datos; solo se omite dibujarlos cuando quedarían detrás de un control, sin afectar el mundo, su física ni su guardado.
