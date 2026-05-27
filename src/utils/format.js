export function formatMoney(value) {
  const amount = Number(value || 0)
  return amount.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  })
}
