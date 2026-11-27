/* =====================================================================
   MOTOR 3D v6 · BIBLIA DE ESCALA REAL (SI: 1 unidad = 1 metro)
   Fuente única de proporciones para todos los juegos del ecosistema:
   Juega EnCicla, El Metro, Turno Cero y Run Scooter.
   Ningún personaje ni vehículo vuelve a dibujarse «a ojo».
   ===================================================================== */

export const ESCALA = Object.freeze({
  /* Persona adulta de referencia (Medellín, estatura media 1,72 m) */
  persona: {
    alto: 1.72,
    hombros: 0.48,
    fondo: 0.30,
    cabezaRadio: 0.115,
    piernaLargo: 0.84,
    torsoAlto: 0.54,
    ojoAlto: 1.58,
    radioColision: 0.34,
  },

  /* Movilidad activa y vehículos reales en metros exactos */
  vehiculos: {
    skate:      { nombre: 'Skate',             largo: 0.80, ancho: 0.21, alto: 0.12, ruedaD: 0.055, personaAltoTotal: 1.84 },
    patines:    { nombre: 'Patines',           largo: 0.32, ancho: 0.28, alto: 0.11, ruedaD: 0.072, personaAltoTotal: 1.83 },
    scooter:    { nombre: 'Patineta eléctrica',largo: 1.12, ancho: 0.46, alto: 1.15, ruedaD: 0.22,  personaAltoTotal: 1.86 },
    encicla:    { nombre: 'Bici EnCicla',      largo: 1.78, ancho: 0.62, alto: 1.05, ruedaD: 0.66,  asientoAlto: 0.92 },
    moto:       { nombre: 'Moto urbana',       largo: 2.05, ancho: 0.78, alto: 1.12, ruedaD: 0.60,  asientoAlto: 0.80 },
    taxi:       { nombre: 'Taxi / Sedán',      largo: 4.35, ancho: 1.78, alto: 1.46, ruedaD: 0.62,  batalla: 2.60 },
    camioneta:  { nombre: 'Camioneta / SUV',   largo: 4.95, ancho: 1.94, alto: 1.82, ruedaD: 0.74,  batalla: 2.95 },
    bus:        { nombre: 'Bus urbano / Alim.',largo: 10.8, ancho: 2.50, alto: 3.10, ruedaD: 0.96,  batalla: 5.50 },
    metroplus:  { nombre: 'Metroplús Artic.',  largo: 18.0, ancho: 2.55, alto: 3.25, ruedaD: 0.98,  batalla: 6.20 },
    metroVagon: { nombre: 'Coche Metro (×1)',  largo: 23.0, ancho: 3.20, alto: 3.85, ruedaD: 0.86,  viaductoLibre: 6.80 },
  },

  /* Geometría urbana y arquitectura */
  urbano: {
    carrilVehicular: 3.35,
    ciclorrutaBidi: 2.80,
    andenAlto: 0.18,
    andenAnchoMin: 2.20,
    pisoResidencial: 2.95,
    pisoComercialPB: 4.00,
    posteLuzAlto: 7.50,
    semaforoAlto: 5.40,
    bancaLargo: 1.80,
    bancaAlto: 0.46,
    estacionEnciclaAncho: 12.0,
    estacionEnciclaFondo: 3.4,
    estacionEnciclaAlto: 2.65,
  },

  /* Umbrales físicos de parkour (calibrados a persona de 1,72 m) */
  parkour: {
    velCaminar: 2.0,
    velTrotar: 4.6,
    velSprint: 7.2,
    velSkateMax: 13.5,
    velBiciMax: 11.0,
    gravedad: 22.0,
    saltoVelPie: 7.8,
    saltoVelSkate: 8.6,
    coyoteSeg: 0.12,
    bufferSaltoSeg: 0.14,
    bovedaMinAlto: 0.45,
    bovedaMaxAlto: 1.25,
    trepadoMaxAlto: 2.35,
    caidaRodadaAlto: 2.20,
  },
});

/**
 * Valida las relaciones de escala críticas entre persona, vehículos y entorno.
 * Útil en pruebas automatizadas para impedir regresiones de proporción.
 */
export function validarProporcionesSI() {
  const p = ESCALA.persona;
  const v = ESCALA.vehiculos;
  const errores = [];
  if (p.alto < 1.65 || p.alto > 1.85) errores.push(`Estatura fuera de rango humano: ${p.alto}`);
  if (v.taxi.alto >= p.alto) errores.push(`Sedán/taxi (${v.taxi.alto}m) debe ser más bajo que una persona de pie (${p.alto}m)`);
  if (v.bus.alto <= p.alto * 1.5) errores.push(`Bus (${v.bus.alto}m) debe superar 1.5× la estatura humana`);
  if (v.metroVagon.alto <= v.bus.alto) errores.push(`Vagón Metro (${v.metroVagon.alto}m) debe ser más alto que el bus`);
  if (v.encicla.largo >= v.moto.largo || v.moto.largo >= v.taxi.largo) errores.push('Orden de largos bici < moto < taxi roto');
  if (v.taxi.largo >= v.bus.largo || v.bus.largo >= v.metroplus.largo) errores.push('Orden de largos taxi < bus < metroplus roto');
  if (ESCALA.urbano.carrilVehicular <= v.bus.ancho) errores.push('Carril vehicular más angosto que un bus');
  return errores;
}
