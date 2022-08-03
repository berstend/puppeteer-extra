import { PuppeteerExtraPlugin, PuppeteerPage } from 'puppeteer-extra-plugin'
import { withUtils } from '../_utils/withUtils'
import Utils from '../_utils/'

export interface PluginOptions {
  /**
   * lang like ['en-US', 'en']
   */
  languages: string[];
}

/**
 * Pass the Languages Test. Allows setting custom languages.
 *
 * @param {Object} [opts] - Options
 * @param {Array<string>} [opts.languages] - The languages to use (default: `['en-US', 'en']`)
 */
export class Plugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get name(): 'stealth/evasions/navigator.languages' {
    return 'stealth/evasions/navigator.languages'
  }

  get defaults(): PluginOptions {
    return {
      languages: [] // Empty default, otherwise this would be merged with user defined array override
    }
  }

  async onPageCreated(page: PuppeteerPage): Promise<void> {
    await withUtils(page).evaluateOnNewDocument(
      (utils: typeof Utils, opts: PluginOptions) => {
        const languages = opts.languages.length
          ? opts.languages
          : ['en-US', 'en']
        utils.replaceGetterWithProxy(
          Object.getPrototypeOf(navigator),
          'languages',
          utils.makeHandler().getterValue(Object.freeze([...languages]))
        )
      },
      this.opts
    )
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new Plugin(pluginConfig)