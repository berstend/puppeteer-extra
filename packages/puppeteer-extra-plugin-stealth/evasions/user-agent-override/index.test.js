const test = require('ava')

const { vanillaPuppeteer, addExtra } = require('../../test/util')
const Plugin = require('.')

// Fixed since 2.1.1?
// test('vanilla: Accept-Language header is missing', async t => {
//   const browser = await vanillaPuppeteer.launch({ headless: true })
//   const page = await browser.newPage()
//   await page.goto('http://httpbin.org/headers')
//
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
  t.true(Array.isArray(lang) && lang[0] === 'en-US')
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
  t.true(Array.isArray(lang) && lang[0] === 'en-US')
})

test('stealth: navigator.languages with custom locale', async t => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ locale: 'de-DE,de' })
  )
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const langs = await page.evaluate(() => navigator.languages)
  t.true(Array.isArray(langs) && langs[0] === 'de-DE')
  const lang = await page.evaluate(() => navigator.language)
  t.deepEqual(lang, 'de-DE')
})

test('stealth: navigator.platform masks Linux by default', async t => {
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
    headless: true
  })

  const majorVersion = parseInt((await browser.version()).match(/\/([^\.]+)/)[1])
  if (majorVersion < 88) {
    await browser.close()
    return null // Skip test on browsers that don't support UA hints
  }

  const page = await browser.newPage()
  await page.goto('https://example.com')

  const snapshot = await page.evaluate(userAgentSnapshot)
  await browser.close()
  return snapshot
}

async function userAgentSnapshot() {
  if (!('userAgentData' in navigator)) {
    return undefined
  }

  const UADataProps = ['brands', 'mobile']
  const UADataValues = [
    'architecture',
    'bitness',
    'model',
    'platform',
    'platformVersion',
    'uaFullVersion',
    'fullVersionList',
    'wow64'
  ]

  const highEntropy = await navigator.userAgentData.getHighEntropyValues(
    UADataValues
  )

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: navigator.languages,
    uaData: {
      ...highEntropy,
      ...Object.fromEntries(UADataProps.map(k => [k, navigator.userAgentData[k]]))
    }
  }
}

test('stealth: test if UA hints are correctly set - Windows 10', async t => {
  const snapshot = await _testUAHint(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36',
    'en-AU'
  )
  if (!snapshot) {
    t.pass()
    return
  }

  t.is(snapshot.userAgent, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36')
  t.is(snapshot.platform, 'Win32')
  t.is(snapshot.language, 'en-AU')
  t.true(Array.isArray(snapshot.languages) && snapshot.languages[0] === 'en-AU')
  t.is(snapshot.uaData.mobile, false)
  t.is(snapshot.uaData.architecture, 'x86')
  t.is(snapshot.uaData.bitness, '64')
  t.is(snapshot.uaData.platform, 'Windows')
  t.is(snapshot.uaData.platformVersion, '10.0')
  t.is(snapshot.uaData.uaFullVersion, '99.0.9999.99')
  t.deepEqual(snapshot.uaData.brands, [
    { brand: 'Chromium', version: '99' },
    { brand: 'Google Chrome', version: '99' },
    { brand: 'Not/A)Brand', version: '99' }
  ])
})

test('stealth: test if UA hints are correctly set - macOS 11', async t => {
  const snapshot = await _testUAHint(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36',
    'de-DE'
  )
  if (!snapshot) {
    t.pass()
    return
  }

  t.is(snapshot.userAgent, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36')
  t.is(snapshot.platform, 'MacIntel')
  t.is(snapshot.language, 'de-DE')
  t.true(Array.isArray(snapshot.languages) && snapshot.languages[0] === 'de-DE')
  t.is(snapshot.uaData.mobile, false)
  t.is(snapshot.uaData.architecture, 'x86')
  t.is(snapshot.uaData.bitness, '64')
  t.is(snapshot.uaData.platform, 'macOS')
  t.is(snapshot.uaData.platformVersion, '11_1_0')
  t.is(snapshot.uaData.uaFullVersion, '99.0.9999.99')
  t.deepEqual(snapshot.uaData.brands, [
    { brand: 'Chromium', version: '99' },
    { brand: 'Google Chrome', version: '99' },
    { brand: 'Not/A)Brand', version: '99' }
  ])
})

test('stealth: test if UA hints are correctly set - Android 10', async t => {
  const snapshot = await _testUAHint(
    'Mozilla/5.0 (Linux; Android 10; SM-P205) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36',
    'nl-NL'
  )
  if (!snapshot) {
    t.pass()
    return
  }

  t.is(snapshot.userAgent, 'Mozilla/5.0 (Linux; Android 10; SM-P205) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36')
  t.is(snapshot.platform, 'Android')
  t.is(snapshot.language, 'nl-NL')
  t.true(Array.isArray(snapshot.languages) && snapshot.languages[0] === 'nl-NL')
  t.is(snapshot.uaData.mobile, true)
  t.is(snapshot.uaData.architecture, '')
  t.is(snapshot.uaData.bitness, '')
  t.is(snapshot.uaData.model, 'SM-P205')
  t.is(snapshot.uaData.platform, 'Android')
  t.is(snapshot.uaData.platformVersion, '10')
  t.is(snapshot.uaData.uaFullVersion, '99.0.9999.99')
  t.deepEqual(snapshot.uaData.brands, [
    { brand: 'Chromium', version: '99' },
    { brand: 'Google Chrome', version: '99' },
    { brand: 'Not/A)Brand', version: '99' }
  ])
})

async function userAgentData() {
  if (!('userAgentData' in navigator)) {
    return undefined
  }

  // https://wicg.github.io/ua-client-hints/#getHighEntropyValues
  const UADataProps = ['brands', 'mobile']
  const UADataValues = [
    'architecture', // "arm"
    'bitness', // "64"
    'model', // "X644GTM"
    'platform', // "PhoneOS"
    'platformVersion', // "10A"
    'uaFullVersion', // "73.32.AGX.5"
    'fullVersionList',
    'wow64'
  ]

  const highEntropy = await navigator.userAgentData.getHighEntropyValues(
    UADataValues
  )

  const result = {
    ...highEntropy,
    ...Object.fromEntries(UADataProps.map(k => [k, navigator.userAgentData[k]]))
  }
  return result
}

test('stealth: test if UA hints are correctly set - Windows 10 Generic', async t => {
  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36'
  const locale = 'en-AU'

  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({
      userAgent,
      locale
    })
  )
  const browser = await puppeteer.launch({
    headless: true
  })

  const majorVersion = parseInt((await browser.version()).match(/\/([^\.]+)/)[1])
  if (majorVersion < 90) {
    t.truthy('foo')
    console.log('Skipping test, browser version too old', majorVersion)
    await browser.close()
    return
  }
  const page = await browser.newPage()
  await page.goto('https://example.com') // secure context

  const results = await page.evaluate(userAgentData)
  t.is(results.platform, 'Windows')
  t.is(results.platformVersion, '10.0')
  t.is(results.uaFullVersion, '99.0.9999.99')

  const language = await page.evaluate(() => navigator.language)
  t.is(language, locale)
  await browser.close()
})
