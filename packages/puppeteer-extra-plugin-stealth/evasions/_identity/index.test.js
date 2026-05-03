const test = require('ava')

const {
  parseLocale,
  computeBrands,
  resolveChromiumIdentity,
  formatUserAgentOverride
} = require('./index')

test('parseLocale returns primary locale, language list, and header value', t => {
  t.deepEqual(parseLocale('en-US,en'), {
    locale: 'en-US',
    languages: ['en-US', 'en'],
    acceptLanguage: 'en-US,en;q=0.9'
  })

  t.deepEqual(parseLocale('de-DE,de;q=0.9'), {
    locale: 'de-DE',
    languages: ['de-DE', 'de'],
    acceptLanguage: 'de-DE,de;q=0.9'
  })
})

test('computeBrands emits current Chrome-style brands for Google Chrome', t => {
  t.deepEqual(computeBrands({ browserMajorVersion: 148, browserFamily: 'chrome' }), [
    { brand: 'Chromium', version: '148' },
    { brand: 'Google Chrome', version: '148' },
    { brand: 'Not/A)Brand', version: '99' }
  ])
})

test('resolveChromiumIdentity masks Linux by default for desktop stealth', t => {
  const input = {
    browserVersion: 'Chrome/148.0.7778.97',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.0.0 Safari/537.36',
    locale: 'en-US,en',
    runtimeArch: 'x64',
    framework: 'puppeteer',
    headless: true
  }

  const defaultIdentity = resolveChromiumIdentity(input)
  t.true(defaultIdentity.userAgent.includes('Windows NT 10.0; Win64; x64'))
  t.is(defaultIdentity.platform, 'Win32')
  t.false(defaultIdentity.userAgent.includes('HeadlessChrome/'))

  const nativeIdentity = resolveChromiumIdentity({ ...input, maskLinux: false })
  t.true(nativeIdentity.userAgent.includes('Linux x86_64'))
  t.is(nativeIdentity.platform, 'Linux')
})

test('resolveChromiumIdentity derives modern macOS UA-CH metadata', t => {
  const identity = resolveChromiumIdentity({
    browserVersion: 'Chrome/148.0.7778.97',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.0.0 Safari/537.36',
    locale: 'de-DE,de',
    runtimeArch: 'arm64',
    runtimePlatformVersion: '26.2.0',
    framework: 'puppeteer',
    headless: true
  })

  t.is(identity.browserFamily, 'chrome')
  t.is(identity.browserMajorVersion, 148)
  t.is(identity.browserFullVersion, '148.0.7778.97')
  t.is(identity.locale, 'de-DE')
  t.deepEqual(identity.languages, ['de-DE', 'de'])
  t.is(identity.acceptLanguage, 'de-DE,de;q=0.9')
  t.is(identity.platform, 'MacIntel')
  t.false(identity.userAgent.includes('HeadlessChrome/'))
  t.deepEqual(identity.userAgentMetadata, {
    brands: [
      { brand: 'Chromium', version: '148' },
      { brand: 'Google Chrome', version: '148' },
      { brand: 'Not/A)Brand', version: '99' }
    ],
    fullVersion: '148.0.7778.97',
    fullVersionList: [
      { brand: 'Chromium', version: '148.0.7778.97' },
      { brand: 'Google Chrome', version: '148.0.7778.97' },
      { brand: 'Not/A)Brand', version: '99.0.0.0' }
    ],
    platform: 'macOS',
    platformVersion: '26.2.0',
    architecture: 'arm',
    bitness: '64',
    model: '',
    mobile: false,
    wow64: false
  })
})

test('formatUserAgentOverride emits CDP-ready payload', t => {
  const identity = resolveChromiumIdentity({
    browserVersion: 'Chrome/148.0.7778.97',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.0.0 Safari/537.36',
    locale: 'de-DE,de',
    runtimeArch: 'arm64',
    runtimePlatformVersion: '26.2.0',
    framework: 'playwright',
    headless: true
  })

  t.deepEqual(formatUserAgentOverride(identity), {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
    acceptLanguage: 'de-DE,de',
    platform: 'MacIntel',
    userAgentMetadata: identity.userAgentMetadata
  })

  t.deepEqual(formatUserAgentOverride(identity, { includeAcceptLanguage: false }), {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
    platform: 'MacIntel',
    userAgentMetadata: identity.userAgentMetadata
  })
})
