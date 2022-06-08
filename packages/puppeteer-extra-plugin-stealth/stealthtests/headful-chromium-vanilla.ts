import puppeteer from 'puppeteer'
import { screenshot, startScript } from './common'

async function main() {
  startScript(__filename)
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 600 })
  await page.goto('https://bot.sannysoft.com/')
  await page.waitForTimeout(5000)
  await screenshot(__filename, page);
  await browser.close()
}
main()
