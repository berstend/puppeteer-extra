import { PluginData, PluginDependencies, PuppeteerPage, PuppeteerCDPSession, PuppeteerExtraPlugin, PuppeteerLaunchOption } from 'puppeteer-extra-plugin'

export interface PluginOptions {
  userAgent: string | null,
  locale: string,
  maskLinux: boolean,
}

/**
 * Fixes the UserAgent info (composed of UA string, Accept-Language, Platform, and UA hints).
 *
 * If you don't provide any values this plugin will default to using the regular UserAgent string (while stripping the headless part).
 * Default language is set to "en-US,en", the other settings match the UserAgent string.
 * If you are running on Linux, it will mask the settins to look like Windows. This behavior can be disabled with the `maskLinux` option.
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
 * // Define custom UA and locale
 * const ua = UserAgentOverride({ userAgent: "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)", locale: "de-DE,de" })
 * puppeteer.use(ua)
 *
 * @param {Object} [opts] - Options
 * @param {string} [opts.userAgent] - The user agent to use (default: browser.userAgent())
 * @param {string} [opts.locale] - The locale to use in `Accept-Language` header and in `navigator.languages` (default: `en-US,en`)
 * @param {boolean} [opts.maskLinux] - Wether to hide Linux as platform in the user agent or not - true by default
 *
 */
export class Plugin extends PuppeteerExtraPlugin<PluginOptions> {
  private _headless?: boolean | 'chrome' = false;

  constructor(opts?: Partial<PluginOptions>) {
    super(opts)

    this._headless = false
  }

  get name(): 'stealth/evasions/user-agent-override' {
    return 'stealth/evasions/user-agent-override'
  }

  get dependencies(): PluginDependencies {
    return ['user-preferences']
  }

  get defaults(): PluginOptions {
    return {
      userAgent: null,
      locale: 'en-US,en',
      maskLinux: true
    }
  }

  async onPageCreated(page: PuppeteerPage): Promise<void> {
    // Determine the full user agent string, strip the "Headless" part
    let ua =
      this.opts.userAgent ||
      (await page.browser().userAgent()).replace('HeadlessChrome/', 'Chrome/')

    if (
      this.opts.maskLinux &&
      ua.includes('Linux') &&
      !ua.includes('Android') // Skip Android user agents since they also contain Linux
    ) {
      ua = ua.replace(/\(([^)]+)\)/, '(Windows NT 10.0; Win64; x64)') // Replace the first part in parentheses with Windows data
    }

    // Full version number from Chrome
    const m = ua.match(/Chrome\/([\d|.]+)/);
    const uaVersion = m ? m[1] : (await page.browser().version()).match(/\/([\d|.]+)/)![1]

    // Get platform identifier (short or long version)
    const _getPlatform = (extended = false) => {
      if (ua.includes('Mac OS X')) {
        return extended ? 'Mac OS X' : 'MacIntel'
      } else if (ua.includes('Android')) {
        return 'Android'
      } else if (ua.includes('Linux')) {
        return 'Linux'
      } else {
        return extended ? 'Windows' : 'Win32'
      }
    }

    // Source in C++: https://source.chromium.org/chromium/chromium/src/+/master:components/embedder_support/user_agent_utils.cc;l=55-100
    const _getBrands = (): { brand: string; version: string; }[] => {
      const seed = uaVersion.split('.')[0] // the major version number of Chrome

      const order = [
        [0, 1, 2],
        [0, 2, 1],
        [1, 0, 2],
        [1, 2, 0],
        [2, 0, 1],
        [2, 1, 0]
      ][Number(seed) % 6]
      const escapedChars = [' ', ' ', ';']

      const greaseyBrand = `${escapedChars[order[0]]}Not${
        escapedChars[order[1]]
        }A${escapedChars[order[2]]}Brand`

      const greasedBrandVersionList = []
      greasedBrandVersionList[order[0]] = {
        brand: greaseyBrand,
        version: '99'
      }
      greasedBrandVersionList[order[1]] = {
        brand: 'Chromium',
        version: seed
      }
      greasedBrandVersionList[order[2]] = {
        brand: 'Google Chrome',
        version: seed
      }

      return greasedBrandVersionList
    }

    // Return OS version
    const _getPlatformVersion = (): string => {
      let m = ua.match(/Mac OS X ([^)]+)/);
      if (m) return m[1]
      m = ua.match(/Android ([^;]+)/)
      if (m) return m[1]
      m = ua.match(/Windows .*?([\d|.]+);?/)
      if (m) return m[1]
      return ''
    }

    // Get architecture, this seems to be empty on mobile and x86 on desktop
    const _getPlatformArch = () => (_getMobile() ? '' : 'x86')

    // Return the Android model, empty on desktop
    const _getPlatformModel = () => {
      const m = ua.match(/Android.*?;\s([^)]+)/);
      if (m) return m[1]
      return '';
    }

    const _getMobile = () => ua.includes('Android')

    const override = {
      userAgent: ua,
      platform: _getPlatform(),
      userAgentMetadata: {
        brands: _getBrands(),
        fullVersion: uaVersion,
        platform: _getPlatform(true),
        platformVersion: _getPlatformVersion(),
        architecture: _getPlatformArch(),
        model: _getPlatformModel(),
        mobile: _getMobile()
      }
    } as any

    // In case of headless, override the acceptLanguage in CDP.
    // This is not preferred, as it messed up the header order.
    // On headful, we set the user preference language setting instead.
    if (this._headless) {
      override.acceptLanguage = this.opts.locale || 'en-US,en'
    }

    this.debug('onPageCreated - Will set these user agent options', {
      override,
      opts: this.opts
    })

    const client: PuppeteerCDPSession | undefined =
      typeof page._client === 'function' ? page._client() : page._client

    if (!client) {
      throw Error ('Failed to acess CDPSession, with the current pptr version.')
    }

    client.send('Network.setUserAgentOverride', override)
  }

  async beforeLaunch(options: PuppeteerLaunchOption = {}): Promise<void | PuppeteerLaunchOption> {
    // Check if launched headless
    this._headless = options.headless
  }

  async beforeConnect(): Promise<void> {
    // Treat browsers using connect() as headless browsers
    this._headless = true
  }

  get data(): PluginData[] {
    return [
      {
        name: 'userPreferences',
        value: {
          intl: { accept_languages: this.opts.locale || 'en-US,en' }
        }
      }
    ]
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new Plugin(pluginConfig)
