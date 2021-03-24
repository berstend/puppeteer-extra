import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import Puppeteer from 'puppeteer/lib/types'

interface PluginOptions {
}

/**
 * Minimal stealth plugin template, not being used. :-)
 *
 * Feel free to copy this folder as the basis for additional detection evasion plugins.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts:PluginOptions = {}) {
    super(opts)
  }

  get name():string {
    return 'stealth/evasions/_template'
  }

  async onPageCreated(page: Puppeteer.Page): Promise<void> {
    await page.evaluateOnNewDocument(() => {
      console.debug('hello world')
    })
  }
}

export = function(pluginConfig?: PluginOptions) {
  return new Plugin(pluginConfig)
}
