/* =====================================================================
   INTERIORES PROCEDURALES · cualquier edificio del mundo se puede abrir por dentro
   - El plano sale de la huella del edificio (su rectángulo orientado) y de su uso: casa (con el patio de las casas
     paisas), apartamentos, local comercial, oficina, iglesia, colegio, bodega.
   - Partición binaria (BSP) guiada por un programa de cuartos con áreas reales; puertas entre cuartos vecinos de modo
     que todo queda conectado desde la entrada (árbol de expansión); ventanas en los muros de afuera.
   - Muebles con medidas reales contra los muros y con espacio para pasar (cama 1,4×1,9 m, nevera 0,7×0,7 m…).
   - Choques para caminar adentro (`solido`), y dibujo de planta para la vista cenital y el pixel.
   Determinista: el mismo edificio tiene siempre el mismo interior.
   ===================================================================== */
const PROGRAMAS = {
  casa: [['sala', 18], ['comedor', 10], ['cocina', 8], ['alcoba', 11], ['alcoba', 9], ['bano', 4], ['patio', 9], ['alcoba', 9], ['ropas', 4]],
  apartamento: [['sala', 16], ['cocina', 7], ['alcoba', 10], ['alcoba', 8], ['bano', 4], ['balcon', 4]],
  comercio: [['local', 45], ['bodega', 12], ['bano', 3], ['oficina', 8]],
  oficina: [['recepcion', 14], ['oficina', 12], ['oficina', 12], ['sala_juntas', 16], ['cocineta', 6], ['bano', 4], ['bano', 4]],
  iglesia: [['nave', 160], ['altar', 30], ['sacristia', 14], ['bano', 4]],
  colegio: [['aula', 48], ['aula', 48], ['aula', 48], ['rectoria', 14], ['bano', 8], ['patio', 60]],
  bodega: [['bodega', 200], ['oficina', 12], ['bano', 4]]
};
const PISO_DE = { sala: '#d6b48a', comedor: '#d6b48a', alcoba: '#c49a6c', cocina: '#e8e2d4', bano: '#cfe3ea', patio: '#a8b89a', ropas: '#e0dbcf', balcon: '#cfc6b5', local: '#e6e0d2', bodega: '#bdb8ad', oficina: '#d0c8b8', recepcion: '#e8e2d4', sala_juntas: '#c9b391', cocineta: '#e8e2d4', nave: '#d9c9a8', altar: '#b5542f', sacristia: '#c9b391', aula: '#d8d0bc', rectoria: '#c9b391', pasillo: '#d9d2c2' };
const MUEBLES = { sala: [['sofa', 2.1, .9], ['mesa_centro', 1, .6], ['tv', 1.4, .4], ['matera', .5, .5]], comedor: [['comedor', 1.6, .9]], cocina: [['estufa', .6, .6], ['nevera', .7, .7], ['lavaplatos', 1.2, .6], ['mesón', 1.6, .6]], alcoba: [['cama', 1.4, 1.9], ['closet', 1.6, .6], ['mesa_noche', .45, .45]], bano: [['inodoro', .4, .65], ['lavamanos', .5, .45], ['ducha', .9, .9]], patio: [['matera', .5, .5], ['matera', .5, .5], ['lavadero', .8, .6]], ropas: [['lavadora', .6, .6]], balcon: [['matera', .5, .5]], local: [['mostrador', 2.4, .7], ['estante', 2, .5], ['estante', 2, .5], ['nevera', .8, .7]], bodega: [['estante', 2.4, .8], ['estante', 2.4, .8], ['estiba', 1.2, 1]], oficina: [['escritorio', 1.4, .7], ['silla', .55, .55], ['archivador', .9, .5]], recepcion: [['mostrador', 2, .7], ['sofa', 1.8, .8]], sala_juntas: [['mesa_juntas', 3, 1.2]], cocineta: [['mesón', 1.6, .6], ['nevera', .7, .7]], nave: [['banca', 3, .5], ['banca', 3, .5], ['banca', 3, .5], ['banca', 3, .5], ['banca', 3, .5], ['banca', 3, .5]], altar: [['altar', 2.4, 1]], sacristia: [['closet', 1.6, .6]], aula: [['tablero', 3, .15], ['pupitre', .7, .5], ['pupitre', .7, .5], ['pupitre', .7, .5], ['pupitre', .7, .5], ['pupitre', .7, .5], ['pupitre', .7, .5]], rectoria: [['escritorio', 1.4, .7]] };
const Interiores = {
  PROGRAMAS, PISO_DE, MUEBLES,
  programaDe(e) { const k = e.clase || ''; if (k === 'iglesia') return 'iglesia'; if (k === 'educativo') return 'colegio'; if (k === 'nave' || k === 'parqueadero' || k === 'techo') return 'bodega'; if (k === 'comercio') return 'comercio'; if (k === 'civico' || k === 'salud' || k === 'transporte') return 'oficina'; if (k === 'edificio' || k === 'torre') return 'apartamento'; return 'casa'; },
  /* plano local (metros, origen en una esquina, x a lo largo del edificio) */
  generar(e, op = {}) {
    const r = mulberry32(op.semilla ?? ((e.s || .5) * 1e9 | 0)), W = Math.max(5, (e.hw || 4) * 2), D = Math.max(5, (e.hd || 4) * 2), prog = op.programa || Interiores.programaDe(e), lista = PROGRAMAS[prog].slice();
    const areaT = W * D, sumaP = lista.reduce((a, q) => a + q[1], 0), escala = areaT / sumaP, cuartos = [];
    /* BSP: parte el rectángulo en dos con una proporción que respeta el área pedida de cada lado */
    const partir = (x, y, w, h, items) => {
      if (items.length === 1 || w * h < 8) { cuartos.push({ tipo: items[0][0], x, y, w, h }); for (const extra of items.slice(1)) cuartos.push({ tipo: extra[0], x, y, w: 0, h: 0, sinEspacio: true }); return; }
      const A = items.reduce((a, q) => a + q[1], 0); let mejor = 1, bd = 1e9, acum = 0; for (let i = 1; i < items.length; i++) { acum += items[i - 1][1]; const d = Math.abs(acum / A - .5); if (d < bd) { bd = d; mejor = i; } }
      const izq = items.slice(0, mejor), der = items.slice(mejor), f = izq.reduce((a, q) => a + q[1], 0) / A, porAncho = w >= h ? true : w * 1.2 > h && r() < .3;
      if (porAncho) { const c = Math.max(1.6, Math.min(w - 1.6, w * f)); partir(x, y, c, h, izq); partir(x + c, y, w - c, h, der); }
      else { const c = Math.max(1.6, Math.min(h - 1.6, h * f)); partir(x, y, w, c, izq); partir(x, y + c, w, h - c, der); }
    };
    partir(0, 0, W, D, lista.map(q => [q[0], q[1] * escala]));
    const C2 = cuartos.filter(c => !c.sinEspacio);
    /* vecinos: comparten un muro de al menos 0,9 m (cabe una puerta) */
    const muro = (a, b) => { const e2 = .01; if (Math.abs(a.x + a.w - b.x) < e2 || Math.abs(b.x + b.w - a.x) < e2) { const y0 = Math.max(a.y, b.y), y1 = Math.min(a.y + a.h, b.y + b.h); if (y1 - y0 >= .9) return { x: Math.abs(a.x + a.w - b.x) < e2 ? a.x + a.w : a.x, y: (y0 + y1) / 2, vertical: true, largo: y1 - y0 }; } if (Math.abs(a.y + a.h - b.y) < e2 || Math.abs(b.y + b.h - a.y) < e2) { const x0 = Math.max(a.x, b.x), x1 = Math.min(a.x + a.w, b.x + b.w); if (x1 - x0 >= .9) return { x: (x0 + x1) / 2, y: Math.abs(a.y + a.h - b.y) < e2 ? a.y + a.h : a.y, vertical: false, largo: x1 - x0 }; } return null; };
    /* entrada: el cuarto público más cercano a la fachada (y = 0); puertas por un árbol de expansión desde ahí */
    const pub = ['sala', 'local', 'recepcion', 'nave', 'aula', 'bodega', 'pasillo'], ent = C2.slice().sort((a, b) => (a.y - b.y) || (pub.includes(b.tipo) - pub.includes(a.tipo)))[0], puertas = [{ x: ent.x + ent.w / 2, y: 0, vertical: false, ancho: prog === 'iglesia' ? 2.4 : 1.1, entrada: true }], dentro = new Set([ent]);
    while (dentro.size < C2.length) { let par = null; for (const a of dentro) { for (const b of C2) { if (dentro.has(b)) continue; const m2 = muro(a, b); if (m2 && (!par || (b.tipo === 'bano') < (par.b.tipo === 'bano'))) par = { a, b, m: m2 }; } } if (!par) break; dentro.add(par.b); puertas.push({ x: par.m.x, y: par.m.y, vertical: par.m.vertical, ancho: .9 }); }
    /* ventanas en los muros de afuera de cuartos con luz (no en baños ni bodegas) */
    const ventanas = []; for (const c of C2) { if (['bano', 'bodega', 'ropas'].includes(c.tipo)) continue; if (c.y < .01 && c !== ent) ventanas.push({ x: c.x + c.w / 2, y: 0, vertical: false, ancho: Math.min(1.8, c.w * .5) }); if (c.y + c.h > D - .01) ventanas.push({ x: c.x + c.w / 2, y: D, vertical: false, ancho: Math.min(1.8, c.w * .5) }); if (c.x < .01) ventanas.push({ x: 0, y: c.y + c.h / 2, vertical: true, ancho: Math.min(1.5, c.h * .4) }); if (c.x + c.w > W - .01) ventanas.push({ x: W, y: c.y + c.h / 2, vertical: true, ancho: Math.min(1.5, c.h * .4) }); }
    /* muebles contra los muros, sin tapar puertas, con 0,6 m para pasar */
    const muebles = [], libreDePuerta = (x, y, w, h) => puertas.every(p => Math.hypot(clamp(p.x, x, x + w) - p.x, clamp(p.y, y, y + h) - p.y) > 1.1);
    for (const c of C2) { const L = (MUEBLES[c.tipo] || []).slice(); let i = 0;
      for (const [tipo, mw, mh] of L) { let puesto = false; for (let intento = 0; intento < 12 && !puesto; intento++, i++) { const lado = i % 4, rot = lado % 2 === 1, w2 = rot ? mh : mw, h2b = rot ? mw : mh; if (w2 > c.w - .3 || h2b > c.h - .3) continue; const t = r(); let x, y; if (lado === 0) { x = c.x + .1 + t * (c.w - w2 - .2); y = c.y + .1; } else if (lado === 1) { x = c.x + c.w - w2 - .1; y = c.y + .1 + t * (c.h - h2b - .2); } else if (lado === 2) { x = c.x + .1 + t * (c.w - w2 - .2); y = c.y + c.h - h2b - .1; } else { x = c.x + .1; y = c.y + .1 + t * (c.h - h2b - .2); }
          if (tipo === 'banca' || tipo === 'pupitre' || tipo === 'mesa_centro' || tipo === 'comedor' || tipo === 'mesa_juntas' || tipo === 'estiba') { x = c.x + (c.w - w2) / 2 + (r() - .5) * Math.max(0, c.w - w2 - 1.2); y = c.y + .8 + r() * Math.max(0, c.h - h2b - 1.6); }
          const choca = muebles.some(m => x < m.x + m.w + .6 && x + w2 + .6 > m.x && y < m.y + m.h + .6 && y + h2b + .6 > m.y); if (!choca && libreDePuerta(x, y, w2, h2b)) { muebles.push({ tipo, x, y, w: w2, h: h2b, cuarto: c.tipo }); puesto = true; } } } }
    const pisos = Math.max(1, e.pis || 1), plano = { programa: prog, ancho: W, fondo: D, pisos, cuartos: C2, puertas, ventanas, muebles, escaleras: pisos > 1 ? { x: W - 1.3, y: D - 3.2, w: 1.1, h: 3 } : null, edificio: e };
    plano.solido = (x, y) => { if (x < .15 || y < .15 || x > W - .15 || y > D - .15) return !puertas.some(p => p.entrada && Math.abs(p.x - x) < p.ancho / 2 && y < .3); if (muebles.some(m => x > m.x && x < m.x + m.w && y > m.y && y < m.y + m.h && !['tapete', 'ducha'].includes(m.tipo))) return true; for (const c of C2) for (const b of [[c.x, c.y, c.x + c.w, c.y], [c.x, c.y, c.x, c.y + c.h]]) { const vert = b[0] === b[2]; if (vert ? Math.abs(x - b[0]) < .08 && y > b[1] && y < b[3] : Math.abs(y - b[1]) < .08 && x > b[0] && x < b[2]) { if (!puertas.some(p => p.vertical === vert && (vert ? Math.abs(p.x - b[0]) < .1 && Math.abs(p.y - y) < p.ancho / 2 : Math.abs(p.y - b[1]) < .1 && Math.abs(p.x - x) < p.ancho / 2))) return true; } } return false; };
    plano.cuartoEn = (x, y) => C2.find(c => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) || null;
    return plano;
  },
  /* planta vista desde arriba: (x, y) esquina en pantalla, esc px por metro */
  dibujar(g, P, x, y, esc, op = {}) {
    g.save(); g.translate(x, y); g.scale(esc, esc); g.lineJoin = 'round';
    g.fillStyle = '#2b2f38'; g.fillRect(-.25, -.25, P.ancho + .5, P.fondo + .5);
    for (const c of P.cuartos) { g.fillStyle = PISO_DE[c.tipo] || '#d9d2c2'; g.fillRect(c.x + .06, c.y + .06, c.w - .12, c.h - .12); if (c.tipo === 'bano' || c.tipo === 'cocina') { g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = .03; for (let q = .3; q < c.w; q += .3) { g.beginPath(); g.moveTo(c.x + q, c.y); g.lineTo(c.x + q, c.y + c.h); g.stroke(); } } }
    g.strokeStyle = '#2b2f38'; g.lineWidth = .14; for (const c of P.cuartos) g.strokeRect(c.x, c.y, c.w, c.h);
    for (const p of P.puertas) { g.fillStyle = PISO_DE.pasillo; if (p.vertical) g.fillRect(p.x - .1, p.y - p.ancho / 2, .2, p.ancho); else g.fillRect(p.x - p.ancho / 2, p.y - .1, p.ancho, .2); g.strokeStyle = 'rgba(43,47,56,.5)'; g.lineWidth = .04; g.beginPath(); if (p.vertical) g.arc(p.x, p.y - p.ancho / 2, p.ancho, 0, Math.PI / 2); else g.arc(p.x - p.ancho / 2, p.y, p.ancho, 0, Math.PI / 2); g.stroke(); }
    for (const v of P.ventanas) { g.fillStyle = '#8cbedc'; if (v.vertical) g.fillRect(v.x - .1, v.y - v.ancho / 2, .2, v.ancho); else g.fillRect(v.x - v.ancho / 2, v.y - .1, v.ancho, .2); }
    const COL = { cama: '#f2efe8', sofa: '#6d8fb3', closet: '#8d6e63', estufa: '#3b3d42', nevera: '#e9eef3', inodoro: '#ffffff', ducha: '#b7d7e6', lavamanos: '#ffffff', mostrador: '#a1887f', estante: '#8d6e63', banca: '#8d6e63', altar: '#efe8d8', escritorio: '#a1887f', comedor: '#8d6e63', tv: '#1d1f24', matera: '#4a9444', pupitre: '#a1887f', tablero: '#2e5d3a' };
    for (const m of P.muebles) { g.fillStyle = COL[m.tipo] || '#bcaaa4'; g.fillRect(m.x, m.y, m.w, m.h); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = .03; g.strokeRect(m.x, m.y, m.w, m.h); if (m.tipo === 'cama') { g.fillStyle = '#c43a26'; g.fillRect(m.x + m.w * .08, m.y + m.h * .3, m.w * .84, m.h * .62); } }
    if (P.escaleras) { const s2 = P.escaleras; g.fillStyle = '#bdb8ad'; g.fillRect(s2.x, s2.y, s2.w, s2.h); g.strokeStyle = '#7d7f84'; g.lineWidth = .04; for (let q = 0; q < s2.h; q += .28) { g.beginPath(); g.moveTo(s2.x, s2.y + q); g.lineTo(s2.x + s2.w, s2.y + q); g.stroke(); } }
    if (op.etiquetas !== false && esc > 14) { g.fillStyle = 'rgba(20,24,32,.55)'; g.font = '600 ' + (.42) + 'px system-ui'; g.textAlign = 'center'; for (const c of P.cuartos) if (c.w > 1.8) g.fillText({ bano: 'baño', sala_juntas: 'juntas', recepcion: 'recepción', balcon: 'balcón', rectoria: 'rectoría', sacristia: 'sacristía' }[c.tipo] || c.tipo, c.x + c.w / 2, c.y + c.h / 2); }
    g.restore();
  }
};
MC.Interiores = Interiores;
