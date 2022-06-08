import puppeteer from 'puppeteer-extra'
import pluginStealth from 'puppeteer-extra-plugin-stealth'
import { screenshot, startScript } from './common'

async function main() {
  puppeteer.use(pluginStealth())
  startScript(__filename)
  const browser = await puppeteer.launch({ headless: false })

  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 600 })
  await page.goto('https://bot.sannysoft.com/')
  await page.waitForTimeout(5000)
  await screenshot(__filename, page)
  await browser.close()
}
main()
