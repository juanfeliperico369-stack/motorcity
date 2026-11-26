# 2 · Cómo registrar y cómo «amarrarte» antes de presentar el proyecto

> **Resumen en una línea.** En Colombia no se patenta el software ni un juego. Se protege con **derecho de autor**: tus obras están protegidas desde que las creas, y el **registro en la DNDA**, que es gratis, te da fecha cierta y prueba. A eso se le suman la **marca** propia en la SIC, un **acuerdo de confidencialidad** y la **radicación** de tu propuesta antes de mostrarla.

## 2.1 ¿Se puede «patentar» el motor o los juegos?

**No, tal como están.** La Decisión 486 de 2000 de la Comunidad Andina, en su art. 15, dice que **no son invenciones**:
- los programas de ordenador «como tales»;
- los métodos matemáticos;
- las reglas y los métodos de juegos;
- las formas de presentar información.

| Herramienta | Qué protege | Dónde | Cuánto dura | Costo | ¿Te sirve? |
|---|---|---|---|---|---|
| **Derecho de autor** (registro de software, obra literaria y obra artística) | El código, los textos, el arte y la forma concreta del juego | DNDA | Toda tu vida y 80 años más (Ley 23 de 1982, art. 21) | **Gratis** | **Sí. Es lo principal.** |
| **Marca** | Los nombres y logos propios (Motor City, Turno Cero…) | SIC | 10 años, renovables sin límite (Decisión 486, art. 152) | Tasa oficial por clase | **Sí**, para tus nombres. |
| **Secreto empresarial** | Lo que **no** publicas: código sin publicar, planes y datos | Tú mismo: lo guardas en reserva y lo cuidas con contratos (Decisión 486, arts. 260–266; Ley 256 de 1996, art. 16) | Mientras siga secreto | Gratis | **Sí**, para lo nuevo que aún no publicas. |
| **Patente de invención** | Una solución **técnica** nueva, con nivel inventivo y aplicación industrial | SIC | 20 años | Alto: tasas y abogado | **Casi seguro que no** (lee abajo). |

**Sobre la patente:**
- Solo cabría si hubiera una invención técnica de verdad, con efecto técnico más allá del programa. Por ejemplo, un método nuevo de transmisión de datos que nadie haya publicado antes.
- La carga del mundo «por partes» y la cámara cenital son técnicas conocidas en la industria, así que no pasarían el examen de novedad.
- Además, el código ya es público desde noviembre de 2026. La ley da **12 meses** desde que el propio inventor lo divulga para pedir la patente (Decisión 486, art. 17).
- Si algún día quieres intentarlo, hazlo con un agente de propiedad industrial antes de noviembre de 2027.

## 2.2 Antes de registrar: prepara los archivos (30 minutos)

1. **Un ZIP por software, solo con el código**, que es lo tuyo. Así no entran las skills de terceros ni los datos de OpenStreetMap, y el archivo queda liviano. Desde una terminal, en la carpeta de cada repositorio:
   ```bash
   # desde motorcity/ (Motor City y Turno Cero; ~1,2 MB)
   git archive --format=zip -o "Motor City.zip" HEAD -- js herramientas pruebas motor.mjs MOTOR.md VERSION.json
   git archive --format=zip -o "Turno Cero.zip" HEAD -- juegos/getaway docs/TURNO-CERO.md
   # desde BicicletasUno/ (Juega EnCicla, ~11 MB, y Motor del Valle, ~0,1 MB)
   git archive --format=zip -o "Juega EnCicla.zip" HEAD -- src tools tests
   git archive --format=zip -o "Motor del Valle.zip" HEAD -- motor-valle
   # desde MetroZero/ (El Metro, ~6,4 MB)
   git archive --format=zip -o "El Metro.zip" HEAD -- src tools
   # desde RunRunZero/ (Run Scooter, ~0,2 MB)
   git archive --format=zip -o "Run Scooter.zip" HEAD -- src tools
   ```
   - **Sin computador:** en GitHub, entra a la carpeta del código (`js/`, `src/`…), usa «Code › Download ZIP» y sube solo esa carpeta.
   - **O la APK:** la DNDA también acepta la APK del juego como archivo del programa.
2. **La huella de cada archivo** (SHA‑256): `sha256sum *.zip > huellas.txt`. Guárdala con el certificado. La huella une el archivo que registraste con la historia de GitHub. Las huellas de las versiones de hoy están en [`huellas-2026-11-26.txt`](huellas-2026-11-26.txt).
3. **El PDF de tus documentos** de diseño, visión y misión (documento 1, § 1.3).
4. **El título del archivo** debe ser **idéntico** al título de la obra en el formulario. Por ejemplo, la obra «Motor City» va con el archivo `Motor City.zip`.

## 2.3 El registro en la DNDA, paso a paso (en línea y gratis)

1. Entra a **www.derechodeautor.gov.co › Registro de obras**. El registro en línea de la DNDA queda en **registroenlinea.gov.co**, o en el portal nuevo **registro.derechodeautor.gov.co** si la página te manda allá.
2. Crea tu cuenta con **«Regístrese»**: datos personales, correo y contraseña. Es a nombre tuyo, como persona natural.
3. Escoge la categoría **«Software»** (o «Soporte lógico») para las obras 1 a 6 del inventario. Después, **«Obra literaria»** para la 7 y la 8.
4. **Solicitante:** marca que actúas **en nombre propio**.
5. **Autor:** tú, con `[TU NOMBRE COMPLETO]`, `[CÉDULA]`, nacionalidad y dirección. Si alguien más hizo parte de la obra como persona, también va.
6. **Productor o titular:** tú (persona natural). Si después creas una empresa, podrás licenciarle las obras (documento 4).
7. **Datos de la obra:**
   - **título:** el del inventario, igual al nombre del archivo;
   - **inédita o publicada:** publicada, con la fecha y el país (Colombia; en internet, en GitHub Pages) del inventario. Turno Cero y Motor City también;
   - **descripción:** la del documento 1, § 1.2, de 500 caracteres como máximo.
8. **Cesión de derechos:** responde **«No»**, porque no le has cedido los derechos a nadie.
9. **Adjunto:** un solo archivo, el ZIP, el RAR o la APK del programa. Para la obra literaria, el PDF.
10. **Envía** y guarda el **número de radicado** y la constancia: desde ese día hay **fecha cierta**.
11. **Espera.** En 15 a 30 días hábiles revisa el estado. Cuando diga **«Registrado»**, descarga el **certificado** en PDF; puedes bajarlo las veces que quieras.

**Orden recomendado, antes de cualquier reunión:**
1. **Motor City**, porque es la base de todo;
2. **Juega EnCicla** y **El Metro**;
3. **Motor del Valle**, **Turno Cero** y **Run Scooter**;
4. los **documentos** (obra literaria).

**Cada versión grande** (por ejemplo, la próxima con la fase E) se puede volver a registrar como una nueva versión de la obra.

> **Qué vale el registro.** Es **declarativo**: no crea el derecho, que ya tienes, pero hace presumir ciertos los hechos que constan en él, salvo prueba en contrario (Decisión 351, art. 53). En un pleito, quien te copie tendrá que probar que lo hizo antes que tú.

## 2.4 La marca propia en la SIC

1. **Busca antes, gratis**, en **sic.gov.co › Propiedad Industrial › SIPI** (la consulta de antecedentes marcarios). Busca Motor City, Turno Cero, Run Scooter, Motor del Valle y EMSAY.
2. **Escoge las clases** de la Clasificación de Niza:
   - **9:** software y juegos descargables;
   - **41:** entretenimiento, juegos en línea y educación;
   - **42:** diseño y desarrollo de software;
   - **28:** solo si algún día haces juguetes o juegos físicos.
3. **Radica la solicitud en línea en SIPI** y paga la tasa de cada clase. La tabla cambia cada año: revisa si aplicas a una tarifa reducida.
4. **El trámite:**
   - la solicitud se publica en la Gaceta de Propiedad Industrial;
   - terceros tienen **30 días hábiles** para oponerse (Decisión 486, art. 146);
   - luego viene el examen y la resolución;
   - si nadie se opone, suele tardar varios meses.
5. **Nunca pidas** EnCicla, Metro ni parecidas: no son tuyas (art. 136).

## 2.5 Cómo «amarrarte» antes de presentar el proyecto

Las **ideas no se protegen**; se protege la forma concreta en que están hechas (Decisión 351, art. 7). Por eso, lo que te amarra es la **prueba**: quién lo hizo, cuándo y qué mostró. A eso se suma un **contrato** que les prohíba usar lo que les enseñas.

**Antes de la reunión:**
1. **Registra** en la DNDA, por lo menos Motor City, Juega EnCicla y El Metro (§ 2.3). Basta con el número de radicado.
2. **Las huellas SHA‑256** de lo que vas a mostrar (§ 2.2), guardadas con la fecha.
3. **Fecha cierta extra (opcional):** un **estampado cronológico** de las huellas, o un **correo electrónico certificado** enviado a ti mismo con los archivos. Lo dan las entidades de certificación acreditadas por el ONAC, y tiene valor probatorio por la Ley 527 de 1999.
4. **Radica tu propuesta por escrito** en la ventanilla de correspondencia, física o virtual, del Metro y del Área Metropolitana: una carta corta con el resumen del proyecto, la lista de lo que vas a presentar y la reserva de derechos (modelo en el documento 3).
   - **Te dan un número de radicado con fecha:** es la prueba oficial de que recibieron tu propuesta ese día.
   - Si no te responden, la entidad debe contestar una petición en **15 días hábiles** (Ley 1755 de 2015).
5. **Pide que firmen el acuerdo de confidencialidad** (documento 3) antes de enseñar detalles. Si la entidad tiene su propio formato, léelo y verifica que incluya:
   - la no divulgación;
   - el no uso;
   - la no ingeniería inversa;
   - la declaración de que no tienen un desarrollo igual;
   - la reserva de tus derechos.
6. **Prepara la demo protegida:**
   - muestra la **APK o el HTML**, nunca el repositorio ni el código;
   - en la portada o en una diapositiva, pon «© `[TU NOMBRE]` · Todos los derechos reservados · Registro DNDA n.º ___».

**En la reunión:**
- Lleva el **acta de presentación** (modelo en el documento 3): fecha, asistentes, qué se mostró y la reserva de derechos. Pide que la firmen o, por lo menos, toma una foto de la lista de asistentes.
- No entregues el código, ni archivos editables, ni accesos a los repositorios.

**Después de la reunión, el mismo día:**
- Envía un **correo de seguimiento**: «Gracias por la reunión del [fecha], en la que presenté Juega EnCicla y El Metro, obras de mi autoría registradas en la DNDA con los n.º ___ …». La respuesta, o el silencio, queda como prueba.
- Guarda todo en una carpeta con fecha: el radicado, el acuerdo de confidencialidad, el acta, los correos y las huellas.

**Sobre los repositorios públicos:**
- **Hoy los cuatro son públicos y no tienen licencia.** Eso significa «todos los derechos reservados»: nadie puede usar el código sin tu permiso, pero cualquiera lo puede ver y copiar a escondidas.
- Desde esta versión, cada repositorio tiene un archivo **`AVISO-LEGAL.md`** que lo deja claro.
- Si quieres más reserva antes de presentar, puedes volver privados los repositorios. GitHub Pages en un repositorio privado pide el plan pago (GitHub Pro). Otra forma es dejar públicas solo las páginas compiladas, en un repositorio aparte.
- La historia de commits con fecha sigue siendo tu prueba, sea público o privado. **Nunca borres la historia.**

## 2.6 Si alguien copia o usa tus juegos sin permiso

Ve en este orden, del más barato al más fuerte:
1. **Reúne la prueba:** el certificado de la DNDA, las huellas, los commits, el radicado, el acuerdo y el acta, y capturas con fecha de la copia.
2. **Envía un requerimiento escrito** (carta de cese y desista): qué copiaron, tu registro y un plazo para parar.
3. **Concilia.** La DNDA tiene su centro de conciliación y arbitraje; también sirven el de la Cámara de Comercio de Medellín y la Procuraduría, si la contraparte es una entidad pública.
4. **Demanda.** La propia DNDA tiene **funciones jurisdiccionales** para resolver pleitos de derecho de autor (Código General del Proceso, art. 24), y también sirven los jueces civiles. Se pueden pedir **medidas cautelares** para detener la copia y una indemnización de perjuicios.
5. **Lleva el caso a la SIC** por **competencia desleal**, si usaron información que les diste en reserva (Ley 256 de 1996, art. 16, violación de secretos), o si se aprovecharon de tu esfuerzo.
6. **Denuncia penal** ante la Fiscalía: la violación de los derechos morales y patrimoniales de autor es delito (Código Penal, arts. 270 a 272).
7. **Si firmaron tu acuerdo de confidencialidad,** reclama además su **incumplimiento** y la **cláusula penal**.
