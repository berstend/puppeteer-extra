import Utils from '../_utils'
import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import withUtils from '../_utils/withUtils'
import { Page } from 'puppeteer'

interface NavigatorHardwareConcurrencyPluginOption {
  hardwareConcurrency: number;
}

/**
 * Set the hardwareConcurrency to 4 (optionally configurable with `hardwareConcurrency`)
 *
 * @see https://arh.antoinevastel.com/reports/stats/osName_hardwareConcurrency_report.html
 *
 * @param {Object} [opts] - Options
 * @param {number} [opts.hardwareConcurrency] - The value to use in `navigator.hardwareConcurrency` (default: `4`)
 */

class NavigatorHardwareConcurrencyPlugin extends PuppeteerExtraPlugin {
  constructor(opts: Partial<NavigatorHardwareConcurrencyPluginOption> = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/navigator.hardwareConcurrency'
  }

  get defaults() {
    return {
      hardwareConcurrency: 4
    }
  }

  async onPageCreated(page: Page) {
    await withUtils(page).evaluateOnNewDocument(
      (utils: typeof Utils, { opts }: {opts: NavigatorHardwareConcurrencyPluginOption}) => {
        utils.replaceGetterWithProxy(
          Object.getPrototypeOf(navigator),
          'hardwareConcurrency',
          utils.makeHandler().getterValue(opts.hardwareConcurrency)
        )
      },
      {
        opts: this.opts
      }
    )
  }
}

export = function (pluginConfig: Partial<NavigatorHardwareConcurrencyPluginOption>) {
  return new NavigatorHardwareConcurrencyPlugin(pluginConfig)
}
