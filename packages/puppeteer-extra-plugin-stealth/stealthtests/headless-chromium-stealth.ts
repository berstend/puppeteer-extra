import { performTest, startScript } from "./common"
import puppeteer from 'puppeteer-extra'
import pluginStealth from 'puppeteer-extra-plugin-stealth'

puppeteer.use(pluginStealth())

async function main() {
  startScript(__filename)
  const browser = await puppeteer.launch({ headless: true })
  await performTest(browser, __filename)
}
main()
