// Que pantalla del login del admin toca, segun el nivel de la sesion que da
// supabase.auth.mfa.getAuthenticatorAssuranceLevel(). Sin supabase, para
// probarla desde node (scripts/test-mfa.mjs).
//
// 'login': no hay sesion (currentLevel null) -> contraseña.
// 'none': ya entro con codigo (aal2).
// 'challenge': tiene un factor verificado y le falta el codigo.
// 'enroll': no tiene factor verificado -> dar de alta uno.
export function mfaStep({ currentLevel, nextLevel } = {}) {
  if (!currentLevel) return 'login'
  if (currentLevel === 'aal2') return 'none'
  if (nextLevel === 'aal2') return 'challenge'
  return 'enroll'
}

// Supabase no deja repetir friendly_name en un mismo usuario: 'G&L admin',
// luego 'G&L admin 2', 'G&L admin 3'… el primero libre.
export function factorName(existingNames = []) {
  const taken = new Set(existingNames)
  if (!taken.has('G&L admin')) return 'G&L admin'
  let n = 2
  while (taken.has(`G&L admin ${n}`)) n++
  return `G&L admin ${n}`
}

// Las apps de autenticacion dan 6 digitos; el usuario puede pegarlos con espacios.
export function cleanTotpCode(raw) {
  const code = String(raw ?? '').replace(/\s+/g, '')
  return /^\d{6}$/.test(code) ? code : null
}
