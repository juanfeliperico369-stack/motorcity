# ChatGPT — Motor City 4.9 · R6: mallas por sector y tres niveles LOD

**22 de noviembre de 2026 · ChatGPT (OpenAI) · rama `ia/chatgpt/r6-sectores-lod-20261122`.**

## Lo implementado

- Herramienta autónoma **`herramientas/precocinar-sectores.mjs`** escrita en Node nativo y sin dependencias adicionales.
- Abre el contenedor MC4 y valida encabezados, longitudes y bytes descomprimidos antes de leer las capas.
- Lee los edificios del formato **EDJ** de ciudades nuevas y del **ED1** binario de Medellín, con comprobación de índices y varints.
- Usa la malla de relieve MC4 existente, muestreo bilineal y alturas aproximadas **iguales a las reglas de `Mundo.altoEdificio`**. No cambia la topografía.
- **Sectores de 1 km**, por centro de edificio, con geometrías de 3 niveles:
  - LOD 0: paredes y cubierta triangulada de huellas disponibles; conserva polígonos cóncavos mediante recorte de orejas.
  - LOD 1: prisma rectangular orientado por edificio.
  - LOD 2: agrupación de siluetas por cuadros de 40 m (solo para vista lejana).
- Exporta archivos **.bin** por sector y nivel, con triángulos de posiciones Float32, empaquetado `deflateRaw`, clasificación por tipo, sumas SHA-256 y un `manifiesto.json` rastreable. No realiza ninguna petición de red.
- Precocina las mallas **sector por sector** a partir de huellas agrupadas, para no conservar los tres niveles de triángulos completos de toda la ciudad a la vez.

## Comandos y pruebas

```bash
node --check herramientas/precocinar-sectores.mjs
node herramientas/precocinar-sectores.mjs --self-test
node herramientas/precocinar-sectores.mjs --entrada datos/guatape/mundo.mc4 --salida /tmp/r6-guatape
node herramientas/precocinar-sectores.mjs --entrada datos/medellin/mundo.mc4 --salida /tmp/r6-medellin
```

**Verificado localmente antes del commit:** sintaxis Node 22 y self-test. La prueba de referencia produjo 2 sectores, 3 LOD, **46/40/30 triángulos**, **873 bytes** comprimidos; validó también lectura de un contenedor MC4 EDJ y lectura de un **ED1 sintético con huella poligonal y varints**.

**GitHub Actions:** `.github/workflows/r6-sectores-qa.yml` ejecuta el self-test y prehornea Guatapé usando un archivo MC4 verdadero, dejando el JSON de medidas como artefacto. La ejecución debe revisarse antes de aprobar.

## Límites y decisión de arquitectura

**Esto es un prehorneador funcional de datos, no una integración completa del render 3D.** El juego por ahora sigue usando sus mallas en tiempo real. La salida NO está incluida automáticamente en el HTML; hacerlo sin medir el peso duplicaría la geometría y rompería el presupuesto móvil. No se modifica `js/45-tres.js`, `js/45-gl.js` ni el constructor: son zonas de integración compartidas con Codex/Claude.

Para completar R6 se necesita:

1. Medir peso total de Guatapé, Medellín y Nueva York, memoria pico y tiempo de primer cuadro; comprobar porcentaje de reducción de triángulos a distancias reales.
2. Decidir cómo empaquetar por niveles en el HTML único sin obligar al juego a decodificar todos los sectores al inicio.
3. Implementar un proveedor opcional de sectores en `MC.VistaTres` con liberación de GPU/caché, LOD por distancia y fallback automático a la malla actual, especialmente en regiones modificadas por el jugador.
4. Probar edificios cóncavos reales, cubiertas y geometría a distinta cota de cada esquina; el prehorneado actual usa cota en el centro y no se presenta como reconstrucción topográfica exacta.
5. Ejecutar los comandos obligatorios del proyecto (construcción + navegador + tres + modos) antes del merge; la CI habitual debe quedar en verde.
6. Verificar uso de memoria de GPU en Android físico (responsabilidad del autor, no de este agente).

**No se alteró el MC4, los guardados, las fuentes con licencias pendientes, el HTML ni los juegos hermanos.** Los archivos generados solo se escriben en el directorio indicado por `--salida`.

**Coordinación:** R1 de Codex PR #15; R3 PR #17, R4 PR #16, R5 PR #19 y V4 de Gemini PR #18 siguen en revisión independiente. La siguiente IA debe terminar el lector de runtime, medir y mantener el relevo.

**Firma: ChatGPT (OpenAI).**
