// Fuente única de tiempos: la leen video.html, check.mjs, retime.js y (vía timeline.json) audio.py.
// Los tiempos start/end/voStart/duration los reescribe retime.js; no editarlos a mano después de grabar la voz.
const TIMELINE = {
  fps: 30,
  bpm: 120,
  duration: 24.5,
  scenes: [
    { id: 'intro', start: 0, end: 3, voStart: 0.2,
      vo: 'Este Buen Fin, en ge y ele…',
      copy: ['Buen Fin'],
      cues: [{ at: 0, type: 'whoosh' }, { at: 0.5, type: 'hit' }, { at: 1.4, type: 'hit' }] },
    { id: 'diez', start: 3, end: 6.5, voStart: 3.2,
      vo: '10% en toda la tienda.',
      copy: ['10%', 'en toda la tienda'],
      cues: [{ at: 0, type: 'whoosh' }, { at: 0.25, type: 'hit' }, { at: 1.2, type: 'whoosh' }, { at: 1.6, type: 'whoosh' }, { at: 2.0, type: 'whoosh' }] },
    { id: 'quince', start: 6.5, end: 11, voStart: 6.7,
      vo: 'Y 15% en perfumes y pantalones seleccionados.',
      copy: ['15%', 'en perfumes y pantalones seleccionados', 'Descuentos no acumulables'],
      cues: [{ at: 0, type: 'whoosh' }, { at: 0.25, type: 'hit' }, { at: 1.4, type: 'whoosh' }, { at: 1.9, type: 'whoosh' }] },
    { id: 'fechas', start: 11, end: 16, voStart: 11.2,
      vo: 'Del 13 al 16 de noviembre, en nuestras tiendas de Colima, en línea y por WhatsApp.',
      copy: ['Del 13 al 16 de noviembre', 'Tiendas en Colima · En línea · WhatsApp'],
      cues: [{ at: 0, type: 'whoosh' }, { at: 0.3, type: 'hit' }] },
    { id: 'envios', start: 16, end: 19, voStart: 16.2,
      vo: 'Envíos a todo México.',
      copy: ['Envíos a todo México', 'Wrangler, Oggi y más'],
      cues: [{ at: 0, type: 'whoosh' }, { at: 0.5, type: 'whoosh' }] },
    { id: 'cierre', start: 19, end: 24.5, voStart: 19.2,
      vo: 'Escríbenos por WhatsApp o entra a nuestra tienda en línea. Ge y ele, tu fit perfecto.',
      copy: ['Escríbenos por WhatsApp', '312 101 8263', 'glboutique.com.mx', 'Tu fit perfecto'],
      cues: [{ at: 0, type: 'whoosh' }, { at: 0.3, type: 'hit' }, { at: 1.2, type: 'hit' }] },
  ],
}
globalThis.TIMELINE = TIMELINE
if (typeof module !== 'undefined') module.exports = TIMELINE
