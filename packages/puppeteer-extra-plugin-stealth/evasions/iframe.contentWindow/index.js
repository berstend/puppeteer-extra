'use strict'

const PuppeteerExtraPlugin = require('puppeteer-extra-plugin')

/**
 * Pass the iframe Test
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor (opts = { }) { super(opts) }

  get name () { return 'stealth/evasions/iframe.contentWindow' }

  async onPageCreated (page) {
    await page.evaluateOnNewDocument(() => {
      // eslint-disable-next-line
      Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
        get: function () {
          return window
        }
      })
    })
  }
}

module.exports = function (pluginConfig) { return new Plugin(pluginConfig) }
