# Relevo técnico — Gemini Antigravity V4 → ChatGPT (OpenAI)

**Fecha:** 22 de noviembre de 2026 (Colombia), ejecución de CI en UTC del 23 de noviembre.  
**Código heredado:** [PR #18 de Gemini](https://github.com/juanfeliperico369-stack/motorcity/pull/18), rama `ia/antigravity/v4-paralaje-biomas`, confirmada en commit `1e8da23931ecede100d1c5249c716324ee0521cc`.  
**Rama de continuación:** `ia/chatgpt/v4-relevo-antigravity-20261122`, basada exactamente en el commit anterior, con PR apilado contra la rama de Gemini (sin copiar las 18 imágenes ni duplicar PRs a main).

## Cinco líneas de comprensión obligatoria

1. Un solo mundo MC4 y las mismas carreteras alimentan Arcade, clásico y VistaTres: los fondos no crean un mundo paralelo.
2. La versión 4.9.0 incorpora tres materiales de paralaje por bioma, ahora seis biomas, 18 WebP 1024 × 256 y un gancho aditivo.
3. Gemini ya implementó panoramas, día/noche, neblina, LRU, fallback, cambios de calidad y capturas de 412 × 860 y 860 × 412.
4. La CI de Gemini falló por una expectativa de 16 sectores obsoleta en C-M34; Codex ya tenía una solución validada en su PR #15.
5. Este relevo debe corregir la integración y pruebas sin modificar JS de three.js, huellas, datos del MC4, guardados ni los trabajos R1–R6.

## Hallazgos y correcciones implementadas

### 1) C-M34: aserción de caché obsoleta

El test de `pruebas/paquete-capas-browser.mjs` exigía `residentes <= 16`. Desde 4.8, `Mundo.desdePaquete` ajusta la cantidad de sectores a un presupuesto aproximado de 4 MB por capa con máximo configurable hasta 512.

En lugar de **desactivar** el test, se valida ahora:
- `16 <= maxSectores <= 512`;
- `residentes <= maxSectores`;
- `bytesResidentes <= 4.000.000`;
- mismo juego offline sin peticiones de red externas, tres ciudades y capas diferidas.

Esta adaptación corresponde al comportamiento real y es equivalente en alcance a la corrección que Codex hizo en PR #15. Al fusionar ramas, Claude debe elegir una sola versión del test.

### 2) Precarga desbordaba la caché de Gemini

`MC.ParalajeBiomas.precargar()` sin argumento creaba 18 objetos `Image` directamente en `_imgs`, sin pasar por `_ordenLRU`, violando el contrato de máximo dos biomas / seis imágenes. Las pruebas antiguas auditaban la caché solo después de invocar `_asegurarImagenes` y por tanto no detectaban el desbordamiento de la precarga global.

Se corrigió para procesar biomas **secuencialmente**, usando `_asegurarImagenes` como única entrada de la caché, esperando eventos de imagen sin reinstalar handlers ni crear promesas masivas. La función reporta `false` si alguna textura falla. La auditoría pixel a pixel también precarga un bioma a la vez, y se añadió regresión explícita sobre la precarga sin argumentos.

### 3) Interferencia con el renderizador de Claude

El módulo de Gemini modificaba `VistaTres.prototype.dibujar` para forzar presupuestos de construcción de regiones de hasta **28 ms** cuando quedaban menos de 24 regiones. V4 es un cambio de Arcade y **no está autorizado a alterar** el presupuesto del render realista de Claude: podía empeorar tiempos de cuadro en móviles. Se eliminó ese hook. `js/45-tres.js` permanece intacto. Se añadió un contrato de regresión en la prueba V4.

### 4) Fundido de biomas avanzado dos veces

`listoPara()` y `dibujarCapas()` llamaban ambos a `muestrearTransicion(M,C,E.dt)` en el mismo cuadro. Se conserva el resultado por un solo cuadro y se consume antes de pintar, impidiendo sumar el tiempo de transición dos veces. Al liberar o activar fallback, se descarta el resultado pendiente.

### 5) Calidad media coherente con el plan

En calidad intermedia se eligen las capas `['lejos','medio']`, y en calidad alta las tres. La implementación de Gemini usaba `['lejos','cerca']` pese al contrato del plan; se ajustó sin afectar al modo de calidad baja, que usa las montañas procedurales originales.

## Pruebas y límites honestos

- **Inspeccionado y confirmado:** [GitHub Actions run #45101366062](https://github.com/juanfeliperico369-stack/motorcity/actions/runs/45101366062) de Gemini falló específicamente en `pruebas/paquete-capas-browser.mjs`, `assert(vivo.memoriaRaster.suelo.residentes <= 16)`. Su job de núcleo terminó bien; la falla estaba en Chromium C-M34.
- **Añadido:** workflow independiente `.github/workflows/v4-relevo-qa.yml` para construir HTML offline y probar V4, C-M34, `pruebas/tres.mjs` y `pruebas/modos.mjs` en Chromium. **No declarar éxito hasta leer la ejecución final.**
- La nueva prueba V4 verifica que `precargar()` sin argumento no supere 2 biomas o 6 imágenes, y que V4 no reescriba `VistaTres.prototype.dibujar`.
- **No se han regenerado ni publicado** los artefactos `dist/` de la rama. Son productos de `node motor.mjs construir`: Claude debe volver a construirlos en el proceso de integración antes de publicar.
- **No se ha ejecutado** una prueba de GPU física ni medición real de batería/FPS en Android o iOS.
- No se han alterado las **18 texturas de Gemini**, sus imágenes de referencia, los guardados ni el MC4. Su autoría permanece atribuida a Gemini Antigravity.

## Instrucciones de integración para Claude y siguiente IA

1. Revisar y corregir cualquier fallo del CI V4 apilado sin silenciar pruebas.
2. Integrar primero el PR de relevo en la rama de Gemini o trasladar sus cambios de manera controlada, después aprobar el PR #18 y revisar conflictos con Codex R1.
3. Conservar el módulo V4 separado del render de VistaTres; si en el futuro se quiere regular el presupuesto 3D debe ser una tarea explícita de rendimiento con FPS medidos.
4. Reconstruir artefactos `dist/` y repetir `node motor.mjs construir`, `node pruebas/prueba.mjs --navegador`, `node pruebas/tres.mjs`, `node pruebas/modos.mjs` y `node pruebas/paralaje-biomas.mjs`; confirmar que las suites terminan en verde.
5. Agregar una nueva entrada en `CONTEXTO-RELEVO.md` §8 y nuevo mensaje al buzón. No tocar `main` ni `gh-pages` directamente.

**Firma:** ChatGPT (OpenAI) · Relevo V4 de Gemini Antigravity.
