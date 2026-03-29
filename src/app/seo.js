const BASE_URL = 'https://www.glboutique.com.mx'
const DEFAULT_IMAGE = `${BASE_URL}/bannergl.webp`

function setMetaByName(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setMetaByProperty(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('property', property)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setCanonical(url) {
  let tag = document.querySelector('link[rel="canonical"]')
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', 'canonical')
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', url)
}

export function applySeo({
  title,
  description,
  canonicalPath = '/',
  robots = 'index,follow',
  image = DEFAULT_IMAGE,
}) {
  if (title) document.title = title

  const canonicalUrl = new URL(canonicalPath || '/', BASE_URL).toString()
  const safeDescription = description || 'Moda masculina premium en Colima. Compra camisas, polos, jeans y perfumes en G&L.'

  setMetaByName('description', safeDescription)
  setMetaByName('robots', robots)
  setCanonical(canonicalUrl)

  setMetaByProperty('og:type', 'website')
  setMetaByProperty('og:url', canonicalUrl)
  setMetaByProperty('og:title', title || 'G&L | Moda Masculina en Mexico')
  setMetaByProperty('og:description', safeDescription)
  setMetaByProperty('og:image', image)

  setMetaByName('twitter:card', 'summary_large_image')
  setMetaByName('twitter:title', title || 'G&L | Moda Masculina en Mexico')
  setMetaByName('twitter:description', safeDescription)
  setMetaByName('twitter:image', image)
}
