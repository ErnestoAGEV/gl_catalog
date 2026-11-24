// Cliente mínimo de Envia (POST /ship/rate/). Sin APIs de Deno a nivel de módulo: lo importa también Node en las pruebas.

// Códigos de estado de Envia (columna 2-digit de https://queries.envia.com/state?country_code=MX, consultado 2026-11-24).
const ENVIA_STATE = {
  AGU: 'AG', BCN: 'BC', BCS: 'BS', CAM: 'CM', CHP: 'CS', CHH: 'CH', CMX: 'CX', COA: 'CO',
  COL: 'CL', DUR: 'DG', GUA: 'GT', GRO: 'GR', HID: 'HG', JAL: 'JA', MEX: 'EM', MIC: 'MI',
  MOR: 'MO', NAY: 'NA', NLE: 'NL', OAX: 'OA', PUE: 'PU', QUE: 'QT', ROO: 'QR', SLP: 'SL',
  SIN: 'SI', SON: 'SO', TAB: 'TB', TAM: 'TM', TLA: 'TL', VER: 'VE', YUC: 'YU', ZAC: 'ZA',
}
export const enviaState = (code) => ENVIA_STATE[code] ?? code

// deliveryEstimate es texto libre ("2-4 días"): días = el número mayor (conservador). Sin número -> null.
function parseDays(r) {
  const txt = String(r.deliveryEstimate ?? '')
  // Fechas ("27/11") o cifras > 30 no son días
  const nums = /\d\/\d/.test(txt) ? null : txt.match(/\d+/g)?.map(Number)
  if (nums?.length) { const n = Math.max(...nums); return n > 30 ? null : n }
  const dd = r.deliveryDate
  return dd?.timeUnit === 'days' && Number.isFinite(dd.dateDifference) ? dd.dateDifference : null
}

export function parseRates(json, carrier) {
  if (!Array.isArray(json?.data)) return []
  return json.data
    .map((r) => ({ carrier: r.carrier ?? carrier, service: r.serviceDescription || r.service, serviceCode: r.service, price: parseFloat(r.totalPrice), days: parseDays(r) }))
    .filter((r) => Number.isFinite(r.price) && r.price > 0 && r.service)
    // Dueño: todos los envíos a domicilio; Ocurre = recoger en sucursal
    .filter((r) => !/ocurre/i.test(r.service.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))
}

const addr = (a) => ({ ...a, state: enviaState(a.state), country: 'MX' })
const packages = (pkg) => [{
  type: pkg.kind, content: 'Ropa y accesorios', amount: 1, declaredValue: 0,
  lengthUnit: 'CM', weightUnit: 'KG', weight: Math.max(pkg.grams / 1000, 0.01),
  dimensions: { length: pkg.length, width: pkg.width, height: pkg.height },
}]

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
        packages: packages(pkg),
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

// ---- Guías: POST /ship/generate/ ----

export const buildLabelRequest = ({ origin, destination, pkg, carrier, serviceCode, printSize, orderRef }) => ({
  origin: addr(origin),
  destination: addr(destination),
  packages: packages(pkg),
  shipment: { type: 1, carrier, service: serviceCode, orderReference: orderRef },
  settings: { printFormat: 'PDF', printSize, currency: 'MXN' },
})

export function parseLabel(json) {
  const d = json?.data?.[0]
  if (!d?.trackingNumber) return null
  const cost = Number(d.totalPrice)
  return { trackingNumber: String(d.trackingNumber), trackUrl: d.trackUrl ?? null, labelUrl: d.label || null, cost: Number.isFinite(cost) ? cost : null, carrier: d.carrier, service: d.service }
}

const errText = (json) => {
  const t = json?.error?.message ?? json?.error?.description ?? json?.message
  return typeof t === 'string' ? t.trim() : ''
}

export function enviaErrorMessage(json) {
  const t = errText(json).slice(0, 200)
  if (/saldo|balance|fondos|insufficient|insuficiente/i.test(t)) return 'No hay saldo suficiente en Envia. Recarga tu saldo y vuelve a intentar.'
  return t ? `Envia no pudo generar la guía: ${t}` : 'Envia no pudo generar la guía. Intenta de nuevo en unos minutos.'
}

// Solo datos de Envia, sin nada del cliente (Global Constraints del plan de guías).
export const rejectLog = (status, json) =>
  `status=${status} meta=${json?.meta ?? ''} code=${json?.error?.code ?? ''} msg=${errText(json).replace(/\s+/g, ' ').slice(0, 120)}`

// 'unknown' = no se sabe si Envia cobró: el pedido va a revisión, nunca se libera solo.
export function classifyGenerate(status, json) {
  const label = parseLabel(json)
  const ok2xx = status >= 200 && status < 300
  if (ok2xx && label?.labelUrl) return { kind: 'ok', label }
  // Con rastreo hubo guía: nunca 'rejected' (liberar permitiría comprarla otra vez).
  const unknown = label ? { kind: 'unknown', trackingNumber: label.trackingNumber } : { kind: 'unknown' }
  if (status >= 500 || status === 408 || status === 429 || label) return unknown
  if ((status >= 400 && status < 500) || json?.meta === 'error' || json?.error) return { kind: 'rejected', message: enviaErrorMessage(json) }
  return unknown
}

// Nunca lanza: cualquier excepción (red, timeout) es 'unknown'.
export async function generateLabel({ baseUrl, apiKey, body, fetchFn = fetch, timeoutMs = 30000 }) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetchFn(`${baseUrl}/ship/generate/`, {
      method: 'POST',
      signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    let json = null
    try { json = JSON.parse(text) } catch { /* cuerpo no-JSON */ }
    return classifyGenerate(res.status, json)
  } catch {
    return { kind: 'unknown' }
  } finally {
    clearTimeout(timer)
  }
}
