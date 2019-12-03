const vanillaPuppeteer = require('puppeteer')
const { addExtra } = require('puppeteer-extra')

const fpCollectPath = require.resolve('fpcollect/dist/fpCollect.min.js')

const getFingerPrintFromPage = async page => {
  return page.evaluate(() => fpCollect.generateFingerprint()) // eslint-disable-line
}

const dummyHTMLPath = require('path').join(__dirname, './fixtures/dummy.html')

// const getBrowser = async puppeteer => {
//   const browser = await puppeteer.launch({ headless: true })
//   const page = await browser.newPage()

//   await page.evaluateOnNewDocument(() => {
//     // eslint-disable-next-line
//     Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
//       get: function() {
//         return window
//       }
//     })
//   })

//   await page.goto('file://' + dummyHTMLPath)
//   return { browser, page }
// }

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

// const getVanillaBrowser = async () => getBrowser(vanillaPuppeteer)
// const getStealthBrowser = async Plugin =>
//   getBrowser(addExtra(vanillaPuppeteer).use(Plugin()))

module.exports = {
  getVanillaFingerPrint,
  getStealthFingerPrint,
  dummyHTMLPath,
  vanillaPuppeteer,
  addExtra
  // getVanillaBrowser,
  // getStealthBrowser
}
