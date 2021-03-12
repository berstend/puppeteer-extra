const test = require('ava')

const fpscanner = require('fpscanner')

const vanillaPuppeteer = require('puppeteer')
const { addExtraPuppeteer } = require('automation-extra')

const Plugin = require('../.')

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

const getStealthFingerPrint = async (Plugin, pageFn, pluginOptions = null) =>
  getFingerPrint(
    addExtraPuppeteer(vanillaPuppeteer).use(Plugin(pluginOptions)),
    pageFn
  )

test('stealth: will not fail a single fpscanner test', async t => {
  const fingerPrint = await getStealthFingerPrint(Plugin)
  const testedFingerPrints = fpscanner.analyseFingerprint(fingerPrint)
  const failedChecks = Object.values(testedFingerPrints).filter(
    val => val.consistent < 3
  )

  if (failedChecks.length) {
    console.warn('The following fingerprints failed:', failedChecks)
  }
  t.is(failedChecks.length, 0)
})
