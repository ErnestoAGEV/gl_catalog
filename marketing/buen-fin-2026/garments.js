// Prendas en estilo plano. Relleno = currentColor; detalles = var(--accent). Sin tamaño fijo: escalan con su contenedor.
const D = 'fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"'
const DASH = D + ' stroke-dasharray="6 6"'
const DOT = 'fill="var(--accent)"'

const GARMENTS = {
  pantalon: `<svg viewBox="0 0 160 260" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M24 8 H136 L142 60 L134 252 H90 L80 92 L70 252 H26 L18 60 Z"/>
    <path ${D} d="M25 24 H135 M40 8 V24 M80 8 V24 M120 8 V24"/>
    <circle cx="80" cy="16" r="3.5" ${DOT}/>
    <path ${D} d="M80 24 V70 Q80 84 68 88"/>
    <path ${D} d="M56 24 Q52 46 21 50 M104 24 Q108 46 139 50"/>
    <path ${DASH} d="M30 60 L34 238 M130 60 L126 238"/>
    <path ${D} d="M29 238 H70 M90 238 H131"/>
  </svg>`,

  camisa: `<svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M70 20 L92 14 Q110 26 128 14 L150 20 L196 50 L182 96 L160 84 L160 206 H60 L60 84 L38 96 L24 50 Z"/>
    <path ${D} d="M92 14 L98 36 L110 44 L122 36 L128 14 M110 44 V204"/>
    <g ${DOT}><circle cx="110" cy="66" r="3.5"/><circle cx="110" cy="96" r="3.5"/><circle cx="110" cy="126" r="3.5"/><circle cx="110" cy="156" r="3.5"/><circle cx="110" cy="186" r="3.5"/></g>
    <path ${D} d="M126 80 H148 V104 H126 Z"/>
    <path ${D} d="M174 90 L188 46 M46 90 L32 46"/>
  </svg>`,

  playera: `<svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M72 16 Q110 40 148 16 L196 40 L180 84 L158 74 L158 190 H62 L62 74 L40 84 L24 40 Z"/>
    <path ${D} d="M80 20 Q110 44 140 20"/>
    <path ${D} d="M172 80 L186 44 M48 80 L34 44 M64 178 H156"/>
  </svg>`,

  chamarra: `<svg viewBox="0 0 220 230" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M70 18 L92 12 Q110 22 128 12 L150 18 L190 40 L204 196 L180 200 L162 92 L162 214 H58 L58 92 L40 200 L16 196 L30 40 Z"/>
    <path ${D} d="M92 12 L80 40 L110 52 L140 40 L128 12 M110 52 V212"/>
    <g ${DOT}><circle cx="110" cy="76" r="3.5"/><circle cx="110" cy="112" r="3.5"/><circle cx="110" cy="148" r="3.5"/><circle cx="110" cy="184" r="3.5"/></g>
    <path ${D} d="M70 96 H100 L96 110 H74 Z M120 96 H150 L146 110 H124 Z"/>
    <path ${DASH} d="M84 116 V196 M136 116 V196"/>
    <path ${D} d="M58 198 H162 M180 196 L176 182 M40 196 L44 182"/>
  </svg>`,

  perfume: `<svg viewBox="0 0 140 220" xmlns="http://www.w3.org/2000/svg">
    <rect x="46" y="6" width="48" height="42" rx="4" fill="currentColor"/>
    <path ${D} d="M58 16 V38" opacity=".7"/>
    <rect x="56" y="48" width="28" height="12" rx="2" fill="currentColor"/>
    <path fill="currentColor" d="M22 76 L38 62 H102 L118 76 V196 L102 210 H38 L22 196 Z"/>
    <path ${D} d="M36 78 H104 V194 H36 Z"/>
    <path ${D} d="M50 120 H90 M56 136 H84"/>
    <g ${DOT}><circle cx="106" cy="20" r="3"/><circle cx="118" cy="12" r="3"/><circle cx="120" cy="28" r="2.5"/><circle cx="130" cy="20" r="2"/></g>
  </svg>`,
}

// Glifo oficial de WhatsApp (Meta), blanco sobre #25D366. No recolorear.
const WHATSAPP_GLYPH = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <circle cx="24" cy="24" r="24" fill="#25D366"/>
  <g transform="translate(12 12)"><path fill="#FFFFFF" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></g>
</svg>`

globalThis.GARMENTS = GARMENTS
globalThis.WHATSAPP_GLYPH = WHATSAPP_GLYPH
if (typeof module !== 'undefined') module.exports = { GARMENTS, WHATSAPP_GLYPH }
