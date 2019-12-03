const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('../../test/util')
const Plugin = require('.')

test('vanilla: is missing Accept-Language in headless', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('http://httpbin.org/headers')

  const content = await page.content()
  t.true(content.includes(`"User-Agent"`))
  t.false(content.includes(`"Accept-Language"`))
})

test('stealth: has Accept-Language in headless with default locale', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())

  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('http://httpbin.org/headers')

  const content = await page.content()
  t.true(content.includes(`"User-Agent"`))
  t.true(content.includes(`"Accept-Language": "en-US,en;q=0.9"`))
})

test('stealth: has Accept-Language in headless with optional locale', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ locale: 'de-DE,de;q=0.9' })
  )

  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('http://httpbin.org/headers')

  const content = await page.content()
  t.true(content.includes(`"User-Agent"`))
  t.true(content.includes(`"Accept-Language": "de-DE,de;q=0.9"`))
})
