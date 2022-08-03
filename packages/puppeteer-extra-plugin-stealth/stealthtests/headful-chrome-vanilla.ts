import { getChromePath, performTest, startScript } from "./common"
import puppeteer from 'puppeteer'

async function main() {
  startScript(__filename)
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: getChromePath() // MacOS
  })
  await performTest(browser, __filename)
}
main()
