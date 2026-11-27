# Motor 3D v6 · Base Modular («Efecto GTA · Medellín 1:1»)

> **Arquitectura construida desde cero** para reemplazar el núcleo heredado (`dist/motor.js` + 8 renderizadores + 4 físicas + HTML de 30 MB) por un **único motor 3D modular, liviano y compartido** por **Turno Cero**, **Juega EnCicla**, **El Metro** y **Run Scooter**.
>
> Plan maestro completo: [`docs/PLAN-RECONSTRUCCION-3D-V6.md`](../docs/PLAN-RECONSTRUCCION-3D-V6.md).

---

## Principios de ingeniería (sin excepciones)

1. **Mundo 100 % 3D real con texturas detalladas (PBR):** cero árboles, bancas ni carros pintados en el suelo. Los 9 materiales principales de Medellín (`arte/texturas/*.webp`) pesan **114 KB en total** (256×256 con *mipmaps*, *bump map* y filtro anisotrópico), con respaldo procedural si falta algún archivo.
2. **Arquitectura híbrida «Efecto GTA»:**
   - **12 Zonas Hero emblemáticas** (5.407 edificios y casas reales medidos de OSM/Catastro/SRTM + **5 Skateparks 3D reales**), cada una pesando ~17–45 KB en JSON/binario.
   - **Todo el resto del Valle de Aburrá navegable** con calles, casas de ladera y torres generadas de forma **genérica procedural** mediante 2 llamadas GPU `InstancedMesh` (**0 bytes** de huella almacenada por edificio).
3. **Topografía y relieve 3D real:** malla de terreno continua muestreada desde SRTM + cauce del río Medellín + pendientes reales (`getHeight`, `getNormal`, `getSlopePct`) y cordillera perimetral, con edificios anclados con zócalo de 5 m para que jamás floten en laderas.
4. **Cámara cenital única inteligente (`src/camara.js`):**
   - Movimiento **relativo a la cámara** (`getMoveBasis()`): empujar hacia arriba siempre avanza hacia donde miras en pantalla.
   - **Auto-seguimiento gradual:** gira suavemente detrás de hacia dónde camina, patina o pedalea el jugador (resorte exponencial independiente de FPS con zona muerta de 10°).
   - **Acercamiento continuo 72° → 34°** (desde cenital alta hasta casi tercera persona) + órbita manual libre + *spring-arm* anti-colisión + desvanecimiento alfa suave por edificio oclusor (sin tramado ajedrezado).
5. **Escala SI estricta (`1 unidad = 1 metro`) en `src/escala.js`:** persona adulta de **1,72 m**, skate **0,80 m**, bicicleta EnCicla **1,78 m**, moto **2,05 m**, taxi **4,35 × 1,78 × 1,46 m**, bus urbano **10,8 × 2,50 × 3,10 m**, coche Metro **23,0 × 3,20 × 3,85 m** en viaducto a **+6,80 m** libres.
6. **Parkour y Skateparks reales (`src/skatepark.js` + `src/personaje.js`):** paso fijo 60 Hz, *coyote time* (120 ms), *jump buffer* (140 ms), *auto-vault* en muros de 0,92 m, *ledge mantle* hasta 2,35 m, *slide*, rodada de aterrizaje, *quarter-pipes* curvos con impulso físico, *funbox*, 3 barandas metálicas de *grind* magnético y 3 **Paradas de Trucos** jugables.
7. **Cero *monkey-patching*:** cada responsabilidad vive en un módulo ES limpio (`import`/`export`), sin envolver prototipos ni cargar 80–100 archivos concatenados.

---

## Estructura de carpetas

```text
motor-v6/
├── demo.html                      # Slice vertical jugable (Puente 4 Sur + Skatepark + Escala SI)
├── src/
│   ├── escala.js                  # Biblia SI (1 u = 1 m) + validador automático de proporciones
│   ├── texturas.js                # Cargador PBR WebP + anisotropía + respaldo procedural offline
│   ├── terreno.js                 # Topografía 3D real (SRTM DEM + río + pendientes + montañas)
│   ├── camara.js                  # Cámara cenital única inteligente (auto-seguimiento + spring-arm)
│   ├── skatepark.js               # Skatepark 4 Sur 3D real (quarter-pipes, funbox, rails, paradas)
│   ├── personaje.js               # Rig 1,72 m + Parkour + Skate + EnCicla (coyote, buffer, grind)
│   ├── mundo.js                   # Mundo híbrido «Efecto GTA» (Hero OSM + Genérico InstancedMesh)
│   └── main.js                    # Bucle fijo 60 Hz, entrada multitouch/teclado, HUD de 5 controles
├── datos/
│   ├── zonas-hero-medellin.json   # Catálogo medido: 12 Zonas Hero, 5 Skateparks, 5.407 edificios
│   └── hero-4sur.json             # Slice real Puente 4 Sur (16,7 KB: DEM 33×33 + 90 edif. + 31 vías)
├── arte/
│   ├── disenos/                   # 4 láminas de concepto, escala SI y atlas PBR (WebP)
│   ├── texturas/                  # 9 texturas 256×256 sin costuras de Medellín (114 KB total)
│   └── capturas/                  # Evidencia visual en vivo (desktop 1280×720 y móvil 412×860)
└── tests/
    └── verificar.mjs              # Verificación de sintaxis ES, proporciones SI, datos y arte
```

---

## Cómo probarlo localmente

```bash
# 1. Validación rápida (sintaxis ES, Biblia SI, datos reales y arte)
node motor-v6/tests/verificar.mjs

# 2. Servir localmente para abrir el slice vertical jugable en navegador
python3 -m http.server 8080
# Abrir: http://127.0.0.1:8080/motor-v6/demo.html
```

### Controles del prototipo (`demo.html`)
- **Movimiento:** `WASD` / Flechas o palanca táctil izquierda (siempre relativo a la cámara).
- **Saltar / Bóveda / Trepado:** `Espacio` o botón **▲ SALTO**.
- **Truco en aire / Deslizar / Rodar:** `F` o botón **★ TRUCO**.
- **Cambiar modo (Skate / Parkour / EnCicla):** `Tab` o botón **🛹 / 🏃 / 🚲**.
- **Cámara única (acercar/alejar y rotar):** rueda del ratón / pellizco / botón **🔍** (`C`), y arrastrar pantalla o `Q`/`E` para orbitar manualmente.
- **Fila de escala SI 1:1:** botón **📏** para comparar al personaje de 1,72 m junto a la EnCicla, moto, taxi amarillo, bus urbano y viaducto del Metro.
