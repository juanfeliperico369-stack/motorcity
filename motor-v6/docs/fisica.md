# Física arcade y recorrido

`src/fisica/arcade.js` implementa el plan Run City §12 en metros y segundos: a velocidad máxima en 1,8 s, frenada en 0,7 s, rodar en 1,35 s y giro de 90° en 0,5 s. A pie, `pie: true` llega a la velocidad indicada en 0,25 s; `VELOCIDADES.caminar` y `correr` son 3,5 y 7 m/s. El perfil `foot` de RunRunZero conserva su multiplicador de carrera 0,62; `velocidadVehiculo` normaliza los 17 multiplicadores de carrera respecto a bicicleta 0,96 y 11 m/s. No sustituye las velocidades de caminar y correr.

La distancia integra la aceleración lineal hasta alcanzar la meta y después la velocidad constante, incluso cuando un paso cruza ese instante. La dirección usa el rumbo medio por paso y es una aproximación; usar paso fijo pequeño. Son parámetros de diseño, no una simulación de fuerzas.

`src/fisica/recorrido.js` ofrece una guía poligonal 3D para rieles o cables: `crearRecorrido([{x,y,z}, ...])` y `avanzarRecorrido(ruta, distancia, velocidad, dt)`. Distancia en metros, velocidad firmada en m/s, tiempo en segundos; el resultado incluye posición y si está en un extremo. Se limita al principio o al final, sin reversa automática. No gestiona estaciones, aceleración, catenaria, colisiones ni conexiones y aún requiere integración con el transporte.

Pruebas: desde la raíz de motorcity ejecutar `node motor-v6/tests/fisica.mjs`.
