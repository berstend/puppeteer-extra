const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('../../test/util')
const Plugin = require('.')

test('vanilla: navigator.vendor is always Google Inc.', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const vendor = await page.evaluate(() => navigator.vendor)
  t.is(vendor, 'Google Inc.')
})

test('stealth: navigator.vendor set to custom value', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ vendor: 'Apple Computer, Inc.' })
  )
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const vendor = await page.evaluate(() => navigator.vendor)
  t.is(vendor, 'Apple Computer, Inc.')
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
  t.false(test2.includes('vendor'))
})

test('stealth: does patch getters properly', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const results = await page.evaluate(() => {
    const hasInvocationError = (() => {
      try {
        // eslint-disable-next-line dot-notation
        Object['seal'](Object.getPrototypeOf(navigator)['vendor'])
        return false
      } catch (err) {
        return true
      }
    })()
    return {
      hasInvocationError,
      toString: Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(navigator),
        'vendor'
      ).get.toString()
    }
  })

  t.deepEqual(results, {
    hasInvocationError: true,
    toString: 'function get vendor() { [native code] }'
  })
})
