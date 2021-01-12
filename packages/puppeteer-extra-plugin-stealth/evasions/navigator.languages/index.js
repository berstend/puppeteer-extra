'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')
const withUtils = require('../_utils/withUtils')

/**
 * Pass the Languages Test. Allows setting custom languages.
 *
 * @param {Object} [opts] - Options
 * @param {Array<string>} [opts.languages] - The languages to use (default: `['en-US', 'en']`)
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/navigator.languages'
  }

  // Overwrite the `languages` property to use a custom getter.
  async onPageCreated(page) {
    await withUtils(page).evaluateOnNewDocument((utils, opts) => {
      utils.replaceProperty(Object.getPrototypeOf(navigator), 'languages', {
        get: () => opts.languages || ['en-US', 'en']
      })
    }, this.opts)
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
