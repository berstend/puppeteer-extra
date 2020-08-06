const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('../../test/util')
const Plugin = require('.')

test('vanilla: navigator.vendor is always Google Inc.', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const vendor = await page.evaluate(() => navigator.vendor)
  t.true(vendor === 'Google Inc.')
})

test('stealth: navigator.vendor set to custom value', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ vendor: 'Apple Computer, Inc.' })
  )
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const vendor = await page.evaluate(() => navigator.vendor)
  t.true(vendor === 'Apple Computer, Inc.')
})

test('stealth: will not leak modifications', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const test1 = await page.evaluate(
    () => Object.getOwnPropertyDescriptor(navigator, 'vendor') // Must be undefined if native
  )
  t.is(test1, undefined)

  const test2 = await page.evaluate(
    () => Object.getOwnPropertyNames(navigator) // Must be an empty array if native
  )
  t.deepEqual(test2, [])
})
