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
const getStealthFingerPrint = async (Plugin, pageFn) =>
  getFingerPrint(addExtra(vanillaPuppeteer).use(Plugin()), pageFn)

module.exports = {
  getVanillaFingerPrint,
  getStealthFingerPrint,
  dummyHTMLPath,
  vanillaPuppeteer,
  addExtra
}
