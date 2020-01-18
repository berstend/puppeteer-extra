'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * Allow flash on all sites without user interaction.
 *
 * Note: The flash plugin is not working in headless mode.
 *
 * Note: When using the default Chromium browser
 * `pluginPath` and `pluginVersion` must be specified.
 *
 * Note: Unfortunately this doesn't seem to enable flash on incognito pages,
 * see [this gist] for a workaround using management policies.
 * [this gist]: https://gist.github.com/berstend/bcd64a4a2db28afbd6486daf69f4e787
 *
 * @param {Object} opts - Options
 * @param {boolean} [opts.allowFlash=true] - Whether to allow flash content or not
 * @param {boolean} [opts.pluginPath=null] - Flash plugin path
 * @param {boolean} [opts.pluginVersion=9000] - Flash plugin version (9000 is high enough for Chrome not to complain)
 *
 * @example
 * const puppeteer = require('puppeteer-extra')
 * puppeteer.use(require('puppeteer-extra-plugin-flash')())
 * ;(async () => {
 *   const browser = await puppeteer.launch({headless: false})
 *   const page = await browser.newPage()
 *   await page.goto('http://ultrasounds.com', {waitUntil: 'domcontentloaded'})
 * })()
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'flash'
  }

  get defaults() {
    return {
      allowFlash: true,
      pluginPath: null,
      pluginVersion: 9000
    }
  }

  get requirements() {
    return new Set(['launch', 'headful'])
  }

  get dependencies() {
    return new Set(['user-preferences'])
  }

  async beforeLaunch(options) {
    if (this.opts.allowFlash === false) {
      return
    }

    if (this.opts.pluginPath) {
      options.args.push(`--ppapi-flash-path=${this.opts.pluginPath}`)
    }
    if (this.opts.pluginVersion) {
      options.args.push(`--ppapi-flash-version=${this.opts.pluginVersion}`)
    }
  }

  get data() {
    if (this.opts.allowFlash === false) {
      return
    }
    const allowFlashPreferences = {
      profile: {
        managed_default_content_settings: {
          plugins: 1
        },
        managed_plugins_allowed_for_urls: ['https://*', 'http://*']
      }
    }
    return [
      {
        name: 'userPreferences',
        value: allowFlashPreferences
      }
    ]
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
