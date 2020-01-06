'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * Fixes the UserAgent info (composed of UA string, Accept-Language, Platform).
 *
 * If you don't provide any values this plugin will default to using the regular UserAgent string (while stripping the headless part).
 * Default language is set to "en-US,en", default platform is "win32".
 *
 * By default puppeteer will not set a `Accept-Language` header in headless:
 * It's (theoretically) possible to fix that using either `page.setExtraHTTPHeaders` or a `--lang` launch arg.
 * Unfortunately `page.setExtraHTTPHeaders` will lowercase everything and launch args are not always available. :)
 *
 * In addition, the `navigator.platform` property is always set to the host value, e.g. `Linux` which makes detection very easy.
 *
 * Note: You cannot use the regular `page.setUserAgent()` puppeteer call in your code,
 * as it will reset the language and platform values you set with this plugin.
 *
 * @example
 * const puppeteer = require("puppeteer-extra")
 *
 * const StealthPlugin = require("puppeteer-extra-plugin-stealth")
 * const stealth = StealthPlugin()
 * // Remove this specific stealth plugin from the default set
 * stealth.enabledEvasions.delete("user-agent-override")
 * puppeteer.use(stealth)
 *
 * // Stealth plugins are just regular `puppeteer-extra` plugins and can be added as such
 * const UserAgentOverride = require("puppeteer-extra-plugin-stealth/evasions/user-agent-override")
 * // Define custom UA, locale and platform
 * const ua = UserAgentOverride({ userAgent: "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)", locale: "de-DE,de;q=0.9", platform: "Win32" })
 * puppeteer.use(ua)
 *
 * @param {Object} [opts] - Options
 * @param {string} [opts.userAgent] - The user agent to use (default: browser.userAgent())
 * @param {string} [opts.locale] - The locale to use in `Accept-Language` header and in `navigator.languages` (default: `en-US,en;q=0.9`)
 * @param {string} [opts.platform] - The platform to use in `navigator.platform` (default: `Win32`)
 *
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/user-agent-override'
  }

  get defaults() {
    return {
      userAgent: null,
      acceptLanguage: 'en-US,en',
      platform: 'Win32'
    }
  }

  async onPageCreated(page) {
    const override = {
      userAgent:
        this.opts.userAgent ||
        (await page.browser().userAgent()).replace(
          'HeadlessChrome/',
          'Chrome/'
        ),
      acceptLanguage: this.opts.locale || 'en-US,en',
      platform: this.opts.platform || 'Win32'
    }

    this.debug('onPageCreated - Will set these user agent options', {
      override,
      opts: this.opts
    })

    page._client.send('Network.setUserAgentOverride', override)
  } // onPageCreated
}

const defaultExport = opts => new Plugin(opts)
module.exports = defaultExport
