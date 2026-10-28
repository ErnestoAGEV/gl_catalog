// Correos del Club G&L (bienvenida y envíos a suscriptores). El admin edita los
// textos y aquí se arma el HTML final; Supabase solo lo envía, cambiando
// {{BAJA_URL}} por el enlace de baja de cada suscriptor (supabase/newsletter-correos.sql).
import { escapeHtml as esc } from '../../utils/sanitize.js'

export const WELCOME_DEFAULTS = {
  subject: 'Bienvenida al Club G&L: tu 10% ya está aquí',
  preheader: 'Tu código WELCOME10 te da 10% en tu primera compra.',
  title: 'Ya eres parte del Club G&L.',
  body: 'Gracias por suscribirte. Una vez al mes te contamos qué llegó nuevo a las tiendas y te avisamos de las rebajas antes que a nadie.\n\nPara empezar, tu primera compra lleva 10% de descuento.',
  code: 'WELCOME10',
  codeNote: '10% en tu primera compra',
  ctaLabel: 'Ver el catálogo',
  ctaUrl: 'https://glboutique.com.mx/catalog',
  imageUrl: 'https://glboutique.com.mx/heroeGL.jpg',
  bodyMode: 'text',
}

export const CAMPAIGN_DEFAULTS = {
  ...WELCOME_DEFAULTS,
  subject: '',
  preheader: '',
  title: '',
  body: '',
  code: '',
  codeNote: '',
  imageUrl: '',
}

// Supabase lo cambia por el enlace de baja de cada persona al enviar.
export const UNSUB_PLACEHOLDER = '{{BAJA_URL}}'

// public/email-logo.png: el logo en PNG (el .webp no se ve en Outlook) con fondo blanco,
// porque el interior de las letras es transparente y en modo oscuro desaparece.
export const LOGO_URL = 'https://glboutique.com.mx/email-logo.png'
const FONT = "Manrope, 'Helvetica Neue', Helvetica, Arial, sans-serif"

// Solo http(s): un javascript: en un enlace del correo no debe pasar.
const safeUrl = (url, fallback) => (/^https?:\/\//i.test(url || '') ? url : fallback)

export function newsletterEmailHtml(input = {}, whatsapp = '') {
  const f = { ...WELCOME_DEFAULTS, ...input }
  const paragraphs = f.bodyMode === 'html'
    // HTML del admin tal cual; el div le da la tipografía base a lo que no traiga estilos.
    ? `<div style="font-family:${FONT};font-size:16px;line-height:26px;color:#3F444E;word-break:break-word;">${f.body || ''}</div>`
    : String(f.body || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:26px;color:#3F444E;word-break:break-word;">${esc(p).replace(/\n/g, '<br>')}</p>`).join('')
  const cta = safeUrl(f.ctaUrl, WELCOME_DEFAULTS.ctaUrl)
  const img = safeUrl(f.imageUrl, '')
  const wa = `https://wa.me/${encodeURIComponent(whatsapp)}`

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>${esc(f.subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&display=swap" rel="stylesheet">
<style>@media (min-width:621px){.gl-pad{padding-left:44px!important;padding-right:44px!important}.gl-code{font-size:40px!important;line-height:44px!important}.gl-tag{padding:22px 28px 22px 20px!important}.gl-hole{width:36px!important}}@media (max-width:620px){.gl-wrap{padding:16px 8px!important}.gl-pad{padding-left:20px!important;padding-right:20px!important}.gl-title{font-size:32px!important;line-height:34px!important}.gl-tag{padding:18px 14px!important}}</style>
</head>
<body style="margin:0;padding:0;background:#F5F6F8;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(f.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6F8;"><tr><td align="center" class="gl-wrap" style="padding:24px 8px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:4px;">
  <tr><td class="gl-pad" style="padding:32px 20px 0;"><a href="https://glboutique.com.mx" style="text-decoration:none;"><img src="${LOGO_URL}" width="116" height="65" alt="G&amp;L" style="display:block;border:0;border-radius:6px;margin-left:-8px;font-family:${FONT};font-size:26px;font-weight:800;color:#214FC7;"></a></td></tr>
  <tr><td class="gl-pad" style="padding:40px 20px 8px;">
    <h1 class="gl-title" style="margin:0 0 24px;font-family:${FONT};font-size:44px;line-height:44px;font-weight:800;letter-spacing:-2px;color:#15171C;word-break:break-word;">${esc(f.title)}</h1>
    ${paragraphs}
  </td></tr>
  ${f.code ? `<tr><td class="gl-pad" style="padding:16px 20px 8px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="background:#214FC7;border-radius:6px 22px 22px 6px;">
      <tr>
        <td width="26" align="center" valign="middle" class="gl-hole" style="border-right:2px dashed #7F9BE3;padding:0 4px;">
          <div style="width:14px;height:14px;border-radius:7px;background:#FFFFFF;line-height:14px;font-size:0;">&nbsp;</div>
        </td>
        <td class="gl-tag" style="padding:20px 12px;">
          <p style="margin:0 0 6px;font-family:${FONT};font-size:14px;font-weight:600;color:#DCE4F9;">${esc(f.codeNote)}</p>
          <p class="gl-code" style="margin:0;font-family:${FONT};font-size:28px;line-height:32px;font-weight:800;letter-spacing:-1px;color:#FFFFFF;word-break:break-all;">${esc(f.code)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:12px 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:#5B606B;">Escríbelo en el carrito al pagar, o dínoslo por WhatsApp.</p>
  </td></tr>` : ''}
  ${f.ctaLabel ? `<tr><td class="gl-pad" style="padding:32px 20px 48px;">
    <a href="${esc(cta)}" style="display:inline-block;background:#15171C;color:#FFFFFF;font-family:${FONT};font-size:15px;font-weight:600;text-decoration:none;line-height:20px;padding:14px 28px;border-radius:999px;">${esc(f.ctaLabel)}</a>
  </td></tr>` : '<tr><td style="padding:0 0 32px;"></td></tr>'}
  ${img ? `<tr><td><img src="${esc(img)}" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>` : ''}
  <tr><td class="gl-pad" style="padding:24px 20px 32px;border-top:1px solid #E6E8EC;font-family:${FONT};font-size:12px;line-height:19px;color:#5B606B;">
    ¿Dudas? Escríbenos por <a href="${wa}" style="color:#214FC7;">WhatsApp</a>.<br>
    Recibes este correo porque te uniste al Club G&amp;L en glboutique.com.mx. <a href="${UNSUB_PLACEHOLDER}" style="color:#5B606B;">Darme de baja</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}
