import { PuppeteerExtraPlugin, PuppeteerPage } from 'puppeteer-extra-plugin'
import { withUtils } from '../_utils/withUtils'
import Utils from '../_utils/'

export interface PluginOptions {
  hardwareConcurrency: number
}

/**
 * Set the hardwareConcurrency to 4 (optionally configurable with `hardwareConcurrency`)
 *
 * @see https://arh.antoinevastel.com/reports/stats/osName_hardwareConcurrency_report.html
 *
 * @param {Object} [opts] - Options
 * @param {number} [opts.hardwareConcurrency] - The value to use in `navigator.hardwareConcurrency` (default: `4`)
 */

 export class Plugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get name(): 'stealth/evasions/navigator.hardwareConcurrency' {
    return 'stealth/evasions/navigator.hardwareConcurrency'
  }

  get defaults(): PluginOptions {
    return {
      hardwareConcurrency: 4
    }
  }

  async onPageCreated(page: PuppeteerPage): Promise<void> {
    await withUtils(page).evaluateOnNewDocument(
      (utils: typeof Utils, opts: PluginOptions) => {
        utils.replaceGetterWithProxy(
          Object.getPrototypeOf(navigator),
          'hardwareConcurrency',
          utils.makeHandler().getterValue(opts.hardwareConcurrency)
        )
      },
      this.opts
    )
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new Plugin(pluginConfig)

