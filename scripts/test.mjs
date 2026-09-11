// npm test — corre todas las pruebas.
//
// Un archivo en vez de encadenar con `&&` en package.json: npm usa PowerShell
// en Windows y ahi `&&` no es un separador valido. Cada modulo lanza sus
// asserts al importarse.

import './test-product-copy.mjs'
import './test-stock.mjs'
import './test-resize-image.mjs'
import './test-related.mjs'
import './test-brands.mjs'
import './test-cleanup.mjs'
import './test-auth-session.mjs'
