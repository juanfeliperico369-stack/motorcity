# Cargador de sectores v1

`CargadorSectores` de `src/sectores.js` recibe `catalogo: indice.sectores`. El índice lo produce el editor de `Run-City/mundo/tuberia/editar-orbe.mjs`. Pasar `baseURL: urlAbsolutaDelIndice` para resolver sus URL relativas. Cada entrada contiene `{id,url,x,z,dependencias}`; las coordenadas son el centro en metros y las dependencias son **directas**, ya calculadas por celda. No se expanden recursivamente: eso podría arrastrar todo un mapa continuo.

`actualizar({x,z,rumbo,visibles,radio})` prioriza visibles y sus dependencias antes de precarga; el rumbo está en radianes, cero hacia +z. Rechaza sin modificar el estado una selección visible que no cabe en `tope`. Selecciona precarga por distancia y rumbo, incluyendo sus dependencias solo si caben. Cancela únicamente solicitudes que dejaron de estar seleccionadas. La caché limita cantidad de sectores, no memoria del render ni del objeto JSON decodificado.

La descarga y el parseo ocurren en un Worker de módulo: límite de 200.000 bytes por archivo, validación básica de cabecera/contenido, cancelación, tiempo máximo y reintentos acotados. La geometría completa se valida antes de exportar con Python. Valores por defecto: `tope:32`, `concurrencia:2`, `timeoutMs:8000`, `reintentos:1`. Al agotarse reintentos, `alError(id,error)` informa el fallo; un sector fallido se vuelve a intentar cuando sale y reingresa a la selección. Una caída del Worker requiere crear un cargador nuevo.

`alCargar(id,sector)` avisa por cada archivo; no significa que todas las dependencias estén disponibles. Antes de construir una celda visible, comprobar `obtener(id)` y cada ID de su lista directa. El juego debe resolver nodos globales, filtrar entidades relevantes, crear y liberar mallas cuando cambia la selección. `cerrar()` termina el trabajador, temporizadores y caché. Los módulos no están conectados todavía a la escena de Run City.

Desde la raíz de motorcity:

```sh
node motor-v6/tests/sectores.mjs
node motor-v6/tests/fisica.mjs
node motor-v6/tests/verificar.mjs
node motor-v6/tests/bucle.mjs
MC_CHROMIUM=/usr/bin/chromium node motor-v6/tests/sectores-navegador.mjs
```

La última prueba requiere Playwright disponible (también mediante `NODE_PATH`), usa HTTP efímero y un trabajador real. La CI instala Playwright 1.56.1 fuera del repositorio. La prueba recorre al menos 250 m a 30 km/h, espera por visibles y dependencias y falla ante esperas superiores a 2 s, errores de navegador o límites excedidos. Los datos son sintéticos y locales: no mide rendimiento de la escena, FPS del juego ni memoria en Android.

## Relevo integrado: telemetría, liberación y RCS1

El constructor también admite baseUrl (alias de baseURL), alExpulsar(id,sector) y preferirBinario (false por defecto). estado() devuelve requeridos, faltantes, pendientes, cola, cache, bytesDescargadosCache, formatos, fallos, fatal y hasta 16 errores de callbacks. Los bytes son de transferencia de archivos residentes, no memoria JS ni GPU. Se conserva cancelación por token, timeout, reintentos acotados y selección de dependencias de la rama padre. El callback alExpulsar se ejecuta al liberar una entrada o cerrar; las excepciones de callbacks no detienen la cola. Los callbacks no deben reentrar en el cargador.

RCS1 usa url_binaria del índice de Run City solo si preferirBinario es true y el Worker dispone de DecompressionStream y Blob.stream. Si no dispone de API, usa url JSON. Un RCS1 seleccionado pero inválido produce error, no se oculta con fallback. Valida cabecera LE, límite de entrada y salida, trailer gzip, longitud y CRC; el esquema JSON se comprueba después. El formato es experimental: no se acredita equivalencia con todos los rechazos del lector Python (por ejemplo miembros gzip adicionales), compatibilidad Android 7 ni mejora de RAM. No usar en producción sin medir. El fallback de navegador antiguo no implica que módulos ES y Worker de módulo estén disponibles en Android 7.
