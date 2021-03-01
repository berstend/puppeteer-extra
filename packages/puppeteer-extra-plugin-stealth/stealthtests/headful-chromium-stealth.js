const path = require('path')
const scriptName = path.basename(__filename)
const screenshotPath = path.join(__dirname, '_results', `${scriptName}.png`)

const puppeteer = require('puppeteer-extra')
const pluginStealth = require('puppeteer-extra-plugin-stealth')

async function main() {
  puppeteer.use(pluginStealth())
  console.log('start', scriptName)
  const browser = await puppeteer.launch({ headless: false })

  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 600 })
  await page.goto('https://bot.sannysoft.com/')
  await page.waitForTimeout(5000)
  await page.screenshot({ path: screenshotPath, fullPage: true })

  await browser.close()
  console.log('end', screenshotPath)
}
main()
