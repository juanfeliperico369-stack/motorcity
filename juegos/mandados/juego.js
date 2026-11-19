/* =====================================================================
   MANDADOS · minijuego de prueba de Motor City (todo lo del motor, junto y jugable)
   Mundo: Guatapé craqueado de datos abiertos (geo/territorio.py) o un mundo nuevo generado (MC.Generador).
   Usa: vistas + pixel, controles, cámara, física, vehículos diseñados en el taller (con gasolina), persona con
   biología (energía, agua, calor), economía (libro contable en pesos), misiones con tiempo, interiores procedurales
   para entregar en la mano, población con rutinas, tráfico, un perro que te sigue, clima global, música adaptativa,
   interfaz integrada y minimapa.
   ===================================================================== */
const $ = s => document.querySelector(s), cop = c => MC.Dinero.formato(c, 'COP');
const PRECIOS = { agua: 250000, gasolinaL: 430000, scooter: 4000000, moto: 12000000, carro: 30000000 };   // centavos (valores de juego; la gasolina, cerca del precio de referencia por litro)
let mundo = null, generado = false;
async function abrir(gen) {
  $('#estado').textContent = gen ? 'Generando un mundo nuevo…' : 'Abriendo Guatapé…'; await new Promise(r => setTimeout(r, 30));
  MC.ciudadBase = MC_CIUDAD_BASE;
  if (gen) { mundo = MC.Generador.mundo({ semilla: (Math.random() * 1e6) | 0, ancho: 448, alto: 448, tipo: Math.random() < .5 ? 'valle' : 'isla', pueblos: 3, lat: 6.2 }); generado = true; }
  else { const cfg = Object.assign({}, MC_CIUDAD, { zonas: Object.assign({}, MC.ZONAS_BASE, MC_CIUDAD.zonas || {}) }); mundo = await MC.Mundo.cargar(MC_MUNDO, cfg); }
  $('#estado').textContent = 'Armando las calles…'; await new Promise(r => setTimeout(r, 30)); mundo.red('rueda');
  $('#portada').hidden = true; jugar();
}
$('#jugar').onclick = () => abrir(false); $('#generado').onclick = () => abrir(true);
$('#estado').textContent = 'Listo para jugar';

function jugar() {
  const cv = $('#cv'), g = cv.getContext('2d', { alpha: false }), M = mundo, ui = MC.UI.crear(document.body, { tema: 'motorcity' });
  const lat = generado ? 6.2 : 6.234, centro = generado ? M.generado.pueblos[0] : M.geoAMetros(6.2338, -75.1592), c0 = M.viaCercana(centro.x, centro.y, 400) || { x: centro.x, y: centro.y, ang: 0 };
  const reloj = new MC.Reloj({ vel: 1.5 }), clima = new MC.ClimaGlobal({ lat, alt: M.cota(c0.x, c0.y) }), vistas = new MC.Vistas(M), camara = new MC.Camara({ zoom: 3.4 });
  const yo = new MC.Seres.Persona({ edad: 24, forma: .55, semilla: (Math.random() * 1e6) | 0 }), cuerpo = new MC.Cuerpo(M, { x: c0.x, y: c0.y, a: c0.ang, veh: 'bici' }); cuerpo.clima = clima;
  const jugador = { cuerpo, aspecto: yo.aspecto({ casco: 2, camisa: 0 }) }, libro = new MC.Libro(); libro.mover('mundo', 'jugador', 1000000, 'Plata para empezar', false);
  /* vehículos diseñados con ingeniería real (taller) */
  const dMoto = MC.Taller.disenar({ id: 'moto_mandados', n: 'Moto de mandados', tipo: 'moto', masa: 115, potenciaKW: 7.5, parNm: 10, cd: .6, area: .8, crr: .015, mu: 1, marchas: [2.8, 1.9, 1.4, 1.1, .9], final: 3, rueda: .3, tanqueL: 12, color: '#ff7043' });
  const dCarro = MC.Taller.disenar({ id: 'carro_mandados', n: 'Carro de mandados', masa: 1050, potenciaKW: 63, parNm: 120, cd: .33, area: 2, tanqueL: 40, color: '#00e5ff' });
  MC.Taller.registrar(dMoto, { vmax: Math.min(dMoto.vmax, 22) }); MC.Taller.registrar(dCarro, { vmax: Math.min(dCarro.vmax, 25) });
  const garaje = { bici: { n: '🚲 Bici', tiene: true }, scooter: { n: '🛵 Scooter eléctrico', precio: PRECIOS.scooter }, moto_mandados: { n: '🏍️ Moto (' + Math.round(dMoto.vmax * 3.6) + ' km/h, ' + dMoto.consumo.toFixed(1) + ' L/100 km)', precio: PRECIOS.moto, tanque: 12, consumo: dMoto.consumo }, carro_mandados: { n: '🚗 Carro (0–100 en ' + dCarro.ceroCien.toFixed(1) + ' s)', precio: PRECIOS.carro, tanque: 40, consumo: dCarro.consumo }, pie: { n: '🚶 A pie', tiene: true } };
  const tanque = { moto_mandados: 6, carro_mandados: 20 };
  const E = { mundo: M, camara, reloj, clima, transporte: null, jugador, t: 0, vehiculos: [], trafico: [], peatones: [], extras: [], cables: [] };
  const pobl = new MC.Poblacion(M, { n: 36, centro: c0, radio: 900, semilla: 4 }), trafico = new MC.Trafico(M, { n: 10, peatones: 0, red: 'rueda', radio: 400 });
  const perro = MC.Seres.Animal.crear('perro_criollo', 3); perro.x = c0.x - 3; perro.y = c0.y; perro.a = 0; perro.v = 0;
  E.extras.push({ get x() { return perro.x; }, get y() { return perro.y; }, dibujar(gg, pr, z, P) { const [sx, sy] = pr(perro.x, perro.y, 0); if (P.hk < .1) { gg.save(); gg.translate(sx, sy); gg.rotate(perro.a + P.yaw); gg.fillStyle = perro.colores[0]; gg.beginPath(); gg.ellipse(0, 0, z * .45, z * .17, 0, 0, MC.TAU); gg.fill(); gg.beginPath(); gg.arc(z * .45, 0, z * .13, 0, MC.TAU); gg.fill(); gg.restore(); } else MC.arte.f('animalLado')(gg, perro, sx, sy, z * P.hk * 1.4, Math.cos(perro.a + P.yaw) >= 0 ? 1 : -1, E.t, perro.v); } });
  /* lugares de los mandados: los que tienen nombre y quedan cerca de una vía */
  const sitios = M.lugares.filter(l => M.viaCercana(l.x, l.y, 45) && M.suelo(l.x, l.y) !== MC.TT.WATER).slice(0, 200);
  if (sitios.length < 4) for (const e of M.edificiosEn(c0.x - 800, c0.y - 800, c0.x + 800, c0.y + 800).slice(0, 60)) sitios.push({ nombre: 'Casa ' + (sitios.length + 1), x: e.x, y: e.y, dibujo: 'casa' });
  const tiendas = M.lugares.filter(l => /store|shop|super|market|tienda|restaurant|cafe|bakery|food/i.test(l.dibujo || '')), gasolineras = M.lugares.filter(l => /gas|fuel/i.test(l.dibujo || ''));
  let mision = null, entregado = false, interior = null, dinero0 = 0, hechos = 0;
  const nuevaMision = () => {
    const az = Math.random, o = sitios[(az() * sitios.length) | 0]; let d = null; for (let k = 0; k < 40 && !d; k++) { const q = sitios[(az() * sitios.length) | 0], dist = Math.hypot(q.x - o.x, q.y - o.y); if (q !== o && dist > 250 && dist < 1600) d = q; } if (!d) d = sitios[(sitios.indexOf(o) + 1) % sitios.length];
    const dist = Math.hypot(d.x - o.x, d.y - o.y) + Math.hypot(o.x - cuerpo.x, o.y - cuerpo.y), masa = +(0.5 + az() * 7).toFixed(1), limite = Math.round(dist / 3.4 + 60), pago = Math.round((300000 + dist * 600) / 100) * 100;
    entregado = false; const paquete = { id: 'paquete', n: 'Paquete', masa, volumen: masa * 3 };
    mision = new MC.Mision({ titulo: 'De ' + o.nombre + ' a ' + d.nombre, limite, premio: pago, libro, cuenta: 'jugador', pasos: [{ tipo: 'ir', x: o.x, y: o.y, radio: 22, texto: 'Recoge en ' + o.nombre }, { tipo: 'esperar', x: o.x, y: o.y, radio: 22, seg: 1.2, texto: 'Recogiendo…' }, { tipo: 'ir', x: d.x, y: d.y, radio: 22, texto: 'Lleva a ' + d.nombre }, { tipo: 'condicion', x: d.x, y: d.y, radio: 40, cond: () => entregado, texto: 'Entra y entrega en la mano 🚪' }] });
    mision.paquete = paquete; mision.origen = o; mision.destino = d; mision.pago = pago; dinero0 = libro.saldo('jugador');
    ui.aviso('📦 Mandado nuevo: ' + o.nombre + ' → ' + d.nombre + ' · ' + cop(pago) + ' · ' + masa + ' kg', 3500);
  };
  MC.on('mision', ev => { if (ev.estado === 'cumplida') { hechos++; ui.aviso('✅ ¡Entregado! +' + cop(mision.pago) + ' · llevas ' + hechos, 3000); setTimeout(nuevaMision, 2500); } else if (ev.estado === 'fallida') { ui.aviso('⏰ Se acabó el tiempo. Pagan la mitad.', 3000); libro.mover('mundo', 'jugador', mision.pago / 2, 'Mandado tarde', false); setTimeout(nuevaMision, 2500); } });
  /* controles e interfaz */
  const ctl = new MC.Controles(cv, { alGesto: q => { if (q.tipo !== 'toque') camara.gesto(q); }, alTecla: k => tecla(k) });
  const VIST = ['cenital', 'ciudad3d', 'maqueta', 'pano', 'tercera']; let iv = 0, seguir = null;
  const ponVista = id => { const v = vistas.usar(id, E); if (v.tipo === 'pano') { try { seguir = new MC.SeguirRuta(M, cuerpo, { red: 'rueda' }); } catch (e) { seguir = null; } } else seguir = null; ui.aviso(v.icon + ' ' + v.n); };
  const tecla = k => { if (k === 'KeyV') { iv = (iv + 1) % VIST.length; ponVista(VIST[iv]); } else if (k === 'KeyP') vistas.pixel = !vistas.pixel; else if (k === 'KeyM') musica(); else if (k === 'KeyE') entrar(); else if (k === 'KeyB') menuVeh(); };
  ui.boton({ id: 'vista', icono: '🗺️', texto: 'Vista', al: () => tecla('KeyV') }); ui.boton({ id: 'pixel', icono: '👾', texto: 'Pixel', al: () => tecla('KeyP') }); ui.boton({ id: 'veh', icono: '🚲', texto: 'Vehículo', al: () => menuVeh() }); ui.boton({ id: 'musica', icono: '🎵', texto: 'Música', al: () => musica() });
  const bAccion = ui.boton({ id: 'accion', icono: '🚪', texto: 'Entrar', al: () => entrar() }); bAccion.hidden = true;
  const bComprar = ui.boton({ id: 'comprar', icono: '💧', texto: 'Agua', al: () => comprar() }); bComprar.hidden = true;
  ui.minimapa(vistas);
  const menuVeh = () => ui.menu('Garaje', Object.entries(garaje).map(([id, G]) => ({ id, texto: G.n + (G.tiene ? '' : ' · ' + cop(G.precio)) + (cuerpo.veh.id === id ? ' ✓' : '') })), id => { const G = garaje[id]; if (!G.tiene) { if (!libro.mover('jugador', 'tienda', G.precio, 'Compra: ' + G.n)) return ui.aviso('Te faltan ' + cop(G.precio - libro.saldo('jugador'))); G.tiene = true; ui.aviso('🎉 Compraste ' + G.n); } cuerpo.setVeh(id); if (seguir) seguir.v = Math.min(seguir.v, cuerpo.vmax()); });
  let tocando = null, temaI = 0; const TEMAS = [null, ...Object.keys(MC.Musica.CLASICOS)];
  const musica = () => { if (tocando) { MC.Musica.parar(); tocando = null; ui.aviso('🔇 Música apagada'); return; } temaI = (temaI + 1) % TEMAS.length; const A = MC.Musica.adaptar({ velocidad: Math.abs(cuerpo.v), hora: reloj.hora, clima }); tocando = MC.Musica.tocar({ estilo: A.estilo, tema: TEMAS[temaI], energia: A.energia, compases: 16, semilla: (Math.random() * 99) | 0 }); if (tocando) ui.aviso('🎵 ' + tocando.pieza.titulo + (TEMAS[temaI] ? ' (' + MC.Musica.CLASICOS[TEMAS[temaI]].autor + ', dominio público)' : '')); };
  const cercaDe = (L, r) => L.find(l => Math.hypot(l.x - cuerpo.x, l.y - cuerpo.y) < r);
  const comprar = () => { const V = cuerpo.veh.id; if (tanque[V] != null && (cercaDe(gasolineras, 40) || !gasolineras.length && cercaDe(tiendas, 30))) { const L = garaje[V].tanque - tanque[V], c = Math.round(L * PRECIOS.gasolinaL); if (libro.mover('jugador', 'gasolinera', c, 'Gasolina')) { tanque[V] = garaje[V].tanque; ui.aviso('⛽ Tanque lleno: ' + L.toFixed(1) + ' L · ' + cop(c)); } else ui.aviso('No te alcanza la plata'); return; } if (libro.mover('jugador', 'tienda', PRECIOS.agua, 'Agua')) { yo.estado.hidratacion = Math.min(1, yo.estado.hidratacion + .5); yo.estado.energia = Math.min(1, yo.estado.energia + .15); ui.aviso('💧 Agua: ' + cop(PRECIOS.agua)); } else ui.aviso('No te alcanza para el agua'); };
  /* entregar adentro: el interior procedural del edificio del destino */
  const entrar = () => { if (!mision || mision.paso !== 3) return; const d = mision.destino, ed = M.edificiosEn(d.x - 45, d.y - 45, d.x + 45, d.y + 45).sort((a, b) => Math.hypot(a.x - d.x, a.y - d.y) - Math.hypot(b.x - d.x, b.y - d.y))[0]; if (!ed) { entregado = true; return; } abrirInterior(ed); };
  function abrirInterior(ed) {
    const P = MC.Interiores.generar(ed), capa = $('#interior'), ic = $('#icv'), ig = ic.getContext('2d'), cuartos = P.cuartos.filter(c => c.w > 1.5 && c.h > 1.5), dest = cuartos[cuartos.length - 1] || P.cuartos[0], ent = P.puertas.find(p => p.entrada);
    const yoI = { x: ent.x, y: .6, a: Math.PI / 2, fase: 0 }, ctlI = new MC.Controles(ic, {}), quien = MC.Personaje.azar((Math.random() * 1e5) | 0); capa.hidden = false; interior = true; ui.aviso('🚪 Busca a quien recibe (' + dest.tipo + ')');
    const paso = () => { if (!interior) return; requestAnimationFrame(paso); const W = ic.width = innerWidth * Math.min(2, devicePixelRatio || 1), H = ic.height = innerHeight * Math.min(2, devicePixelRatio || 1), esc = Math.min(W / (P.ancho + 3), H / (P.fondo + 3)), ox = (W - P.ancho * esc) / 2, oy = (H - P.fondo * esc) / 2, e = ctlI.leer();
      if (e.stick.m > .1) { const v = 2.2 / 60; const nx = yoI.x + e.stick.x * v * 2, ny = yoI.y + e.stick.y * v * 2; if (!P.solido(nx, yoI.y)) yoI.x = nx; if (!P.solido(yoI.x, ny)) yoI.y = ny; yoI.a = Math.atan2(e.stick.y, e.stick.x); yoI.fase += .25; }
      ig.fillStyle = '#141822'; ig.fillRect(0, 0, W, H); MC.Interiores.dibujar(ig, P, ox, oy, esc);
      const qx = dest.x + dest.w / 2, qy = dest.y + dest.h / 2, J = MC.Personaje.pose('quieto', 0); MC.arte.f('personajeArriba')(ig, J, quien, ox + qx * esc, oy + qy * esc, esc, Math.PI); ig.fillStyle = '#ffc23a'; ig.font = '800 ' + Math.round(esc * .55) + 'px system-ui'; ig.textAlign = 'center'; ig.fillText('📦 aquí', ox + qx * esc, oy + (qy - .7) * esc);
      const J2 = MC.Personaje.pose(e.stick.m > .1 ? 'camina' : 'quieto', yoI.fase); J2.fase = yoI.fase; MC.arte.f('personajeArriba')(ig, J2, jugador.aspecto, ox + yoI.x * esc, oy + yoI.y * esc, esc, yoI.a);
      if (Math.hypot(yoI.x - qx, yoI.y - qy) < 1.1) { entregado = true; interior = false; capa.hidden = true; }
      if (yoI.y < .25) { interior = false; capa.hidden = true; } };
    requestAnimationFrame(paso);
  }
  /* tamaño */
  let W = 0, H = 0; const ajustar = () => { const d = Math.min(2, devicePixelRatio || 1); W = cv.width = Math.round(innerWidth * d); H = cv.height = Math.round(innerHeight * d); vistas.dpr = d; }; addEventListener('resize', ajustar); ajustar();
  ponVista('cenital'); nuevaMision(); camara.x = cuerpo.x; camara.y = cuerpo.y;
  /* ciclo */
  let t0 = performance.now(), hud = 0, adapt = 0;
  const cuadro = ahora => {
    requestAnimationFrame(cuadro); const dt = Math.min(.1, (ahora - t0) / 1000); t0 = ahora; if (interior) return; E.t += dt;
    reloj.avanzar(dt); clima.actualizar(reloj, dt); E.cielo = MC.Cielo.en(reloj.fecha, reloj.hora, clima);
    const ent = ctl.leer(), V = cuerpo.veh, humano = V.clase === 'pie' || (V.clase === 'rueda' && !V.electrico), sinGas = tanque[V.id] != null && tanque[V.id] <= 0;
    cuerpo.escala = humano ? .55 + .45 * yo.rendimiento : sinGas ? .08 : 1;
    const x0 = cuerpo.x, y0 = cuerpo.y;
    if (vistas.actual.tipo === 'pano' && seguir) { seguir.paso(dt, { acel: Math.abs(ent.stick.x) > .2 ? ent.stick.x * (vistas.pano.lado < 0 ? 1 : -1) : ent.acel, salto: ent.salto, turbo: ent.turbo }); E.pano = { trazo: seguir.trazo, s: seguir.s, id: seguir.id }; }
    else { const s = ent.stick, c = Math.cos(camara.yaw), sn = Math.sin(camara.yaw), gl = vistas.actual.tipo === 'gl'; cuerpo.actualizar(dt, gl ? { acel: -s.y || ent.acel, giro: s.x || ent.giro, salto: ent.salto, turbo: ent.turbo } : { dir: s.m > .08 ? { x: s.x * c + s.y * sn, y: -s.x * sn + s.y * c, m: s.m } : null, salto: ent.salto, turbo: ent.turbo, correr: s.m > .92 }); }
    const ds = Math.hypot(cuerpo.x - x0, cuerpo.y - y0); if (tanque[V.id] != null) tanque[V.id] = Math.max(0, tanque[V.id] - ds * garaje[V.id].consumo / 100 / 1000 * 1.4);
    if (mision && mision.paquete) { const carga = mision.paso >= 2 && mision.estado === 'activa'; cuerpo.escala *= carga ? MC.clamp(1 - mision.paquete.masa / (V.clase === 'pie' ? 25 : V.clase === 'rueda' ? 60 : 900), .5, 1) : 1; }
    yo.vivir(dt * 6, cuerpo.estado || 'quieto', Math.abs(cuerpo.v), clima);
    if (mision) mision.actualizar(dt, cuerpo);
    camara.actualizar(dt, { x: cuerpo.x, y: cuerpo.y, z: cuerpo.alturaSuelo, a: cuerpo.a, v: cuerpo.v, zCuerpo: cuerpo.z });
    /* el perro te sigue (dirección de Reynolds: llegar con separación) */
    const f = MC.IA.llegar([perro.x, perro.y], [cuerpo.x - Math.cos(cuerpo.a) * 3, cuerpo.y - Math.sin(cuerpo.a) * 3], Math.min(perro.vmax, Math.abs(cuerpo.v) + 3), 4); perro.x += f[0] * dt; perro.y += f[1] * dt; perro.v = Math.hypot(f[0], f[1]); if (perro.v > .2) perro.a = Math.atan2(f[1], f[0]);
    E.peatones = pobl.paso(dt, reloj, cuerpo.x, cuerpo.y, 420); E.trafico = trafico.paso(dt, cuerpo.x, cuerpo.y, reloj.seg, vistas.calidad);
    vistas.dibujar(g, W, H, E, dt);
    if ((adapt += dt) > 20 && tocando) { adapt = 0; const A = MC.Musica.adaptar({ velocidad: Math.abs(cuerpo.v), hora: reloj.hora, clima }); if (A.estilo !== tocando.pieza.titulo.split(' · ').pop()) tocando = MC.Musica.tocar({ estilo: A.estilo, tema: TEMAS[temaI], energia: A.energia, compases: 16 }); }
    if ((hud -= dt) <= 0) { hud = .25;
      ui.ficha('hora', '🕐 ' + reloj.texto()); ui.ficha('clima', clima.texto()); ui.ficha('plata', '💰 ' + cop(libro.saldo('jugador'))); ui.ficha('lugar', '📍 ' + (M.calle(cuerpo.x, cuerpo.y) || M.meta.nombre));
      ui.velocidad(cuerpo.v, V.icon || ''); ui.barra('energia', '⚡ Energía', yo.estado.energia); ui.barra('agua', '💧 Agua', yo.estado.hidratacion); if (tanque[V.id] != null) ui.barra('gas', '⛽ Gasolina', tanque[V.id] / garaje[V.id].tanque);
      const P = mision && mision.actual; ui.mision(mision ? '<b>📦 ' + mision.def.titulo + '</b><br>' + (P ? P.texto : '') + ' · ⏱ ' + Math.ceil(mision.restante) + ' s · ' + (P && P.x != null ? Math.round(Math.hypot(P.x - cuerpo.x, P.y - cuerpo.y)) + ' m' : '') : '');
      bAccion.hidden = !(mision && mision.paso === 3); bComprar.hidden = !(cercaDe(tiendas, 30) || (tanque[V.id] != null && cercaDe(gasolineras, 40))); bComprar.firstChild.textContent = tanque[V.id] != null && cercaDe(gasolineras, 40) ? '⛽' : '💧';
      ui.pintarMinimapa(cuerpo.x, cuerpo.y, camara.yaw, P && P.x != null ? [{ x: P.x, y: P.y, color: '#ffc23a' }] : []);
      window.MANDADOS = { mundo: M, cuerpo, yo, libro, mision, reloj, clima, vistas, hechos, generado, entregar: () => { entregado = true; interior = false; $('#interior').hidden = true; } }; }
  };
  requestAnimationFrame(cuadro);
}
