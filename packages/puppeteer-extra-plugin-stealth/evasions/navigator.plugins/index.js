'use strict'

const PuppeteerExtraPlugin = require('puppeteer-extra-plugin')

/**
 * Pass the Plugins Length Test.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor (opts = { }) { super(opts) }

  get name () { return 'stealth/evasions/navigator.plugins' }

  async onPageCreated (page) {
    await page.evaluateOnNewDocument(() => {
      // Overwrite the `plugins` property to use a custom getter.
      Object.defineProperty(navigator, 'plugins', {
        // This just needs to have `length > 0` for the current test,
        // but we could mock the plugins too if necessary.
        get: () => [1, 2, 3, 4, 5]
      })
    })
  }
}

module.exports = function (pluginConfig) { return new Plugin(pluginConfig) }
