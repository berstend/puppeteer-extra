'use strict'

import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import withUtils from '../_utils/withUtils'

/**
 * Pass the Languages Test. Allows setting custom languages.
 *
 * @param {Object} [opts] - Options
 * @param {Array<string>} [opts.languages] - The languages to use (default: `['en-US', 'en']`)
 */
class NavigatorLanguagesPlugin extends PuppeteerExtraPlugin {
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
    await withUtils(page).evaluateOnNewDocument(
      (utils, { opts }) => {
        const languages = opts.languages.length
          ? opts.languages
          : ['en-US', 'en']
        utils.replaceGetterWithProxy(
          Object.getPrototypeOf(navigator),
          'languages',
          utils.makeHandler().getterValue(Object.freeze([...languages]))
        )
      },
      {
        opts: this.opts
      }
    )
  }
}

module.exports = function (pluginConfig) {
  return new NavigatorLanguagesPlugin(pluginConfig)
}
