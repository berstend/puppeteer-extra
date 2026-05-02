import { test, expect } from '../fixtures/extra'

import UserAgentOverride from 'puppeteer-extra-plugin-stealth/evasions/user-agent-override'

test('user-agent-override carries Chromium identity into Playwright contexts', async ({
  browserName,
  extraLauncher,
  _browserOptions
}) => {
  test.skip(browserName !== 'chromium', 'Chromium only')

  extraLauncher.use(
    UserAgentOverride({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36',
      locale: 'de-DE,de'
    })
  )

  const browser = await extraLauncher.launch({
    ..._browserOptions,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        }
      : {})
  })

  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('https://example.com')

  const snapshot = await page.evaluate(async () => {
    const uaData = 'userAgentData' in navigator
      ? await navigator.userAgentData.getHighEntropyValues([
          'architecture',
          'bitness',
          'platform',
          'platformVersion',
          'uaFullVersion',
          'fullVersionList',
          'wow64'
        ])
      : null

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      brands: 'userAgentData' in navigator ? navigator.userAgentData.brands : [],
      mobile: 'userAgentData' in navigator ? navigator.userAgentData.mobile : null,
      uaData
    }
  })

  expect(snapshot.userAgent).toBe(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36'
  )
  expect(snapshot.platform).toBe('Win32')
  expect(snapshot.language).toBe('de-DE')
  expect(snapshot.languages[0]).toBe('de-DE')
  expect(snapshot.mobile).toBe(false)
  expect(snapshot.uaData?.architecture).toBe('x86')
  expect(snapshot.uaData?.bitness).toBe('64')
  expect(snapshot.uaData?.platform).toBe('Windows')
  expect(snapshot.uaData?.platformVersion).toBe('10.0')
  expect(snapshot.uaData?.uaFullVersion).toBe('99.0.9999.99')
  expect(snapshot.brands).toStrictEqual([
    { brand: 'Chromium', version: '99' },
    { brand: 'Google Chrome', version: '99' },
    { brand: 'Not/A)Brand', version: '99' }
  ])

  await browser.close()
})
