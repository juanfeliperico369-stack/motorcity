# Carga y física para Run City · 28-nov-2026

Rama `ia/codex/carga-fisica`; cambios limitados al motor nuevo `motor-v6` y sus verificaciones. Contrato de datos asociado: Run-City PR #5 y editor PR #4.

- Carga: trabajador real, prioridad de visibles y dependencias directas, cola por cercanía/rumbo, caché limitada, cancelación selectiva, errores, timeout y reintentos acotados.
- Física: 17 perfiles de carrera, caminar/correr, curvas de aceleración/freno/rodar y distancia corregida al saturar la velocidad dentro de un paso; guía geométrica 3D para recorridos.
- Pasaron `verificar.mjs`, `bucle.mjs`, `sectores.mjs` y `fisica.mjs`.
- Chromium del sistema, viewport 412×860: recorrido sintético local de 258,44 m a 30 km/h, 1.861 cuadros del controlador de prueba, 16,7 ms de espera máxima visible/dependencias, caché máxima 3, concurrencia máxima 2 y cero errores. Estos cuadros no son FPS de una escena renderizada. Resultado variable con la máquina; no equivale a un celular físico.
- La CI dedicada repite las cuatro pruebas Node y la integración de navegador. Pendiente integrar con Orbe real y medir render, memoria, APK y dispositivo. Rieles/cables requieren conectar estaciones, aceleración y transporte; no se declara terminado X-4 completo.

Uso y límites: `motor-v6/docs/sectores.md` y `motor-v6/docs/fisica.md`. No se cambia el motor publicado de los juegos existentes ni la copia exportada de Run-City.
