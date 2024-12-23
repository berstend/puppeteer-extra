'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')
const withUtils = require('../_utils/withUtils')

/**
 * Pass the Languages Test. Allows setting custom language & languages.
 *
 * @param {Object} [opts] - Options
 * @param {Array<string>} [opts.languages] - The languages to use (default: `['en-US', 'en']`)
 * @param {string} [opts.language] - The language to use (default: `'en-US'`)
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/navigator.languages'
  }

  get defaults() {
    return {
      languages: [] // Empty default, otherwise this would be merged with user defined array override
    }
  }

  async onPageCreated(page) {
    const languages = this.opts.languages.length
      ? this.opts.languages
      : ['en-US', 'en']
    const language = this.opts.language || languages[0]

    await withUtils(page).evaluateOnNewDocument(
      (utils, { languages }) => {
        utils.replaceGetterWithProxy(
          Object.getPrototypeOf(navigator),
          'languages',
          utils.makeHandler().getterValue(Object.freeze([...languages]))
        )
      },
      {
        languages
      }
    )

    await withUtils(page).evaluateOnNewDocument(
      (utils, { language }) => {
        utils.replaceGetterWithProxy(
          Object.getPrototypeOf(navigator),
          'language',
          utils.makeHandler().getterValue(language)
        )
      },
      {
        language
      }
    )
  }
}

module.exports = function (pluginConfig) {
  return new Plugin(pluginConfig)
}
