# Misión y visión · el motor y cada juego (al día: 26‑nov‑2026)

> **De dónde sale.** Reúne lo que el autor ya dejó escrito en cada repositorio y le suma sus decisiones del 24‑nov (el «renacimiento cenital»):
> - `README.md` y `CONTEXTO-RELEVO.md` § 1 del motor;
> - `docs/PLAN-5.0.md` y `docs/TURNO-CERO.md`;
> - en El Metro, el Bloque 1 de `arte/06-guia-unica-ia.md`, con la misión y la visión del autor, citadas tal cual;
> - en EnCicla, el § 1 de `docs/GUIA.md`;
> - el `README.md` de Run Scooter;
> - `docs/referencias/renacimiento-cenital-2026/`.
>
> - y los pedidos del 25 y el 26‑nov, palabra por palabra en `docs/PEDIDO-DEL-AUTOR-2026-11-25.md`: el mundo 3D cenital con **una sola cámara**, nada pintado en el suelo y el modo turismo.
>
> **Solo el autor las cambia.** Las IA ajustan *cómo* trabajan, nunca la misión ni la visión.

## El ecosistema en una frase
Un solo universo de juegos sobre lugares reales —empezando por Medellín y el Valle de Aburrá— que corren en un solo HTML, sin internet, en celulares modestos.
- **Tres juegos son de familia:** Juega EnCicla, El Metro y Run Scooter.
- **Uno es para adultos:** Turno Cero.
- **Los mueven dos motores:** Motor City (el motor de juego) y el Motor del Valle (el mapa del Valle que comparten EnCicla y El Metro).

## Motor City · el motor
- **Misión:** convertir cualquier lugar real (con datos abiertos) o inventado en un mundo jugable con leyes reales: física, clima, tráfico, transporte y una ciudad viva. Todo en un solo HTML, sin internet y para cualquier celular, para que los juegos lo usen.
- **Visión:** que se sienta como los grandes mundos abiertos (*GTA San Andreas*, *Chinatown Wars*) por su contenido, su sensación y sus herramientas, no por la cantidad de polígonos.
  - **Tres verdades separadas:**
    - la geográfica: qué existe y dónde, saneada en los datos;
    - la física: qué se toca y por dónde se pasa;
    - la visual: cómo lo ve cada cámara.
  - **Un solo mundo 3D y una sola cámara** (pedido del 25‑nov):
    - la cámara es la cenital, centrada, que se mueve, se acerca y se aleja; de cerca llega a «casi tercera persona»;
    - se eliminaron las demás cámaras del mundo: la maqueta, la panorámica 2D, la tercera y la primera persona;
    - **nada pintado en el suelo:** lo que tiene altura es 3D de verdad;
    - el 2D y el pixel quedan solo en los modos ya establecidos.
  - **Otros paisajes:** admite montañas, ríos, lagos, costa, mar y más ciudades del planeta.
- **Lo que no negocia:**
  - un solo HTML, sin internet ni librerías nuevas;
  - español de Colombia;
  - los guardados se conservan;
  - sala limpia: las ideas de otros juegos sí, su código y su arte no;
  - datos abiertos con atribución;
  - la fluidez de EnCicla es la vara para todos.

## Motor del Valle · el mapa compartido
- **Misión:** ser la única tubería del mapa real del Valle de Aburrá, de Caldas a Barbosa, para EnCicla y El Metro. Es el mismo mapa: EnCicla lo usa en casillas de 10 m y El Metro en casillas de 20 m. **El mapa solo se cambia ahí.**
- **Visión, desde el 24‑nov:** un Valle **bien craqueado**:
  - ninguna casa sobre la calle ni sobre el agua, con **el ancho real de cada vía**;
  - las casas, ancladas a las laderas con su zócalo;
  - las vías, con su pendiente y su nivel: el río en −1, la calle en 0, el viaducto en 1 y los cables en 2;
  - los barrios, con su identidad (biomas);
  - todo en trozos de **160 m**.

  Y **demostrado**, no supuesto: con geometría exacta, fidelidad contra OpenStreetMap y capturas.

## Juega EnCicla · `BicicletasUno`
- **Misión:** que niños, abuelos y gente de todas las edades conozcan y quieran EnCicla, el sistema público de bicicletas del Valle, jugando el trabajo de su gente:
  - del Usuario al Supervisor: 9 oficios y 27 turnos;
  - con estética de revista pixel;
  - para generar conciencia, diversión y apoyo (donaciones) para el sistema.
- **Visión:** un **modo libre** por el Valle real donde:
  - se sienten las subidas y las bajadas;
  - las ciclorrutas se leen claras;
  - la ciudad se ve bonita desde arriba.

  - El cenital nuevo va **solo en el modo libre** (decisión del 24‑nov), con la cámara única. Los oficios, los turnos, los minijuegos y la revista se quedan como están.
  - **🏆 Escalafón** está en la portada.
  - **🧭 Turismo por el valle** (26‑nov): 12 sitios con la estación EnCicla más cercana, para quien no conoce el valle.
  - Pendiente, solo como plan: «Un día en EnCicla», la apertura y el cierre de estaciones.
- **Para todo público y sin violencia.**

## El Metro · `MetroZero`
- **Misión (del autor):** «que cualquier persona —niños, familias, paisas y visitantes— conozca, use y quiera la red de transporte y la ciudad de Medellín jugando: recorriendo su mapa real, manejando cada vehículo del sistema, cuidando a la gente con la "Cultura Metro" y viviendo sus fiestas».
- **Visión (del autor):** «ser el gran juego de mundo abierto sobre Medellín y su Metro. Una ciudad fiel (relieve, río, barrios, estaciones y estructuras), con arte propio de calidad y viva de día y de noche. Que funcione sin internet en celulares modestos y se juegue en familia y en red local. Más adelante, crecer a otras redes de metro y trenes del mundo».
- **Desde el 24‑nov:**
  - **Ciudad Libre y Bus** estrenan el cenital nuevo: el viaducto va por encima, el río se ve encajonado y las rutas nunca cruzan una casa;
  - no se tocan la cabina, la panorámica, el Metrocable, la guía ni la historia de Rosalba;
- **Desde el 25 y el 26‑nov:**
  - la cámara única en la Ciudad Libre;
  - la ventana del mundo se arma por partes, sin congelones;
  - **🧭 Turismo por el valle**: el sistema integrado, sus líneas y colores, y 12 sitios con la estación más cercana de toda la red.
- **Valores:** Cultura Metro, todo público, fidelidad a la ciudad, ligereza y arte original.

## Turno Cero · `motorcity/juegos/getaway/` (18+)
- **Misión:** ser el juego de prueba con todo lo que puede el motor:
  - un *thriller* de conducción, espionaje y crimen organizado para adultos;
  - en un planeta donde Nueva York, Medellín y el Valle, y Guatapé se unen por carreteras largas;
  - con mundo abierto desde el primer minuto;
  - y todo ficción: no acusa a lugares ni a personas reales.
- **Visión:** crecer como un gran arcade de conducción en **cápsulas** que comparten vehículos y física:
  - el mundo abierto cenital: carros, derrapes, persecuciones y a pie;
  - las **carreras retro pseudo‑3D** que superen a *Free Gear*, en la Subida a Las Palmas y la Autopista Regional de noche;
  - después, el garaje y la colección, las motos y la capa aérea;
  - la Fórmula 1 y la NASCAR, como cápsulas aparte.

  **Vive solo en `motorcity` y nunca entra a los juegos de familia.**

## Run Scooter · `RunRunZero`
- **Misión:** un corredor sin fin en 3D por la ciclovía, para todo público y sin internet:
  - con 9 vehículos y la estética de la revista EMSAY;
  - la historia es repartir las revistas de EMSAY por Orbe, «la ciudad donde caben todas las ciudades».
- **Visión:** seguir como juego propio y vivir también dentro del motor como «Run en la ciclovía», que también está en Turno Cero. **No entra en el renacimiento cenital.**

## La propiedad intelectual (26‑nov)
- **Las obras son del autor:** Motor City, Motor del Valle, Juega EnCicla, El Metro, Turno Cero y Run Scooter, con su código, sus textos y su diseño.
- **Las marcas no son del autor:** EnCicla, Metro de Medellín y sus signos son de sus titulares.
- **Cómo se protegen:** con el registro en la DNDA, la marca propia en la SIC y acuerdos de confidencialidad. Todo está en `docs/propiedad-intelectual/`.
- **Para las IA:** respetan el `AVISO-LEGAL.md` y no meten en los juegos material ajeno sin permiso, como la lámina de la apertura y el cierre.
