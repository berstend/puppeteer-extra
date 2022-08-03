import { performTest, startScript } from "./common";
import puppeteer from 'puppeteer'

async function main() {
  startScript(__filename)
  const browser = await puppeteer.launch({ headless: true })
  await performTest(browser, __filename)
}
main()
