/* =====================================================================
   CHATGPT · Turno Cero 4.7 · guardia de infraestructura EnCicla
   Protección aditiva para no invadir el archivo 60-modos.js de Claude.

   El modo solo puede iniciar si existen 2+ estaciones reales y el origen
   pertenece a esa lista. La ciudad sin estaciones devuelve false sin error.
   En un futuro Claude puede integrar la guardia directamente en el módulo
   y eliminar este archivo al migrar, después de verificar su prueba.
   ===================================================================== */
{
  const iniciarEnCiclaOriginal = Modos.armarEnCicla;
  Modos.armarEnCicla = function armarEnCiclaSeguro(desde) {
    const S = G.M && G.M.transporte && G.M.transporte.encicla;
    if (!Array.isArray(S) || S.length < 2) return false;
    if (desde && (!Number.isFinite(desde.x) ||
                  !Number.isFinite(desde.y) || !S.includes(desde))) return false;
    return iniciarEnCiclaOriginal.call(this, desde);
  };
}
