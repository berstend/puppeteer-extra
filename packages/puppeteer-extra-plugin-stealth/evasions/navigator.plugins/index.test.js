const test = require('ava')

const {
  getVanillaFingerPrint,
  getStealthFingerPrint
} = require('../../test/util')
const { vanillaPuppeteer, addExtra } = require('../../test/util')

const Plugin = require('.')

test('vanilla: empty plugins, empty mimetypes', async t => {
  const { plugins, mimeTypes } = await getVanillaFingerPrint()
  t.is(plugins.length, 0)
  t.is(mimeTypes.length, 0)
})

test('vanilla: will not have modifications', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const test1 = await page.evaluate(() => ({
    mimeTypes: Object.getOwnPropertyDescriptor(navigator, 'mimeTypes'), // Must be undefined if native
    plugins: Object.getOwnPropertyDescriptor(navigator, 'plugins') // Must be undefined if native
  }))
  t.is(test1.mimeTypes, undefined)
  t.is(test1.plugins, undefined)

  const test2 = await page.evaluate(
    () => Object.getOwnPropertyNames(navigator) // Must be an empty array if native
  )
  t.deepEqual(test2, [])
})

test('stealth: has plugin, has mimetypes', async t => {
  const { plugins, mimeTypes } = await getStealthFingerPrint(Plugin)
  t.is(plugins.length, 3)
  t.is(mimeTypes.length, 4)
})

test('stealth: will not leak modifications', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const test1 = await page.evaluate(() => ({
    mimeTypes: Object.getOwnPropertyDescriptor(navigator, 'mimeTypes'), // Must be undefined if native
    plugins: Object.getOwnPropertyDescriptor(navigator, 'plugins') // Must be undefined if native
  }))
  t.is(test1.mimeTypes, undefined)
  t.is(test1.plugins, undefined)

  const test2 = await page.evaluate(
    () => Object.getOwnPropertyNames(navigator) // Must be an empty array if native
  )
  t.deepEqual(test2, [])

  const test3 = await page.evaluate(
    _ => navigator.mimeTypes[0].enabledPlugin // should not throw an error
  )
  t.deepEqual(test3, { '0': {} })

  const test4 = await page.evaluate(
    _ => navigator.mimeTypes['application/pdf'].enabledPlugin // should not throw an error
  )
  t.deepEqual(test4, { '0': {} })

  const test5 = await page.evaluate(_ => navigator.plugins[0].length)
  t.deepEqual(test5, 1)

  const test6 = await page.evaluate(_ => navigator.mimeTypes[0].length)
  t.is(test6, undefined)

  const test7 = await page.evaluate(_ => Object.getOwnPropertyDescriptor(navigator.plugins[0], 'length'))
  t.is(test7, undefined)
})
