# G-H18 · Manhattan desde datos oficiales de NYC

**Fuente:** [CommonPlace de City of New York](https://data.cityofnewyork.us/City-Government/CommonPlace/t95h-5fsr), con [esquema GIS oficial](https://github.com/CityOfNewYork/nyc-geo-metadata/blob/main/Metadata/Metadata_PointsOfInterest.md).

El programa `herramientas/lugares-nyc.mjs` consulta una fuente municipal, verifica `boroughcode=1`, coordenadas dentro de Manhattan y categorías de POI, y selecciona **exactamente 50 registros** o falla. Conserva nombre, `placeid`, latitud, longitud, tipo y fuente. Los tipos de garaje o mirador se infieren **solo cuando el nombre registrado lo indica**; no se presume acceso público. La prueba `--probar` no usa red.

El flujo `.github/workflows/nueva-york-lugares.yml` genera `contenido/nueva-york-lugares.json` y lo publica en **la rama de trabajo**, nunca en `main`, solo si la API y las comprobaciones pasan. El juego final carga el archivo local sin consultar la red.

**Pendiente de verificación:** comprobar la ejecución en GitHub Actions y la existencia del archivo generado antes de declarar G-H18 completado; después contrastar estos POI con la malla MC4 y las rutas transitables.
