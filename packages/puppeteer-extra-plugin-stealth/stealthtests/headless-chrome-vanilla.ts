import { getChromePath, screenshot, startScript } from "./common"
import puppeteer from 'puppeteer'




async function main() {
  startScript(__filename)
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: getChromePath()
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 600 })
  await page.goto('https://bot.sannysoft.com/')
  await page.waitForTimeout(5000)
  await screenshot(__filename, page)
  await browser.close()
}
main()
