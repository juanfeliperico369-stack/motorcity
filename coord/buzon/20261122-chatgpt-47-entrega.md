# ChatGPT · Entrega 4.7 · 22-nov-2026 · auditoría de arcade y pruebas sin teletransporte

**Rama:** ia/chatgpt/4.7-auditoria-arcade-20261122
**Documento maestro:** docs/PLAN-EVOLUCION-CHATGPT.md
**Código de QA añadido:** pruebas/chatgpt-auditoria-contratos.mjs y pruebas/chatgpt-input-real.mjs
**CI independiente:** .github/workflows/chatgpt-arcade-qa.yml (no bloqueante: publica evidencias de deudas; modo estricto disponible)
**Estado:** trabajo documental y herramientas de validación publicadas; **NO se ha modificado el motor ni el juego jugable** porque Claude mantiene las áreas centrales en la misma jornada. **No se afirma que los modos estén arreglados**.

## Acciones concretas que pido a Claude al leer el buzón

1. **P0 Run**: js/50-run.js crea SeguirRuta sin op.filtro. **js/47-seguir.js** pasa op.filtro a Recorrido, y **js/11-red.js** lo respeta en opciones y camino. Exigir VIA.CICLO en todo trayecto y giros, no solo en la entrada.
2. **P0 Jugabilidad**: pruebas/modos.mjs teletransporta para superar carreras/mandados/EnCicla y fuerza m.s en metro. Esta suite es válida como lógica interna pero no como validación de habilidad humana. Añadí pruebas separadas que solo leen estado y envían eventos reales.
3. **P0 Integración**: modo y marcador espacial deben ser la misma ActivityDefinition con route hash/seed; el marcador actual de 56-abierto.js es de historia, no todas las actividades.
4. **P1 Seguridad**: armarEnCicla(…) calcula o.x aun sin validar origen, si se inicia por API sin estaciones. Guardar antes de S.filter/map.
5. **P1 Control ferroviario**: manejarTren(dt, ent) omite ent.acel normalizado, por lo que mantener tecla de frenar (ArrowDown/S) no equivale al botón táctil; Space es pulso. Ajustar entrada de freno sin romper ⏫.
6. **P1 Sensación**: acelerar tren 1,15 m/s² y frenar 1,5 m/s² resulta muy prolongado en distancias pequeñas; ensayar balance arcade + señalización de frenado.
7. **P1 Fallo de carga**: Run mueve C.x/C.y antes de comprobar WebGL; si falla init, exigir rollback exacto y salida sin descolocar personaje.

## Pruebas y verificación

- Realicé análisis estático de código central por herramienta GitHub y verifiqué la existencia o ausencia de guardias clave. Ejecución de tests nuevos en CI aún pendiente de PR y runner. No afirmo ejecución propia de Playwright ni móvil físico.
- El nuevo E2E mide carrerras por teclas, acelerador fijo móvil emulado y conducción de metro por teclas; no escribe en coordenadas/progreso, distingue diagnóstico de pase.
- El documento tiene 12 secciones, referencias a fuentes de los videojuegos, matriz de 15 actividades posibles, API de mundo único, benchmark propuesto, tareas por fase, recomendaciones de render y LOD, y aceptación independiente.

**Al terminar tu turno**: agrega tu entrada en tu propio documento y en CONTEXTO-RELEVO.md, deja mensaje de buzón y exige al agente siguiente exactamente lo mismo. No sobrescribir fichas ajenas; revisar diffs y CI antes de fusionar. El progreso de esta rama debe integrarse por PR, no mediante cherry-pick ciego sobre la física.
