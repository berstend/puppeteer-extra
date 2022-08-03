import { performTest, startScript } from './common'
import puppeteer from 'puppeteer-extra'
import pluginStealth from 'puppeteer-extra-plugin-stealth'

async function main() {
  puppeteer.use(pluginStealth())
  startScript(__filename)
  const browser = await puppeteer.launch({ headless: false })
  await performTest(browser, __filename)
}
main()
