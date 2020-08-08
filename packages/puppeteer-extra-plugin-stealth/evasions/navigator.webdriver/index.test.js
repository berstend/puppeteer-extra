const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('../../test/util')
const Plugin = require('.')

test('vanilla: navigator.webdriver is defined', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const data = await page.evaluate(() => navigator.webdriver)
  t.is(data, true)
})

test('vanilla: navigator.__proto__.webdriver is defined', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const data = await page.evaluate(() =>
    Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(navigator),
      'webdriver'
    )
  )
  t.truthy(data)
})

test('stealth: navigator.__proto__.webdriver is not defined', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const data = await page.evaluate(() =>
    Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(navigator),
      'webdriver'
    )
  )
  t.is(data, undefined)
})

// https://github.com/berstend/puppeteer-extra/pull/130
test('stealth: regression: wont kill other navigator methods', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  try {
    const data = await page.evaluate(() => navigator.javaEnabled())
    t.is(data, false)
  } catch (err) {
    t.is(err, undefined)
  }
})
