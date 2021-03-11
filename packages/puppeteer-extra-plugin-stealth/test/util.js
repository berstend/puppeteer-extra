const assert = require('assert')
const vanillaPuppeteer = require('puppeteer')
const { addExtra } = require('puppeteer-extra')

const fpCollectPath = require.resolve('fpcollect/dist/fpCollect.min.js')

const getFingerPrintFromPage = async page => {
  return page.evaluate(() => fpCollect.generateFingerprint()) // eslint-disable-line
}

const dummyHTMLPath = require('path').join(__dirname, './fixtures/dummy.html')

const getFingerPrint = async (puppeteer, pageFn) => {
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

const getVanillaFingerPrint = async pageFn =>
  getFingerPrint(vanillaPuppeteer, pageFn)
const getStealthFingerPrint = async (Plugin, pageFn, pluginOptions = null) =>
  getFingerPrint(addExtra(vanillaPuppeteer).use(Plugin(pluginOptions)), pageFn)

// Expecting the input string to be in one of these formats:
// - The UA string
// - The shorter version string from Puppeteers browser.version()
// - The shortest four-integer string
const parseLooseVersionString = looseVersionString => looseVersionString
  .match(/(\d+\.){3}\d+/)[0]
  .split('.')
  .map(x => parseInt(x))

const compareLooseVersionStrings = (version0, version1) => {
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

module.exports = {
  getVanillaFingerPrint,
  getStealthFingerPrint,
  dummyHTMLPath,
  vanillaPuppeteer,
  addExtra,
  compareLooseVersionStrings
}
