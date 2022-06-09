import puppeteer from 'puppeteer-extra'
import plugin from 'puppeteer-extra-plugin-stealth';
import detectHeadless from './detect-headless'

if (!process.argv.includes('off'))
  puppeteer.use(plugin({evasionsOptions: {
    "navigator.languages": { languages: ["fr-FR", "fr", "en"] },
  }}))

;(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  page.on('console', msg => {
    console.log('Page console: ', msg.text())
  })

  await page.goto('about:blank')
  const detectionResults = await page.evaluate(detectHeadless)
  console.assert(
    Object.keys(detectionResults).length,
    'No detection results returned.'
  )
  await browser.close()
})()

// with puppeteer-extra-plugin-stealth:
// PASS: Chrome headless NOT detected via userAgent
// WARNING: Chrome headless detected via navigator.webdriver present
// PASS: Chrome headless NOT detected via window.chrome missing
// PASS: Chrome headless NOT detected via permissions API
// PASS: Chrome headless NOT detected via permissions API overriden
// PASS: Chrome headless NOT detected via navigator.plugins empty
// PASS: Chrome headless NOT detected via navigator.languages blank
// PASS: Chrome headless NOT detected via iFrame for fresh window object
// PASS: Chrome headless NOT detected via toString

// whithout puppeteer-extra-plugin-stealth:
// WARNING: Chrome headless detected via userAgent
// WARNING: Chrome headless detected via navigator.webdriver present
// WARNING: Chrome headless detected via window.chrome missing
// WARNING: Chrome headless detected via permissions API
// PASS: Chrome headless NOT detected via permissions API overriden
// WARNING: Chrome headless detected via navigator.plugins empty
// PASS: Chrome headless NOT detected via navigator.languages blank
// WARNING: Chrome headless detected via iFrame for fresh window object
// PASS: Chrome headless NOT detected via toString