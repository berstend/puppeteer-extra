import test, { ExecutionContext } from 'ava'
import { DriverContext, wrap } from '@extra-test/wrap'

import { AutomationExtraPlugin, Page } from '../src/index'

wrap(test)(['playwright:chromium'])(
  'will have a working event emitter',
  async (t: ExecutionContext, driver: DriverContext) => {
    const results: string[] = []

    class Plugin extends AutomationExtraPlugin {
      static id = 'test'

      constructor(opts = {}) {
        super(opts)
      }

      async onBrowser() {
        this.env.events.on('onPageCreated', async () => {
          results.push('onPageCreated1')
        })
      }

      async onPageCreated(page: Page) {
        this.env.events.on('onPageClose', async () => {
          results.push('onPageClose3')
        })
      }
    }
    const instance = new Plugin()

    t.throws(
      () => instance.env.events.on('onPluginRegistered', async () => {}),
      {
        instanceOf: Error,
        message:
          'Launcher env not available yet, you need to register the plugin before using it.',
      }
    )

    const { launcher, browser, page } = await driver.getPage(instance)
    launcher.env.events.on('onPageClose', async () => {
      results.push('onPageClose1')
    })

    instance.env.events.on('onPageClose', async () => {
      results.push('onPageClose2')
    })

    await page.goto('https://example.com', { waitUntil: 'domcontentloaded' })
    await page.close()
    await browser.close()

    t.deepEqual(results, [
      'onPageCreated1',
      'onPageClose3',
      'onPageClose1',
      'onPageClose2',
    ])
  }
)
