import { PluginData, PluginDependencies, PluginRequirements, PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'

export interface PluginOptions {
  defaultFontSize: number;
}

/**
 * Modify/increase the default font size in puppeteer.
 *
 * @param {Object} opts - Options
 * @param {Number} [opts.defaultFontSize=20] - Default browser font size
 *
 * @example
 * const puppeteer = require('puppeteer-extra')
 * puppeteer.use(require('puppeteer-extra-plugin-font-size')())
 * // or
 * puppeteer.use(require('puppeteer-extra-plugin-font-size')({defaultFontSize: 18}))
 * const browser = await puppeteer.launch()
 */
export class Plugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get name(): 'font-size' {
    return 'font-size'
  }

  get defaults(): PluginOptions {
    return { defaultFontSize: 20 }
  }

  get requirements(): PluginRequirements {
    return new Set(['launch', 'headful'])
  }

  get dependencies(): PluginDependencies {
    return new Set(['user-preferences'])
  }

  get data(): PluginData[] {
    const userPreferences = {
      webkit: {
        webprefs: {
          default_font_size: this.opts.defaultFontSize
        }
      }
    }
    return [
      {
        name: 'userPreferences',
        value: userPreferences
      }
    ]
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new Plugin(pluginConfig)
