const test = require('ava')
const os = require('os')

const { vanillaPuppeteer, addExtra } = require('../../test/util')

const {
  getVanillaFingerPrint,
  getStealthFingerPrint
} = require('../../test/util')
const Plugin = require('.')

const fingerprintFn = page => page.evaluate('navigator.hardwareConcurrency')

test('vanilla: matches real core count', async t => {
  const { pageFnResult } = await getVanillaFingerPrint(fingerprintFn)
  t.is(pageFnResult, os.cpus().length)
})

test('stealth: default is set to 4', async t => {
  const { pageFnResult } = await getStealthFingerPrint(Plugin, fingerprintFn)
  t.is(pageFnResult, 4)
})

test('stealth: will override value correctly', async t => {
  const { pageFnResult } = await getStealthFingerPrint(Plugin, fingerprintFn, {
    hardwareConcurrency: 8
  })
  t.is(pageFnResult, 8)
})

test('stealth: does patch getters properly', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const results = await page.evaluate(() => {
    const hasInvocationError = (() => {
      try {
        // eslint-disable-next-line dot-notation
        Object['seal'](Object.getPrototypeOf(navigator)['hardwareConcurrency'])
        return false
      } catch (err) {
        return true
      }
    })()
    return {
      hasInvocationError,
      toString: Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(navigator),
        'hardwareConcurrency'
      ).get.toString()
    }
  })

  t.deepEqual(results, {
    hasInvocationError: true,
    toString: 'function get hardwareConcurrency() { [native code] }'
  })
})
