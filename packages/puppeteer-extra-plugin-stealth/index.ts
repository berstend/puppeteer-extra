// import Puppeteer from 'puppeteer'
import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import { EventEmitter } from 'events';

export const allAvailableEvasions = [
  'chrome.app',
  'chrome.csi',
  'chrome.loadTimes',
  'chrome.runtime',
  'defaultArgs',
  'iframe.contentWindow',
  'media.codecs',
  'navigator.hardwareConcurrency',
  'navigator.languages',
  'navigator.permissions',
  'navigator.plugins',
  'navigator.webdriver',
  'sourceurl',
  'user-agent-override',
  'webgl.vendor',
  'window.outerdimensions'
] as const;

export type KnownEvasions = typeof allAvailableEvasions[number];

// import { type PluginOptions as chromeAppOpt } from './evasions/chrome.app/'
// import { type PluginOptions as chromeCsiOpt } from './evasions/chrome.csi/'
// import { type PluginOptions as chromeLoadTimesOpt } from './evasions/chrome.loadTimes/'
import { type PluginOptions as chromeRuntimepOpt } from './evasions/chrome.runtime/'
// import { type PluginOptions as defaultArgsOpt } from './evasions/defaultArgs/'
// import { type PluginOptions as iframeContentWindowOpt } from './evasions/iframe.contentWindow/'
// import { type PluginOptions as mediaCodecsOpt } from './evasions/media.codecs/'
import { type PluginOptions as navigatorHardwareConcurrencyOpt } from './evasions/navigator.hardwareConcurrency/'
import { type PluginOptions as navigatorLanguagesOpt } from './evasions/navigator.languages/'
// import { type PluginOptions as navigatorPermissionsOpt } from './evasions/navigator.permissions/'
import { type PluginOptions as navigatorPluginsOpt } from './evasions/navigator.plugins/'
// import { type PluginOptions as navigatorWebdriverOpt } from './evasions/navigator.webdriver/'
// import { type PluginOptions as sourceurlOpt } from './evasions/sourceurl/'
import { type PluginOptions as userAgentOverrideOpt } from './evasions/user-agent-override/'
import { type PluginOptions as webglVendorOpt } from './evasions/webgl.vendor/'
import { type PluginOptions as windowOuterdimensionsOpt } from './evasions/window.outerdimensions/'

/**
 * Specify which evasions to use (by default all)
 */
export interface PluginOptions {
  availableEvasions: Set<KnownEvasions>;
  enabledEvasions: Set<KnownEvasions>;
  evasionsOptions: {
    // 'chrome.app'?: chromeAppOpt; // empty
    // 'chrome.csi'?: chromeCsiOpt; // empty
    // 'chrome.loadTimes'?: chromeLoadTimesOpt; // emty
    'chrome.runtime'?: chromeRuntimepOpt;
    // 'defaultArgs'?: defaultArgsOpt; // empty
    // 'iframe.contentWindow'?: iframeContentWindowOpt; // empty
    // 'media.codecs'?: mediaCodecsOpt; // empty
    'navigator.hardwareConcurrency'?: navigatorHardwareConcurrencyOpt;
    'navigator.languages'?: navigatorLanguagesOpt;
    // 'navigator.permissions'?: navigatorPermissionsOpt; // empty
    'navigator.plugins'?: navigatorPluginsOpt; // to extands
    // 'navigator.webdriver'?: navigatorWebdriverOpt; // empty
    // 'sourceurl'?: sourceurlOpt; // empty
    'user-agent-override'?: userAgentOverrideOpt;
    'webgl.vendor'?: webglVendorOpt;
    'window.outerdimensions'?: windowOuterdimensionsOpt;
  };
}
/**
 * Stealth mode: Applies various techniques to make detection of headless puppeteer harder. 💯
 *
 * ### Purpose
 * There are a couple of ways the use of puppeteer can easily be detected by a target website.
 * The addition of `HeadlessChrome` to the user-agent being only the most obvious one.
 *
 * The goal of this plugin is to be the definite companion to puppeteer to avoid
 * detection, applying new techniques as they surface.
 *
 * As this cat & mouse game is in it's infancy and fast-paced the plugin
 * is kept as flexibile as possible, to support quick testing and iterations.
 *
 * ### Modularity
 * This plugin uses `puppeteer-extra`'s dependency system to only require
 * code mods for evasions that have been enabled, to keep things modular and efficient.
 *
 * The `stealth` plugin is a convenience wrapper that requires multiple [evasion techniques](./evasions/)
 * automatically and comes with defaults. You could also bypass the main module and require
 * specific evasion plugins yourself, if you whish to do so (as they're standalone `puppeteer-extra` plugins):
 *
 * ```es6
 * // bypass main module and require a specific stealth plugin directly:
 * puppeteer.use(require('puppeteer-extra-plugin-stealth/evasions/console.debug')())
 * ```
 *
 * ### Contributing
 * PRs are welcome, if you want to add a new evasion technique I suggest you
 * look at the [template](./evasions/_template) to kickstart things.
 *
 * ### Kudos
 * Thanks to [Evan Sangaline](https://intoli.com/blog/not-possible-to-block-chrome-headless/) and [Paul Irish](https://github.com/paulirish/headless-cat-n-mouse) for kickstarting the discussion!
 *
 * ---
 *
 * @todo
 * - white-/blacklist with url globs (make this a generic plugin method?)
 * - dynamic whitelist based on function evaluation
 *
 * @example
 * const puppeteer = require('puppeteer-extra')
 * // Enable stealth plugin with all evasions
 * puppeteer.use(require('puppeteer-extra-plugin-stealth')())
 *
 *
 * ;(async () => {
 *   // Launch the browser in headless mode and set up a page.
 *   const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: true })
 *   const page = await browser.newPage()
 *
 *   // Navigate to the page that will perform the tests.
 *   const testUrl = 'https://intoli.com/blog/' +
 *     'not-possible-to-block-chrome-headless/chrome-headless-test.html'
 *   await page.goto(testUrl)
 *
 *   // Save a screenshot of the results.
 *   const screenshotPath = '/tmp/headless-test-result.png'
 *   await page.screenshot({path: screenshotPath})
 *   console.log('have a look at the screenshot:', screenshotPath)
 *
 *   await browser.close()
 * })()
 *
 * @param {Object} [opts] - Options
 * @param {Set<string>} [opts.enabledEvasions] - Specify which evasions to use (by default all)
 *
 */
class StealthPlugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get name(): 'stealth' {
    return 'stealth'
  }

  get dependenciesOptions(): { [key: string]: any } {
    if (!this.opts.evasionsOptions)
      return {};
    const entrys = Object.entries(this.opts.evasionsOptions).map(([key, value]) => [`${this.name}/evasions/${key}`, value]);
    return Object.fromEntries(entrys)
  }
  
  get defaults(): PluginOptions {
    const availableEvasions = new Set<KnownEvasions>(allAvailableEvasions)
    return {
      availableEvasions,
      // Enable all available evasions by default
      enabledEvasions: new Set(availableEvasions),
      evasionsOptions: {}
    }
  }
  /**
   * Requires evasion techniques dynamically based on configuration.
   *
   * @private
   */
  get dependencies(): Array<`stealth/evasions/${KnownEvasions}`> {
    return [...this.opts.enabledEvasions].map((e) => `stealth/evasions/${e}` as `stealth/evasions/${KnownEvasions}`)
  }
  /**
   * Get all available evasions.
   *
   * Please look into the [evasions directory](./evasions/) for an up to date list.
   *
   * @type {Set<string>} - A Set of all available evasions.
   *
   * @example
   * const pluginStealth = require('puppeteer-extra-plugin-stealth')()
   * console.log(pluginStealth.availableEvasions) // => Set { 'user-agent', 'console.debug' }
   * puppeteer.use(pluginStealth)
   */
  get availableEvasions(): Set<KnownEvasions> {
    return this.defaults.availableEvasions
  }

  /**
   * Get all enabled evasions.
   *
   * Enabled evasions can be configured either through `opts` or by modifying this property.
   *
   * @type {Set<string>} - A Set of all enabled evasions.
   *
   * @example
   * // Remove specific evasion from enabled ones dynamically
   * const pluginStealth = require('puppeteer-extra-plugin-stealth')()
   * pluginStealth.enabledEvasions.delete('console.debug')
   * puppeteer.use(pluginStealth)
   */
  get enabledEvasions(): Set<KnownEvasions> {
    return this.opts.enabledEvasions
  }

  /**
   * @private
   */
  set enabledEvasions(evasions: Set<KnownEvasions>) {
    this.opts.enabledEvasions = evasions
  }

  async onBrowser(browser: Parameters<PuppeteerExtraPlugin['onBrowser']>[0]): Promise<void> {
    if (browser && (browser as unknown as EventEmitter).setMaxListeners) {
      // Increase event emitter listeners to prevent MaxListenersExceededWarning
      (browser as unknown as EventEmitter).setMaxListeners(30)
    }
  }
}

/**
 * Default export, PuppeteerExtraStealthPlugin
 *
 * @param {Object} [opts] - Options
 * @param {Set<string>} [opts.enabledEvasions] - Specify which evasions to use (by default all)
 */
export default (pluginConfig?: Partial<PluginOptions>) => new StealthPlugin(pluginConfig)

// const moduleExport = defaultExport
// moduleExport.StealthPlugin = StealthPlugin
// module.exports = moduleExport
