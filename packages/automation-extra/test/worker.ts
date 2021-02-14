import test, { ExecutionContext } from 'ava'
import { DriverContext, wrap } from '@extra-test/wrap'

import { AutomationExtraPlugin, Worker } from 'automation-extra-plugin'

wrap(test)(['puppeteer:chromium', 'playwright:chromium'])(
  'will fire onWorkerCreated',
  async (t: ExecutionContext, driver: DriverContext) => {
    const results: string[] = []

    class Plugin extends AutomationExtraPlugin {
      static id = 'test'

      constructor(opts = {}) {
        super(opts)
      }

      async onWorkerCreated(worker: Worker) {
        results.push(worker.url())
      }
    }
    const instance = new Plugin()
    const { browser, page } = await driver.getPage(instance)

    await page.goto(
      'https://html.spec.whatwg.org/demos/workers/modules/page.html',
      { waitUntil: 'domcontentloaded' }
    )

    if ('waitForTimeout' in page) {
      await page.waitForTimeout(5 * 1000)
    } else {
      await (page as any).waitFor(5 * 1000) // old pptr
    }

    t.truthy(results.length)
    t.deepEqual(results, [
      'https://html.spec.whatwg.org/demos/workers/modules/worker.js'
    ])

    await browser.close()
  }
)
