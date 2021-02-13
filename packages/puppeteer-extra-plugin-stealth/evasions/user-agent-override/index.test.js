const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('../../test/util')
const Plugin = require('.')

// Fixed since 2.1.1?
// test('vanilla: Accept-Language header is missing', async t => {
//   const browser = await vanillaPuppeteer.launch({ headless: true })
//   const page = await browser.newPage()
//   await page.goto('http://httpbin.org/headers')

//   const content = await page.content()
//   t.true(content.includes(`"User-Agent"`))
//   t.false(content.includes(`"Accept-Language"`))
// })

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

  const langs = await page.evaluate(() => navigator.languages)
  t.deepEqual(langs, ['de-DE', 'de'])
  const lang = await page.evaluate(() => navigator.language)
  t.deepEqual(lang, 'de-DE')
})

test('stealth: navigator.platform with maskLinux true (default)', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({
      userAgent:
        'Mozilla/5.0 (X11; Ubuntu; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.9.9999.99 Safari/537.36'
    })
  )
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const platform = await page.evaluate(() => navigator.platform)
  t.true(platform === 'Win32')
})

test('stealth: navigator.platform with maskLinux false', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({
      userAgent:
        'Mozilla/5.0 (X11; Ubuntu; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.9.9999.99 Safari/537.36',
      maskLinux: false
    })
  )
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const platform = await page.evaluate(() => navigator.platform)
  t.true(platform === 'Linux')
})

const _testUAHint = async (userAgent, locale) => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ userAgent, locale })
  )

  const browser = await puppeteer.launch({
    headless: false, // only works on headful
    args: ['--enable-features=UserAgentClientHint']
  })

  const majorVersion = parseInt(
    (await browser.version()).match(/\/([^\.]+)/)[1]
  )
  if (majorVersion < 88) {
    return null // Skip test on browsers that don't support UA hints
  }

  const page = await browser.newPage()

  await page.goto('https://headers.cf/headers/?format=raw')

  return page
}

test('stealth: test if UA hints are correctly set - Windows 10', async t => {
  const page = await _testUAHint(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36',
    'en-AU'
  )
  if (!page) {
    t.true(true) // skip
    return
  }
  const firstLoad = await page.content()
  t.true(
    firstLoad.includes(
      `sec-ch-ua: "Google Chrome";v="99", " Not;A Brand";v="99", "Chromium";v="99"`
    )
  )
  t.true(firstLoad.includes(`Accept-Language: en-AU`))

  await page.reload()
  const secondLoad = await page.content()
  if (secondLoad.includes('sec-ch-ua-full-version')) {
    t.true(secondLoad.includes('sec-ch-ua-mobile: ?0'))
    t.true(secondLoad.includes('sec-ch-ua-full-version: "99.0.9999.99"'))
    t.true(secondLoad.includes('sec-ch-ua-arch: "x86"'))
    t.true(secondLoad.includes('sec-ch-ua-platform: "Windows"'))
    t.true(secondLoad.includes('sec-ch-ua-platform-version: "10.0"'))
    t.true(secondLoad.includes('sec-ch-ua-model: ""'))
  }
})

test('stealth: test if UA hints are correctly set - macOS 11', async t => {
  const page = await _testUAHint(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36',
    'de-DE'
  )
  if (!page) {
    t.true(true) // skip
    return
  }
  const firstLoad = await page.content()
  t.true(
    firstLoad.includes(
      `sec-ch-ua: "Google Chrome";v="99", " Not;A Brand";v="99", "Chromium";v="99"`
    )
  )
  t.true(firstLoad.includes(`Accept-Language: de-DE`))

  await page.reload()
  const secondLoad = await page.content()
  if (secondLoad.includes('sec-ch-ua-full-version')) {
    t.true(secondLoad.includes('sec-ch-ua-mobile: ?0'))
    t.true(secondLoad.includes('sec-ch-ua-full-version: "99.0.9999.99"'))
    t.true(secondLoad.includes('sec-ch-ua-arch: "x86"'))
    t.true(secondLoad.includes('sec-ch-ua-platform: "Mac OS X"'))
    t.true(secondLoad.includes('sec-ch-ua-platform-version: "11_1_0"'))
    t.true(secondLoad.includes('sec-ch-ua-model: ""'))
  }
})

test('stealth: test if UA hints are correctly set - Android 10', async t => {
  const page = await _testUAHint(
    'Mozilla/5.0 (Linux; Android 10; SM-P205) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36',
    'nl-NL'
  )
  if (!page) {
    t.true(true) // skip
    return
  }
  const firstLoad = await page.content()
  t.true(
    firstLoad.includes(
      `sec-ch-ua: "Google Chrome";v="99", " Not;A Brand";v="99", "Chromium";v="99"`
    )
  )
  t.true(firstLoad.includes(`Accept-Language: nl-NL`))

  await page.reload()
  const secondLoad = await page.content()

  if (secondLoad.includes('sec-ch-ua-full-version')) {
    t.true(secondLoad.includes('sec-ch-ua-mobile: ?1'))
    t.true(secondLoad.includes('sec-ch-ua-full-version: "99.0.9999.99"'))
    t.true(secondLoad.includes('sec-ch-ua-arch: ""'))
    t.true(secondLoad.includes('sec-ch-ua-platform: "Android"'))
    t.true(secondLoad.includes('sec-ch-ua-platform-version: "10"'))
    t.true(secondLoad.includes('sec-ch-ua-model: "SM-P205"'))
  }
})
