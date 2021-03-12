import test, { ExecutionContext } from 'ava'
import { DriverContext, wrap } from '@extra-test/wrap'

import { AutomationExtraPlugin, Page } from '../src/index'

wrap(test)(['puppeteer:chromium', 'playwright:chromium'])(
  'will have a working CDP session',
  async (t: ExecutionContext, driver: DriverContext) => {
    const results = {
      getVersion: null as any,
    }

    class Plugin extends AutomationExtraPlugin {
      static id = 'test'

      constructor(opts = {}) {
        super(opts)
      }

      async onPageCreated(page: Page) {
        const session = await this.shim(page).getCDPSession()
        results.getVersion = await session.send('Browser.getVersion')
      }
    }
    const instance = new Plugin()
    const { browser, page } = await driver.getPage(instance)

    await page.goto('https://example.com', { waitUntil: 'domcontentloaded' })

    t.truthy(results.getVersion)
    t.truthy(results.getVersion.jsVersion)
    t.truthy(results.getVersion.product)
    t.truthy(results.getVersion.protocolVersion)
    t.truthy(results.getVersion.revision)
    t.truthy(results.getVersion.userAgent)

    await browser.close()
  }
)
