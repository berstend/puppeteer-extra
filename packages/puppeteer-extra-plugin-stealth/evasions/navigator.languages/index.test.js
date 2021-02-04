const test = require('ava')

const {
  getVanillaFingerPrint,
  getStealthFingerPrint
} = require('../../test/util')
const { vanillaPuppeteer, addExtra } = require('../../test/util')

const Plugin = require('.')

// TODO: Vanilla seems fine, evasion obsolete?
// Note: We keep it around for now, as we will need this method in a fingerprinting plugin later anyway
test('vanilla: is array with en-US', async t => {
  const { languages } = await getVanillaFingerPrint()
  t.is(Array.isArray(languages), true)
  t.is(languages[0], 'en-US')
})

test('vanilla: will not have modifications', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const test1 = await page.evaluate(
    () => Object.getOwnPropertyDescriptor(navigator, 'languages') // Must be undefined if native
  )
  t.is(test1, undefined)

  const test2 = await page.evaluate(
    () => Object.getOwnPropertyNames(navigator) // Must be an empty array if native
  )
  t.false(test2.includes('languages'))
})

test('stealth: is array with en-US', async t => {
  const { languages } = await getStealthFingerPrint(Plugin)
  t.is(Array.isArray(languages), true)
  t.is(languages[0], 'en-US')
})

test('stealth: customized value', async t => {
  const { languages } = await getStealthFingerPrint(Plugin, null, {
    languages: ['foo', 'bar']
  })
  t.deepEqual(languages, ['foo', 'bar'])
})

test('stealth: will not leak modifications', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const test1 = await page.evaluate(
    () => Object.getOwnPropertyDescriptor(navigator, 'languages') // Must be undefined if native
  )
  t.is(test1, undefined)

  const test2 = await page.evaluate(
    () => Object.getOwnPropertyNames(navigator) // Must be an empty array if native
  )
  t.false(test2.includes('languages'))
})

test('stealth: does patch getters properly', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const results = await page.evaluate(() => {
    const hasInvocationError = (() => {
      try {
        // eslint-disable-next-line dot-notation
        Object['seal'](Object.getPrototypeOf(navigator)['languages'])
        return false
      } catch (err) {
        return true
      }
    })()
    const hasPushError = (() => {
      try {
        // eslint-disable-next-line dot-notation
        navigator.languages.push(null)
        return false
      } catch (err) {
        return true
      }
    })()
    return {
      hasInvocationError,
      hasPushError,
      toString: Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(navigator),
        'languages'
      ).get.toString()
    }
  })

  t.deepEqual(results, {
    hasInvocationError: true,
    hasPushError: true,
    toString: 'function get languages() { [native code] }'
  })
})
