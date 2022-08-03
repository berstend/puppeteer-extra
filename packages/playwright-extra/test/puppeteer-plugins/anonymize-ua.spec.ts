import { test, expect } from '../fixtures/extra'

import AnonymizeUAPlugin from 'puppeteer-extra-plugin-anonymize-ua'

test('puppeteer-extra-plugin-anonymize-ua will remove headless', async ({
  browserName,
  extraLauncher,
  _browserOptions
}) => {
  test.skip(browserName !== 'chromium', 'Chromium only')

  const pluginErrors = []
  extraLauncher.plugins.onPluginError = (plugin, method, err) => {
    pluginErrors.push(err)
  }

  extraLauncher.use(AnonymizeUAPlugin())
  expect(extraLauncher.plugins.list.length).toEqual(1)
  expect(extraLauncher.plugins.list[0].name).toEqual('anonymize-ua')

  const browser = await extraLauncher.launch(_browserOptions)
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('https://example.com')

  const ua = await page.evaluate(() => navigator.userAgent)
  expect(ua.includes('Headless')).toBeFalsy()
  expect(pluginErrors).toStrictEqual([])

  await browser.close()
})

test('puppeteer-extra-plugin-anonymize-ua will allow a custom UA', async ({
  browserName,
  extraLauncher,
  _browserOptions
}) => {
  test.skip(browserName !== 'chromium', 'Chromium only')

  const pluginErrors = []
  extraLauncher.plugins.onPluginError = (plugin, method, err) => {
    pluginErrors.push(err)
  }
  extraLauncher.use(
    AnonymizeUAPlugin({
      customFn: ua => 'MyCoolUserAgent'
    })
  )
  expect(extraLauncher.plugins.list.length).toEqual(1)
  expect(extraLauncher.plugins.list[0].name).toEqual('anonymize-ua')

  const browser = await extraLauncher.launch(_browserOptions)
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('https://example.com')

  const ua = await page.evaluate(() => navigator.userAgent)
  expect(ua).toBe('MyCoolUserAgent')
  expect(pluginErrors).toStrictEqual([])

  await browser.close()
})
