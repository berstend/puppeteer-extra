import puppeteer from 'puppeteer-extra'

puppeteer.use(require('puppeteer-extra-plugin-click-and-wait')())
;(async () => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto('https://example.com/'.replace('https:', 'http:'), { waitUntil: 'domcontentloaded' })
  console.log('clicking on first link')
  await (page as any).clickAndWaitForNavigation('a')
  console.log('all done')
})()
