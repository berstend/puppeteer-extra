import test, { ExecutionContext } from 'ava'
import { DriverContext, wrap } from 'testing-tools'

import RecaptchaPlugin from '../src/index'

wrap(test)(['puppeteer:all', 'playwright:all'], {
  exclude: ['puppeteer:firefox'],
})(
  'will solve reCAPTCHAs',
  async (t: ExecutionContext, driver: DriverContext) => {
    if (!process.env.TWOCAPTCHA_TOKEN) {
      console.log('TWOCAPTCHA_TOKEN not found in env, skipping.')
      t.truthy('foo')
      return
    }

    const plugin = RecaptchaPlugin({
      provider: {
        id: '2captcha',
        token: process.env.TWOCAPTCHA_TOKEN,
      },
      visualFeedback: true,
    })
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

    const results = await page.solveRecaptchas()

    t.falsy(results.error)

    t.true(results.captchas.length === 1)
    t.is(results.captchas[0].callback, 'onSuccess')
    t.is(results.captchas[0].widgetId, 0)
    t.true(!!results.captchas[0].id)
    t.true(!!results.captchas[0].sitekey)
    t.true(!!results.captchas[0].url)

    t.true(results.solutions.length === 1)
    t.is(results.solutions[0].provider, '2captcha')
    t.is(results.solutions[0].hasSolution, true)

    t.true(results.solved.length === 1)
    t.is(results.solved[0].isSolved, true)

    await browser.close()
  }
)
