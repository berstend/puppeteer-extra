const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('../../test/util')
const Plugin = require('.')

test('vanilla: navigator.webdriver is defined', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const vendor = await page.evaluate(() => navigator.webdriver)
  t.is(vendor, true)
})

test('stealth: navigator.webdriver is undefined', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const vendor = await page.evaluate(() => navigator.webdriver)
  t.is(vendor, undefined)
})
