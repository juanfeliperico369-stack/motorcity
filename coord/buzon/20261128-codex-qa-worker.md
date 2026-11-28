# X-5 · Banco de carga en Chromium

CI específica de Motor City 6 anterior en verde (run 46117782635). Se añade prueba Playwright de Worker real con HTTP local y viewport 412×860, CPU 4×, espera por estado y errores. No hay escena 3D, ni teletransporte ni medición de FPS; los cambios de sector son entradas directas de un banco de módulo, no una prueba de movimiento del jugador. Pendiente ejecutar el nuevo job de navegador y, cuando exista la escena, probar los 2 s a 30 km/h, controles, pausa, sonido y memoria. Sin modificar motor 5.x ni Run-City/motor/.
