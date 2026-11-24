// Cliente mínimo de Envia (POST /ship/rate/). Sin APIs de Deno a nivel de módulo: lo importa también Node en las pruebas.

// Códigos de estado de Envia (2 letras). Verificados en la doc solo NL y CX; el resto sigue la convención de Envia: confirmar con sandbox.
const ENVIA_STATE = {
  AGU: 'AG', BCN: 'BC', BCS: 'BS', CAM: 'CM', CHP: 'CS', CHH: 'CH', CMX: 'CX', COA: 'CO',
  COL: 'CL', DUR: 'DG', GUA: 'GT', GRO: 'GR', HID: 'HG', JAL: 'JC', MEX: 'EM', MIC: 'MI',
  MOR: 'MO', NAY: 'NT', NLE: 'NL', OAX: 'OC', PUE: 'PL', QUE: 'QT', ROO: 'QR', SLP: 'SL',
  SIN: 'SP', SON: 'SR', TAB: 'TC', TAM: 'TS', TLA: 'TL', VER: 'VZ', YUC: 'YN', ZAC: 'ZS',
}
export const enviaState = (code) => ENVIA_STATE[code] ?? code

// deliveryEstimate es texto libre ("2-4 días"): días = el número mayor (conservador). Sin número -> null.
function parseDays(r) {
  const nums = String(r.deliveryEstimate ?? '').match(/\d+/g)?.map(Number)
  if (nums?.length) return Math.max(...nums)
  const dd = r.deliveryDate
  return dd?.timeUnit === 'days' && Number.isFinite(dd.dateDifference) ? dd.dateDifference : null
}

export function parseRates(json, carrier) {
  if (!Array.isArray(json?.data)) return []
  return json.data
    .map((r) => ({ carrier: r.carrier ?? carrier, service: r.serviceDescription || r.service, price: parseFloat(r.totalPrice), days: parseDays(r) }))
    .filter((r) => Number.isFinite(r.price) && r.price > 0 && r.service)
}

const addr = (a) => ({ ...a, state: enviaState(a.state), country: 'MX' })

export async function rateCarrier({ baseUrl, apiKey, carrier, origin, destination, pkg }) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 8000)
  try {
    const res = await fetch(`${baseUrl}/ship/rate/`, {
      method: 'POST',
      signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        origin: addr(origin),
        destination: addr(destination),
        packages: [{
          type: pkg.kind, content: 'Ropa y accesorios', amount: 1, declaredValue: 0,
          lengthUnit: 'CM', weightUnit: 'KG', weight: Math.max(pkg.grams / 1000, 0.01),
          dimensions: { length: pkg.length, width: pkg.width, height: pkg.height },
        }],
        shipment: { type: 1, carrier },
        settings: { currency: 'MXN' },
      }),
    })
    if (!res.ok) throw new Error(`Envia ${carrier}: HTTP ${res.status}`)
    return parseRates(await res.json(), carrier)
  } finally {
    clearTimeout(timer)
  }
}
