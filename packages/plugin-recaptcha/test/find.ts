import test, { ExecutionContext } from 'ava'
import { DriverContext, wrap } from '@extra-test/wrap'

import RecaptchaPlugin from '../src/index'

wrap(test)(['puppeteer:all', 'playwright:all'], {
  exclude: ['puppeteer:firefox'],
})(
  'will find reCAPTCHAs',
  async (t: ExecutionContext, driver: DriverContext) => {
    const plugin = RecaptchaPlugin()
    const { browser, page } = await driver.getPage(plugin)

    const url = 'https://www.google.com/recaptcha/api2/demo'
    if (plugin.env.isPuppeteerPage(page)) {
      if (plugin.env.isFirefox) {
        await page.goto(url, { waitUntil: 'domcontentloaded' })
      } else {
        await page.goto(url, { waitUntil: 'networkidle0' })
      }
    } else {
      await page.goto(url, { waitUntil: 'networkidle' })
    }

    const results = await page.findRecaptchas()

    t.falsy(results.error)
    t.is(results.captchas.length, 1)
    t.is(results.captchas[0]._vendor, 'recaptcha')
    t.is(results.captchas[0].callback, 'onSuccess')
    t.is(results.captchas[0].widgetId, 0)
    t.true(!!results.captchas[0].id)
    t.true(!!results.captchas[0].sitekey)
    t.is(results.captchas[0].url, url)

    await browser.close()
  }
)

wrap(test)(['puppeteer:all', 'playwright:all'], {
  exclude: ['puppeteer:firefox'],
})(
  'will find hCaptchas',
  async (t: ExecutionContext, driver: DriverContext) => {
    const plugin = RecaptchaPlugin()
    const { browser, page } = await driver.getPage(plugin)

    const url = 'http://democaptcha.com/demo-form-eng/hcaptcha.html'
    if (plugin.env.isPuppeteerPage(page)) {
      if (plugin.env.isFirefox) {
        await page.goto(url, { waitUntil: 'domcontentloaded' })
      } else {
        await page.goto(url, { waitUntil: 'networkidle0' })
      }
    } else {
      await page.goto(url, { waitUntil: 'networkidle' })
    }

    const results = await page.findRecaptchas()

    t.falsy(results.error)
    t.is(results.captchas.length, 1)
    t.is(results.captchas[0]._vendor, 'hcaptcha')
    t.true(!!results.captchas[0].id)
    t.true(!!results.captchas[0].sitekey)
    t.is(results.captchas[0].url, url)

    await browser.close()
  }
)
