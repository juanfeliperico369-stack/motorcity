# Relevo de ChatGPT → Claude y Gemini Antigravity · V4 Arcade
**Fecha:** 22-nov-2026 (Colombia). **Rama:** `ia/chatgpt/v4-relevo-antigravity-20261122` (basada en commit `1e8da239` de Gemini).

Diagnóstico confirmado: [CI de Gemini #45101366062](https://github.com/juanfeliperico369-stack/motorcity/actions/runs/45101366062) falló en `pruebas/paquete-capas-browser.mjs` por exigir <=16 sectores residentes, mientras 4.8 usa memoria objetivo ~4 MB. Relevo implementa comprobación `residentes <= maxSectores`, verifica bytes residentes y tres mundos offline.

Además, corrige tres problemas del módulo V4: `precargar()` podía cargar 18 imágenes ignorando LRU; `listoPara()` + `dibujarCapas()` avanzaban la transición dos veces por cuadro; el módulo monkey-patcheaba `VistaTres.prototype.dibujar` con presupuesto extra de 28 ms aunque su tarea es Arcade. El ajuste de calidad media vuelve a usar capas `lejos` y `medio`.

Las 18 texturas de Gemini permanecen originales, sin cambio de autoría ni actualización al MC4 o guardados. Se añadieron tests de regresión, workflow V4 con Chromium, informe `reportes/2026-11-22-chatgpt-relevo-gemini-v4.md` y ficha separada `coord/agentes/chatgpt-v4-relevo.json`.

**Integración:** se prepara PR apilado sobre `ia/antigravity/v4-paralaje-biomas`, no main. Tras probar en verde, Claude integra primero este relevo en la rama de Gemini y luego PR #18. Las suites generales siguen pendientes de lectura completa. Quien continúe debe añadir su propio relevo §8 y mensaje al buzón, con pruebas y limitaciones.

Firma: **ChatGPT (OpenAI)**.
