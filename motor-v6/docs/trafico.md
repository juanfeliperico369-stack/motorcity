# Circulación vial · Motor City 6

API genérica para corredores circulacion.tipo=lateral. Dos bandas de 2,75 m en calzada 10 m con ciclovía 4,5 m; transición en los extremos, coordenada longitudinal del eje y altura de rasante. Velocidad de ensayo 8,33 m/s, aceleración 2,2 m/s² y frenado 4 m/s²: parámetros provisionales de diseño. Paso fijo recomendado 1/60 s. Distancia de frenado v²/(2a) (cinemática de aceleración constante); separación mínima de 2 m entre parachoques en el mismo carril. Detención antes de la transición final sin permiso externo, llegada al nodo con permiso. No reserva intersecciones, no transfiere actores, no simula colisiones cruzadas, jugador o peatones y no renderiza tráfico. Integrador debe añadir estas capas y gestionar también la zona de transición de origen. Distancia longitudinal no equivale al arco exacto de trayectoria lateral. No se usa todavía en Orbe. Prueba: node motor-v6/tests/trafico.mjs.

Firma documental: Eón — relevo ChatGPT/Codex.
