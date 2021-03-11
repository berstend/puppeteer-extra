const test = require('ava')

const { vanillaPuppeteer, addExtra, compareLooseVersionStrings } = require('../../test/util')
const Plugin = require('.')

function getExpectedValue(looseVersionString) {
  if (compareLooseVersionStrings(looseVersionString, '89.0.4339.0') >= 0) {
    return false
  } else {
    return undefined
  }
}

test('vanilla: navigator.webdriver is defined', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const data = await page.evaluate(() => navigator.webdriver)
  t.is(data, true)
})

test('stealth: navigator.webdriver is undefined', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const data = await page.evaluate(() => navigator.webdriver)
  // XXX: launch this test multiple times with browsers of different versions?
  t.is(data, getExpectedValue(await browser.version()))
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
