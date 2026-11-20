# Resultados verificados de GitHub Actions · Motor City 3.0.1

**Fecha:** 2026-11-20. **Ejecución:** https://github.com/juanfeliperico369-stack/motorcity/actions/runs/44750220010.

## G-H6: validación real (primera ronda)
- **Node 22:** `node motor.mjs construir` correcto. Motor 757 KB, 60 fragmentos. HTML único de Mandados 5.203 KB, mundo Medellín 8.884 KB.
- **Pruebas del núcleo:** `node motor.mjs prueba` → **129 de 129** satisfactorias, 11,7 s.
- **Revisión de atlas:** Gemini **9 atlas / 997 cuadros** y ChatGPT **6 atlas / 676 cuadros**, 0 problemas graves informados.
- **Chromium + Playwright:** `node motor.mjs prueba --navegador` → **138 de 138** satisfactorias en 68,3 s. Consola sin errores en los casos de prueba.
- **Medianas de pintura en prueba CPU 4× más lenta:** cenital 8,3 ms; ciudad 3D 10,4; maqueta 12,8; lateral 11,4; panorámica 6,2; todas bajo 40 ms. **No son mediciones de hardware móvil físico.**

## G-H12: público simulado, 20 s por perfil (primer muestreo)

| Perfil | Veredicto del bot | Llegadas | Distancia | Atascado | Choques | FPS | Errores |
|---|---|---|---:|---:|---:|---:|---|
| Sofía, 8 años | bien | 9,7 s; 10,9 s | 47,53 m | 0,4834 s (2,4 %) | 0 | 59,9 | 0 |
| Don Gilberto, 70 años | mal | ninguna en 20 s | 40,09 m | 0,2 s (1,0 %) | 0 | 59,9 | 0 |
| Valentina, 17 años | bien | 11,6 s; 12,8 s | 91,46 m | 0,2 s (1,0 %) | 0 | 59,9 | 0 |
| Mark, turista | bien | 10 s; 11,2 s | 46,50 m | 0,7666 s (3,8 %) | 1 | 59,9 | 0 |

**Interpretación:** el bot mayor no alcanzó el primer objetivo en una ventana recortada de 20 s; no se atascó, no chocó y avanzó 40 metros, por lo que no se debe declarar falla de accesibilidad sin repetir con la ventana estándar de 45 s. La niña cumple aquí el objetivo G-H24 de tiempo atascado menor de 25 % sin necesidad de modificar las ayudas de manejo; los escenarios deben repetirse en condiciones variadas.

## G-H1: capturas
Se amplió el flujo para que la siguiente ejecución de GitHub Actions corra `node motor.mjs capturas` y publique sus 14 PNG en el artefacto `motor-city-publico`. **Estas capturas aún no estaban en la primera ejecución**, y la auditoría visual G-H1 sigue sujeta a inspección.

## Limitaciones
- No se probó aún un teléfono Android/iOS físico, calor o consumo de batería (G-H9 / G-H14 / G-H16).
- No se probó simultáneamente la integración de EnCicla y El Metro; requieren migraciones en sus repositorios.
- No se corrió `npx modern-web-guidance ... legacy-scan`; tampoco se instaló ninguna skill en Antigravity (G-H12 y G-H13 incompletas).
