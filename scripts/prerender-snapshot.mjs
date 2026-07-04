import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'fs'

const browser = await puppeteer.launch({ channel: 'chrome', headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })

// Block Supabase so the snapshot captures the deterministic skeleton state
await page.setRequestInterception(true)
page.on('request', (req) => {
  if (req.url().includes('supabase.co')) return req.abort()
  req.continue()
})

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 30000 })
await page.waitForSelector('.hero-img img', { timeout: 15000 })
await new Promise(r => setTimeout(r, 800))

const html = await page.evaluate(() => {
  // Remove any scripts and overlay/toast leftovers just in case
  const app = document.querySelector('#app').cloneNode(true)
  app.querySelectorAll('script').forEach(s => s.remove())
  return app.innerHTML
})

writeFileSync('shell.html', html)
console.log('snapshot bytes:', html.length)
await browser.close()
