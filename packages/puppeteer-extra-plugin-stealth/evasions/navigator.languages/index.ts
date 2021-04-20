import Utils from '../_utils'

import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import withUtils from '../_utils/withUtils'
import { Page } from 'puppeteer'

interface NavigatorLanguagesPluginOption {
  languages: string[];
}

/**
 * Pass the Languages Test. Allows setting custom languages.
 *
 * @param {Object} [opts] - Options
 * @param {Array<string>} [opts.languages] - The languages to use (default: `['en-US', 'en']`)
 */
class NavigatorLanguagesPlugin extends PuppeteerExtraPlugin {
  constructor(opts: Partial<NavigatorLanguagesPluginOption> = {}) {
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

  async onPageCreated(page: Page) {
    await withUtils(page).evaluateOnNewDocument(
      (utils: typeof Utils, { opts }: {opts: NavigatorLanguagesPluginOption}) => {
        const languages: string[] = opts.languages.length
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

export = function (pluginConfig: Partial<NavigatorLanguagesPluginOption>) {
  return new NavigatorLanguagesPlugin(pluginConfig)
}
