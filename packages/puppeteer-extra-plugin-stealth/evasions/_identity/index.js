'use strict'

function parseLocale(locale = 'en-US,en') {
  const rawEntries = String(locale)
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)

  const languages = rawEntries.map(entry => entry.split(';')[0].trim()).filter(Boolean)
  const primaryLocale = languages[0] || 'en-US'

  const acceptLanguage = languages
    .map((language, index) => {
      if (index === 0) {
        return language
      }
      const qValue = Math.max(0.1, 1 - index * 0.1).toFixed(1)
      return `${language};q=${qValue}`
    })
    .join(',')

  return {
    locale: primaryLocale,
    languages,
    acceptLanguage
  }
}

function parseBrowserFullVersion(input = '') {
  if (!input) {
    return null
  }
  const match = String(input).match(/(?:Chrome|Chromium|HeadlessChrome)\/(\d+(?:\.\d+){0,3})|(\d+(?:\.\d+){3})/)
  if (!match) {
    return null
  }
  return match[1] || match[2] || null
}

function parseBrowserMajorVersion(input) {
  const fullVersion = parseBrowserFullVersion(input)
  if (!fullVersion) {
    return null
  }
  const majorVersion = Number.parseInt(fullVersion.split('.')[0], 10)
  return Number.isNaN(majorVersion) ? null : majorVersion
}

function detectBrowserFamily({ browserFamily, browserVersion, executablePath, channel, userAgent }) {
  if (browserFamily) {
    return browserFamily
  }

  const hints = [browserVersion, executablePath, channel, userAgent]
    .filter(Boolean)
    .map(value => String(value).toLowerCase())

  if (hints.some(value => value.includes('chromium'))) {
    return 'chromium'
  }
  if (hints.some(value => value.includes('headlesschrome') || value.includes('chrome'))) {
    return 'chrome'
  }
  return 'chrome'
}

function stripHeadlessFromUserAgent(userAgent = '') {
  return String(userAgent).replace('HeadlessChrome/', 'Chrome/')
}

function shouldMaskLinux(userAgent = '') {
  return userAgent.includes('Linux') && !userAgent.includes('Android')
}

function maskLinuxUserAgent(userAgent) {
  return userAgent.replace(/\(([^)]+)\)/, '(Windows NT 10.0; Win64; x64)')
}

function isMobileUserAgent(userAgent = '') {
  return userAgent.includes('Android')
}

function resolveArchitectureFromRuntime({ runtimeArch, mobile }) {
  if (mobile || !runtimeArch) {
    return ''
  }

  switch (String(runtimeArch).toLowerCase()) {
    case 'arm64':
    case 'aarch64':
    case 'arm':
      return 'arm'
    case 'x64':
    case 'amd64':
    case 'x86_64':
    case 'ia32':
    case 'x32':
      return 'x86'
    default:
      return ''
  }
}

function resolveBitnessFromRuntime({ runtimeArch, mobile }) {
  if (mobile || !runtimeArch) {
    return ''
  }

  switch (String(runtimeArch).toLowerCase()) {
    case 'arm64':
    case 'aarch64':
    case 'x64':
    case 'amd64':
    case 'x86_64':
      return '64'
    case 'ia32':
    case 'x32':
      return '32'
    default:
      return ''
  }
}


function resolveArchitectureFromUserAgent(userAgent = '', mobile = false) {
  if (mobile) {
    return ''
  }
  const normalized = userAgent.toLowerCase()
  if (normalized.includes('arm') || normalized.includes('aarch64')) {
    return 'arm'
  }
  if (normalized.includes('win') || normalized.includes('mac os x') || normalized.includes('linux')) {
    return 'x86'
  }
  return ''
}

function resolveBitnessFromUserAgent(userAgent = '', mobile = false) {
  if (mobile) {
    return ''
  }
  const normalized = userAgent.toLowerCase()
  if (normalized.includes('i686') || normalized.includes('x86;') || normalized.includes(' x86)')) {
    return '32'
  }
  if (normalized.includes('win') || normalized.includes('mac os x') || normalized.includes('linux')) {
    return '64'
  }
  return ''
}

function resolveModel(userAgent = '', mobile = false) {
  if (!mobile) {
    return ''
  }
  const match = userAgent.match(/Android [^;]+;\s*([^)]+)\)/)
  return match ? match[1].trim() : ''
}

function resolvePlatformDescriptor({ userAgent, runtimePlatformVersion, customUserAgent }) {
  if (userAgent.includes('Android')) {
    const match = userAgent.match(/Android\s([^;]+)/)
    return {
      navigatorPlatform: 'Android',
      platform: 'Android',
      platformVersion: match ? match[1].trim() : ''
    }
  }

  if (userAgent.includes('Mac OS X')) {
    const match = userAgent.match(/Mac OS X\s([^)]+)/)
    return {
      navigatorPlatform: 'MacIntel',
      platform: 'macOS',
      platformVersion: customUserAgent ? (match ? match[1] : '') : (runtimePlatformVersion || (match ? match[1] : ''))
    }
  }

  if (userAgent.includes('Windows')) {
    const match = userAgent.match(/Windows NT\s([\d.]+)/)
    return {
      navigatorPlatform: 'Win32',
      platform: 'Windows',
      platformVersion: match ? match[1] : ''
    }
  }

  if (userAgent.includes('Linux')) {
    return {
      navigatorPlatform: 'Linux',
      platform: 'Linux',
      platformVersion: runtimePlatformVersion || ''
    }
  }

  return {
    navigatorPlatform: '',
    platform: '',
    platformVersion: runtimePlatformVersion || ''
  }
}

function computeBrands({ browserMajorVersion, browserFamily }) {
  const majorVersion = String(browserMajorVersion || 0)
  const grease = { brand: 'Not/A)Brand', version: '99' }
  const chromium = { brand: 'Chromium', version: majorVersion }

  if (browserFamily === 'chromium') {
    return [chromium, grease]
  }

  return [chromium, { brand: 'Google Chrome', version: majorVersion }, grease]
}

function computeFullVersionList({ browserFullVersion, browserFamily }) {
  const fullVersion = browserFullVersion || '0.0.0.0'
  const grease = { brand: 'Not/A)Brand', version: '99.0.0.0' }
  const chromium = { brand: 'Chromium', version: fullVersion }

  if (browserFamily === 'chromium') {
    return [chromium, grease]
  }

  return [chromium, { brand: 'Google Chrome', version: fullVersion }, grease]
}

function buildUserAgentMetadata({ browserFamily, browserMajorVersion, browserFullVersion, platform, platformVersion, architecture, bitness, model, mobile }) {
  return {
    brands: computeBrands({ browserMajorVersion, browserFamily }),
    fullVersion: browserFullVersion,
    fullVersionList: computeFullVersionList({ browserFullVersion, browserFamily }),
    platform,
    platformVersion,
    architecture,
    bitness,
    model,
    mobile,
    wow64: false
  }
}

function resolveChromiumIdentity(input = {}) {
  const locale = parseLocale(input.locale)
  let userAgent = stripHeadlessFromUserAgent(input.userAgent || '')

  if (input.maskLinux !== false && shouldMaskLinux(userAgent)) {
    userAgent = maskLinuxUserAgent(userAgent)
  }

  const browserFullVersion = input.customUserAgent
    ? parseBrowserFullVersion(userAgent) || parseBrowserFullVersion(input.browserVersion)
    : parseBrowserFullVersion(input.browserVersion) || parseBrowserFullVersion(userAgent)
  const browserMajorVersion = parseBrowserMajorVersion(browserFullVersion || userAgent)
  const browserFamily = detectBrowserFamily({
    browserFamily: input.browserFamily,
    browserVersion: input.browserVersion,
    executablePath: input.executablePath,
    channel: input.channel,
    userAgent
  })
  const mobile = isMobileUserAgent(userAgent)
  const hasCustomUserAgent = !!input.customUserAgent
  const platformDescriptor = resolvePlatformDescriptor({
    userAgent,
    runtimePlatformVersion: input.runtimePlatformVersion,
    customUserAgent: hasCustomUserAgent
  })
  const architecture =
    input.architecture ||
    (hasCustomUserAgent
      ? resolveArchitectureFromUserAgent(userAgent, mobile)
      : resolveArchitectureFromRuntime({
          runtimeArch: input.runtimeArch,
          mobile
        }))
  const bitness =
    input.bitness ||
    (hasCustomUserAgent
      ? resolveBitnessFromUserAgent(userAgent, mobile)
      : resolveBitnessFromRuntime({
          runtimeArch: input.runtimeArch,
          mobile
        }))
  const model = input.model !== undefined ? input.model : resolveModel(userAgent, mobile)
  const userAgentMetadata = buildUserAgentMetadata({
    browserFamily,
    browserMajorVersion,
    browserFullVersion,
    platform: platformDescriptor.platform,
    platformVersion: platformDescriptor.platformVersion,
    architecture,
    bitness,
    model,
    mobile
  })

  return {
    browserFamily,
    browserMajorVersion,
    browserFullVersion,
    framework: input.framework || 'puppeteer',
    headless: input.headless ?? null,
    userAgent,
    locale: locale.locale,
    languages: locale.languages,
    acceptLanguage: locale.acceptLanguage,
    platform: platformDescriptor.navigatorPlatform,
    userAgentMetadata
  }
}

function formatUserAgentOverride(identity, { includeAcceptLanguage = true } = {}) {
  const override = {
    userAgent: identity.userAgent,
    platform: identity.platform,
    userAgentMetadata: identity.userAgentMetadata
  }

  if (includeAcceptLanguage && identity.languages) {
    override.acceptLanguage = identity.languages.join(',')
  }

  return override
}

module.exports = {
  parseLocale,
  parseBrowserFullVersion,
  parseBrowserMajorVersion,
  detectBrowserFamily,
  computeBrands,
  computeFullVersionList,
  buildUserAgentMetadata,
  resolveChromiumIdentity,
  formatUserAgentOverride
}
