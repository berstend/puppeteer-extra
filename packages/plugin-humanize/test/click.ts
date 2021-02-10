import test, { ExecutionContext } from 'ava'
import { DriverContext, wrap } from '@extra-test/wrap'

import Plugin from '../src/index'

wrap(test)(['puppeteer:all', 'playwright:all'], {
  exclude: ['puppeteer:firefox']
})(
  'will click elements',
  async (t: ExecutionContext, driver: DriverContext) => {
    const plugin = Plugin({
      mouse: {
        showCursor: true
      }
    })
    const { browser, page } = await driver.getPage(plugin)

    await page.goto('https://example.com', { waitUntil: 'domcontentloaded' })

    if (plugin.env.isPlaywrightPage(page)) {
      await page.waitForSelector('a')
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        page.click('a')
      ])
    }

    if (plugin.env.isPuppeteerPage(page)) {
      await page.waitForSelector('a')
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        page.click('a')
      ])
    }

    t.is(page.url(), 'https://www.iana.org/domains/reserved')

    await browser.close()
  }
)
