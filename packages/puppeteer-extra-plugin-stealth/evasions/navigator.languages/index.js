'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * Pass the Languages Test.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor (opts = {}) {
    super(opts)
  }

  get name () {
    return 'stealth/evasions/navigator.languages'
  }

  async onPageCreated (page) {
    await page.evaluateOnNewDocument(() => {
      // Overwrite the `plugins` property to use a custom getter.
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      })
    })
  }
}

module.exports = function (pluginConfig) {
  return new Plugin(pluginConfig)
}
