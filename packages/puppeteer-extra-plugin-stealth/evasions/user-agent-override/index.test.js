const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('../../test/util')
const Plugin = require('.')

test('vanilla: Accept-Language header is missing', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('http://httpbin.org/headers')

  const content = await page.content()
  t.true(content.includes(`"User-Agent"`))
  t.false(content.includes(`"Accept-Language"`))
})

test('vanilla: User-Agent header contains HeadlessChrome', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('http://httpbin.org/headers')

  const content = await page.content()
  t.true(content.includes(`"User-Agent"`))
  t.true(content.includes(`HeadlessChrome`))
})

test('vanilla: navigator.languages is always en-US', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()
  const lang = await page.evaluate(() => navigator.languages)
  t.true(lang.length === 1 && lang[0] === 'en-US')
})

test('vanilla: navigator.platform set to host platform', async t => {
  const browser = await vanillaPuppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const platform = await page.evaluate(() => navigator.platform)
  switch (process.platform) {
    case 'linux':
      t.true(platform.includes('Linux')) // TravisCI
      break
    case 'darwin':
      t.true(platform === 'MacIntel')
      break
    case 'win32':
      t.true(platform === 'Win32')
      break
    default:
      t.true(platform === process.platform)
  }
})

test('stealth: Accept-Language header with default locale', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('http://httpbin.org/headers')

  const content = await page.content()
  t.true(content.includes(`"User-Agent"`))
  t.true(content.includes(`"Accept-Language": "en-US,en;q=0.9"`))
})

test('stealth: Accept-Language header with optional locale', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ locale: 'de-DE,de' })
  )
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('http://httpbin.org/headers')

  const content = await page.content()
  t.true(content.includes(`"User-Agent"`))
  t.true(content.includes(`"Accept-Language": "de-DE,de;q=0.9"`))
})

test('stealth: User-Agent header does not contain HeadlessChrome', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('http://httpbin.org/headers')

  const content = await page.content()
  t.true(content.includes(`"User-Agent"`))
  t.false(content.includes(`HeadlessChrome`))
})

test('stealth: User-Agent header with custom userAgent', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ userAgent: 'MyFunkyUA/1.0' })
  )
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('http://httpbin.org/headers')

  const content = await page.content()
  t.true(content.includes(`"User-Agent": "MyFunkyUA/1.0"`))
})

test('stealth: navigator.languages with default locale', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const lang = await page.evaluate(() => navigator.languages)
  t.true(lang.length === 2 && lang[0] === 'en-US' && lang[1] === 'en')
})

test('stealth: navigator.languages with custom locale', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ locale: 'de-DE,de' })
  )
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const lang = await page.evaluate(() => navigator.languages)
  t.true(lang.length === 2 && lang[0] === 'de-DE' && lang[1] === 'de')
})

test('stealth: navigator.platform with default platform', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin())
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const platform = await page.evaluate(() => navigator.platform)
  t.true(platform === 'Win32')
})

test('stealth: navigator.platform with custom platform', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ platform: 'MyFunkyPlatform' })
  )
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const platform = await page.evaluate(() => navigator.platform)
  t.true(platform === 'MyFunkyPlatform')
})
