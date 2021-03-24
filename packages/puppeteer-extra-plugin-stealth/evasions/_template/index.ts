import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import { Page } from 'puppeteer'

interface PluginOptions {
}

/**
 * Minimal stealth plugin template, not being used. :-)
 *
 * Feel free to copy this folder as the basis for additional detection evasion plugins.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts:Partial<PluginOptions> = {}) {
    super(opts)
  }

  get name(): string {
    return 'stealth/evasions/_template'
  }

  async onPageCreated(page: Page): Promise<void> {
    await page.evaluateOnNewDocument(() => {
      console.debug('hello world')
    })
  }
}

export = function(pluginConfig?: Partial<PluginOptions>) {
  return new Plugin(pluginConfig)
}
