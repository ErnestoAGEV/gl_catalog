// Celda CSV segura: un valor que empieza con = + - @ tab o salto de linea lo
// ejecutaria Excel/Sheets como formula, asi que se antepone una comilla simple.
export const csvCell = (value) => {
  let s = String(value ?? '')
  if (/^[=+\-@\t\r\n]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

export const csvRow = (values) => values.map(csvCell).join(',')
