import { Page } from "puppeteer";

import assert from 'assert'
import { addExtra } from 'puppeteer-extra'
export { addExtra, VanillaPuppeteer } from 'puppeteer-extra'

export { default as vanillaPuppeteer} from 'puppeteer'
import { default as vanillaPuppeteer} from 'puppeteer'

const fpCollectPath = require.resolve('fpcollect/dist/fpCollect.min.js')

var fpCollect: any;

const getFingerPrintFromPage = async (page: Page) => {
  return page.evaluate(() => fpCollect.generateFingerprint()) // eslint-disable-line
}

export const dummyHTMLPath = require('path').join(__dirname, './fixtures/dummy.html')

const getFingerPrint = async (puppeteer: any, pageFn?: any) => {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('file://' + dummyHTMLPath)
  await page.addScriptTag({ path: fpCollectPath })
  const fingerPrint = await getFingerPrintFromPage(page)

  let pageFnResult = null
  if (pageFn) {
    pageFnResult = await pageFn(page)
  }

  await browser.close()
  return { ...fingerPrint, pageFnResult }
}

export const getVanillaFingerPrint = async (pageFn?: any) =>
  getFingerPrint(vanillaPuppeteer, pageFn)
export const getStealthFingerPrint = async (Plugin: any, pageFn?: any, pluginOptions = null) =>
  getFingerPrint(addExtra(vanillaPuppeteer).use(Plugin(pluginOptions)), pageFn)

// Expecting the input string to be in one of these formats:
// - The UA string
// - The shorter version string from Puppeteers browser.version()
// - The shortest four-integer string
const parseLooseVersionString = (looseVersionString: string) => (looseVersionString
  .match(/(\d+\.){3}\d+/) as string[])[0]
  .split('.')
  .map(x => parseInt(x))

export const compareLooseVersionStrings = (version0: string, version1: string) => {
  const parsed0 = parseLooseVersionString(version0)
  const parsed1 = parseLooseVersionString(version1)
  assert(parsed0.length == 4)
  assert(parsed1.length == 4)
  for (let i = 0; i < parsed0.length; i++) {
    if (parsed0[i] < parsed1[i]) {
      return -1
    } else if (parsed0[i] > parsed1[i]) {
      return 1
    }
  }
  return 0
}
