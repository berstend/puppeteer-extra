import { test, expect } from '../fixtures/extra'

import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha'

// Supports all browsers
test('puppeteer-extra-plugin-recaptcha will detect captchas', async ({
  extraLauncher,
  _browserOptions
}) => {
  const pluginErrors = []
  extraLauncher.plugins.onPluginError = (plugin, method, err) => {
    pluginErrors.push(err)
  }

  const instance = RecaptchaPlugin()
  extraLauncher.use(instance)
  expect(extraLauncher.plugins.list.length).toEqual(1)
  expect(extraLauncher.plugins.list[0].name).toEqual(instance.name)

  const url =
    'https://berstend.github.io/static/recaptcha/v2-checkbox-auto.html'
  const browser = await extraLauncher.launch(_browserOptions)
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(url)

  const { captchas, error } = await (page as any).findRecaptchas()

  expect(error).toBeFalsy()
  expect(captchas).toBeTruthy()
  expect(captchas.length).toBe(1)
  const captcha = captchas[0]
  expect(captcha._vendor).toBe('recaptcha')
  expect(captcha._type).toBe('checkbox')
  expect(captcha.url).toBe(url)
  expect(captcha.id).toBeTruthy()
  expect(captcha.sitekey).toBeTruthy()

  expect(pluginErrors).toStrictEqual([])
  await browser.close()
})

test('puppeteer-extra-plugin-recaptcha will solve captchas', async ({
  extraLauncher,
  _browserOptions
}) => {
  test.skip(!process.env.TWOCAPTCHA_TOKEN, 'TWOCAPTCHA_TOKEN not set')
  test.slow()

  const pluginErrors = []
  extraLauncher.plugins.onPluginError = (plugin, method, err) => {
    pluginErrors.push(err)
  }

  const instance = RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN
    }
  })
  extraLauncher.use(instance)
  expect(extraLauncher.plugins.list.length).toEqual(1)
  expect(extraLauncher.plugins.list[0].name).toEqual(instance.name)

  const url = 'https://www.google.com/recaptcha/api2/demo'
  const browser = await extraLauncher.launch(_browserOptions)
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })

  const { solved, error } = await (page as any).solveRecaptchas()
  expect(error).toBeFalsy()
  expect(solved).toBeTruthy()
  expect(solved.length).toBe(1)

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click(`#recaptcha-demo-submit`)
  ])
  const content = await page.content()
  expect(content).toMatch('Verification Success... Hooray!')

  expect(pluginErrors).toStrictEqual([])
  await browser.close()
})
