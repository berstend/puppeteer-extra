'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * Pass the Chrome Test.
 *
 * Could be mocked further.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor (opts = {}) {
    super(opts)
  }

  get name () {
    return 'stealth/evasions/chrome.runtime'
  }

  async onPageCreated (page) {
    await page.evaluateOnNewDocument(() => {
      window.chrome = {
        runtime: {}
      }
    })
  }
}

module.exports = function (pluginConfig) {
  return new Plugin(pluginConfig)
}
