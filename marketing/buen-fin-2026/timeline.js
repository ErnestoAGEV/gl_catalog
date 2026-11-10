// Fuente única de tiempos: la leen video.html, check.mjs, retime.js y (vía timeline.json) audio.py.
// Los tiempos start/end/voStart/duration los reescribe retime.js; no editarlos a mano después de grabar la voz.
const TIMELINE = {
  fps: 30,
  bpm: 120,
  duration: 23.5,
  scenes: [
    { id: 'intro', start: 0, end: 2.5, voStart: 0.2,
      vo: 'Este Buen Fin, en ge y ele…',
      copy: ['Buen Fin'],
      cues: [{ at: 0, type: 'whoosh' }, { at: 0.5, type: 'hit' }, { at: 1.5, type: 'hit' }] },
    { id: 'diez', start: 2.5, end: 5, voStart: 2.7,
      vo: '10% en toda la tienda.',
      copy: ['10%', 'en toda la tienda'],
      cues: [{ at: 0, type: 'whoosh' }, { at: 0.25, type: 'hit' }, { at: 0.75, type: 'whoosh' }, { at: 1.0, type: 'whoosh' }, { at: 1.25, type: 'whoosh' }] },
    { id: 'quince', start: 5, end: 9, voStart: 5.2,
      vo: 'Y 15% en perfumes y pantalones seleccionados.',
      copy: ['15%', 'en perfumes y pantalones seleccionados', 'Descuentos no acumulables'],
      cues: [{ at: 0, type: 'whoosh' }, { at: 0.25, type: 'hit' }, { at: 1.5, type: 'whoosh' }, { at: 2.0, type: 'whoosh' }] },
    { id: 'fechas', start: 9, end: 15, voStart: 9.2,
      vo: 'Del 13 al 16 de noviembre, en nuestras tiendas de Colima, en línea y por WhatsApp.',
      copy: ['Del 13 al 16 de noviembre', 'Tiendas en Colima · En línea · WhatsApp'],
      cues: [{ at: 0, type: 'whoosh' }, { at: 0.25, type: 'hit' }, { at: 2.5, type: 'whoosh' }, { at: 2.75, type: 'whoosh' }] },
    { id: 'envios', start: 15, end: 18, voStart: 15.2,
      vo: 'Envíos a todo México.',
      copy: ['Envíos a todo México', 'Wrangler, Oggi y más'],
      cues: [{ at: 0, type: 'whoosh' }, { at: 0.5, type: 'whoosh' }, { at: 1.0, type: 'whoosh' }, { at: 1.5, type: 'whoosh' }, { at: 1.25, type: 'whoosh' }, { at: 1.75, type: 'whoosh' }] },
    { id: 'cierre', start: 18, end: 23.5, voStart: 18.2,
      vo: 'Escríbenos por WhatsApp o entra a nuestra tienda en línea. Ge y ele, tu fit perfecto.',
      copy: ['Escríbenos por WhatsApp', '312 101 8263', 'glboutique.com.mx', 'Tu fit perfecto'],
      cues: [{ at: 0, type: 'whoosh' }, { at: 0.25, type: 'hit' }, { at: 1.25, type: 'hit' }] },
  ],
}
globalThis.TIMELINE = TIMELINE
if (typeof module !== 'undefined') module.exports = TIMELINE
