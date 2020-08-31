import debug, { Debugger } from 'debug'

import * as Puppeteer from './types/puppeteer'
import * as Playwright from './types/playwright'
export { Puppeteer, Playwright } // Re-export

// We use dummy/noop functions in PluginLifecycleMethods meant to be overriden
/* tslint:disable:no-empty */

/** @private */
const merge = require('merge-deep')

export interface PluginOptions {
  [key: string]: any
}

// Let the plugin know the context of things
export interface LaunchContext {
  context: 'launch' | 'connect'
  isHeadless: boolean
  options: Puppeteer.LaunchOptions | Playwright.LaunchOptions | any
}

export type PluginDependencies = Set<string> | Map<string, any>
export type PluginRequirements = Set<'launch' | 'headful' | 'runLast'>

export type LaunchOptions = Puppeteer.LaunchOptions | Playwright.LaunchOptions
export type ConnectOptions =
  | Puppeteer.ConnectOptions
  | Playwright.BrowserTypeConnectOptions
export type Browser = Puppeteer.Browser | Playwright.Browser
export type Page = Puppeteer.Page | Playwright.Page

/**
 * Plugin lifecycle methods
 */
export class PluginLifecycleMethods {
  /**
   * After the plugin has been registered, called early in the life-cycle (once the plugin has been added).
   */
  async onPluginRegistered(): Promise<void> {}
  /**
   * Before a new browser instance is created/launched.
   *
   * Can be used to modify the puppeteer/playwright launch options by modifying or returning them.
   *
   * Plugins using this method will be called in sequence to each
   * be able to update the launch options.
   *
   * @example
   * async beforeLaunch (options) {
   *   if (this.opts.flashPluginPath) {
   *     options.args.push(`--ppapi-flash-path=${this.opts.flashPluginPath}`)
   *   }
   * }
   *
   * @param options - Puppeteer/Playwright launch options
   */
  async beforeLaunch(options: LaunchOptions): Promise<LaunchOptions | void> {}

  /**
   * After the browser has launched.
   *
   * Note: Don't assume that there will only be a single browser instance during the lifecycle of a plugin.
   * It's possible that `pupeeteer.launch` will be  called multiple times and more than one browser created.
   * In order to make the plugins as stateless as possible don't store a reference to the browser instance
   * in the plugin but rather consider alternatives.
   *
   * E.g. when using `onPageCreated` you can get a browser reference by using `page.browser()`.
   *
   * Alternatively you could expose a class method that takes a browser instance as a parameter to work with:
   *
   * ```es6
   * const fancyPlugin = require('puppeteer-extra-plugin-fancy')()
   * puppeteer.use(fancyPlugin)
   * const browser = await puppeteer.launch()
   * await fancyPlugin.killBrowser(browser)
   * ```
   *
   * @param  browser - The `puppeteer` or `playwright` browser instance.
   *
   * @example
   * async afterLaunch (browser, opts) {
   *   this.debug('browser has been launched', opts.options)
   * }
   */
  async afterLaunch(browser: Browser, launchContext: LaunchContext) {}

  /**
   * Before connecting to an existing browser instance.
   *
   * Can be used to modify the puppeteer/playwright connect options by modifying or returning them.
   *
   * Plugins using this method will be called in sequence to each
   * be able to update the launch options.
   *
   * @param options - Puppeteer/playwright connect options
   */
  async beforeConnect(
    options: ConnectOptions
  ): Promise<ConnectOptions | void> {}

  /**
   * After connecting to an existing browser instance.
   *
   * > Note: Don't assume that there will only be a single browser instance during the lifecycle of a plugin.
   *
   * @param browser - The `puppeteer` or playwright browser instance.
   *
   */
  async afterConnect(browser: Browser, launchContext: LaunchContext) {}

  /**
   * Called when a browser instance is available.
   *
   * This applies to both `launch` and `connect`.
   *
   * Convenience method created for plugins that need access to a browser instance
   * and don't mind if it has been created through `launch` or `connect`.
   *
   * > Note: Don't assume that there will only be a single browser instance during the lifecycle of a plugin.
   *
   * @param browser - The `puppeteer` or `playwright` browser instance.
   */
  async onBrowser(browser: Browser, launchContext: LaunchContext) {}

  /**
   * Before a new browser context is created.
   *
   * Note: Currently only triggered by `playwright`, as puppeteer's usage of context is very lackluster.
   *
   * Plugins using this method will be called in sequence to each
   * be able to update the context options.
   *
   * @see https://github.com/microsoft/playwright/blob/master/docs/api.md#browsernewcontextoptions
   *
   * @param options - Playwright browser context options
   * @param browser - Playwright browser
   */
  async beforeContext(
    options: Playwright.BrowserContextOptions,
    browser: Playwright.Browser
  ): Promise<Playwright.BrowserContextOptions | void> {}

  /**
   * After a new browser context has been created.
   *
   * Note: `playwright` specific.
   *
   * @param  options - Playwright browser context options
   * @param  context - Playwright browser context
   */
  async onContextCreated(
    context: Playwright.BrowserContext,
    options: Playwright.BrowserContextOptions
  ) {}

  /**
   * Called when a page has been created.
   *
   * The event will also fire for popup pages.
   *
   * @see https://playwright.dev/#version=v1.3.0&path=docs%2Fapi.md&q=event-page
   * @see https://pptr.dev/#?product=Puppeteer&version=main&show=api-event-targetcreated
   *
   * @param  {Puppeteer.Page|Playwright.Page} page
   * @example
   * async onPageCreated (page) {
   *   let ua = await page.browser().userAgent()
   *   if (this.opts.stripHeadless) {
   *     ua = ua.replace('HeadlessChrome/', 'Chrome/')
   *   }
   *   this.debug('new ua', ua)
   *   await page.setUserAgent(ua)
   * }
   */
  async onPageCreated(page: Page) {}

  /**
   * Called when a page has been closed.
   *
   */
  async onPageClose(page: Page) {}

  /**
   * Called when a browser context has been closed.
   *
   * Note: `playwright` specific.
   *
   */
  async onContextClose(context: Playwright.BrowserContext) {}

  /**
   * Called when the browser got disconnected.
   *
   * This might happen because of one of the following:
   * - The browser is closed or crashed
   * - The `browser.disconnect` method was called
   *
   * @param browser - The `puppeteer` or `playwright` browser instance.
   */
  async onDisconnected(browser: Browser) {}
}

/**
 * AutomationExtraPlugin - Meant to be used as a base class and it's methods overridden.
 *
 * Implements all `PluginLifecycleMethods`.
 *
 * @example
 *   class Plugin extends AutomationExtraPlugin {
 *     constructor(opts = {}) {
 *       super(opts)
 *     }
 *
 *     get name() {
 *       return 'foobar'
 *     }
 *
 *     async beforeLaunch(options) {
 *       options.headless = false
 *       return options
 *     }
 *   }
 */
export abstract class AutomationExtraPlugin extends PluginLifecycleMethods {
  /** @private */
  private _debugBase: Debugger
  /** @private */
  private _opts: PluginOptions

  /**
   * Contains info regarding the launcher environment the plugin runs in
   * @see LauncherEnv
   */
  public env: LauncherEnv

  constructor(opts?: PluginOptions) {
    super()
    this._debugBase = debug(`automation-extra-plugin:base:${this.name}`)

    this._opts = merge(this.defaults, opts || {})

    this.env = new LauncherEnv()

    this._debugBase('Initialized.')
  }

  /**
   * Plugin name (required).
   *
   * Convention:
   * - Package: `automation-extra-plugin-anonymize-ua`
   * - Name: `anonymize-ua`
   *
   * @example
   * get name () { return 'anonymize-ua' }
   */
  get name(): string {
    throw new Error('Plugin must override "name"')
  }

  /**
   * Plugin defaults (optional).
   *
   * If defined will be ([deep-](https://github.com/jonschlinkert/merge-deep))merged with the (optional) user supplied options (supplied during plugin instantiation).
   *
   * The result of merging defaults with user supplied options can be accessed through `this.opts`.
   *
   * @see [[opts]]
   *
   * @example
   * get defaults () {
   *   return {
   *     stripHeadless: true,
   *     makeWindows: true,
   *     customFn: null
   *   }
   * }
   *
   * // Users can overwrite plugin defaults during instantiation:
   * puppeteer.use(require('puppeteer-extra-plugin-foobar')({ makeWindows: false }))
   */
  get defaults(): PluginOptions {
    return {}
  }

  /**
   * Plugin requirements (optional).
   *
   * Signal certain plugin requirements to the base class and the user.
   *
   * Currently supported:
   * - `launch`
   *   - If the plugin only supports locally created browser instances (no `puppeteer.connect()`),
   *     will output a warning to the user.
   * - `headful`
   *   - If the plugin doesn't work in `headless: true` mode,
   *     will output a warning to the user.
   * - `runLast`
   *   - In case the plugin prefers to run after the others.
   *     Useful when the plugin needs data from others.
   *
   * @example
   * get requirements () {
   *   return new Set(['runLast', 'dataFromPlugins'])
   * }
   */
  get requirements(): PluginRequirements {
    return new Set([])
  }

  /**
   * Plugin dependencies (optional).
   *
   * Missing plugins will be required() by automation-extra.
   *
   * @example
   * // Will ensure the 'puppeteer-extra-plugin-user-preferences' plugin is loaded.
   * get dependencies () {
   *   return new Set(['user-preferences'])
   * }
   *
   * // Will load `user-preferences` plugin and pass `{ beCool: true }` as opts
   * get dependencies () {
   *   return new Map([['user-preferences', { beCool: true }]])
   * }
   *
   */
  get dependencies(): PluginDependencies {
    return new Set([])
  }

  /**
   * Access the plugin options (usually the `defaults` merged with user defined options)
   *
   * To skip the auto-merging of defaults with user supplied opts don't define a `defaults`
   * property and set the `this._opts` Object in your plugin constructor directly.
   *
   * @see [[defaults]]
   *
   * @example
   * get defaults () { return { foo: "bar" } }
   *
   * async onPageCreated (page) {
   *   this.debug(this.opts.foo) // => bar
   * }
   */
  get opts(): PluginOptions {
    return this._opts
  }

  /**
   *  Convenience debug logger based on the [debug] module.
   *  Will automatically namespace the logging output to the plugin package name.
   *  [debug]: https://www.npmjs.com/package/debug
   *
   *  ```bash
   *  # toggle output using environment variables
   *  DEBUG=automation-extra-plugin:<plugin_name> node foo.js
   *  # to debug all the things:
   *  DEBUG=automation-extra,automation-extra-plugin:* node foo.js
   *  ```
   *
   * @example
   * this.debug('hello world')
   * // will output e.g. 'automation-extra-plugin:anonymize-ua hello world'
   */
  get debug(): Debugger {
    return debug(`automation-extra-plugin:${this.name}`)
  }

  /**
   * @private
   */
  get _isAutomationExtraPlugin() {
    return true
  }
}

export type SupportedDrivers = 'playwright' | 'puppeteer'
export type BrowserEngines = 'chromium' | 'firefox' | 'webkit'

/**
 * Store environment specific info and make lookups easy
 */
export class LauncherEnv {
  // The browser might not be known from the very start, as we might lazy require the vanilla packages.
  // Also puppeteer supports defining the browser during launch()

  /**
   * The name of the browser engine currently in use: `"chromium" | "firefox" | "webkit"`.
   */
  public browserName: BrowserEngines | 'unknown' = 'unknown'

  /**
   * The name of the driver currently in use: `"playwright" | "puppeteer"`.
   */
  public driverName: SupportedDrivers | 'unknown' = 'unknown'

  /** @private */
  constructor(driverName?: SupportedDrivers | 'unknown') {
    if (driverName) {
      this.driverName = driverName
    }
  }

  // Helper methods for convenience
  get isPuppeteer() {
    return this.driverName === 'puppeteer'
  }
  get isPlaywright() {
    return this.driverName === 'playwright'
  }
  get isChromium() {
    return this.browserName === 'chromium'
  }
  get isFirefox() {
    return this.browserName === 'firefox'
  }
  get isWebkit() {
    return this.browserName === 'webkit'
  }
  get isBrowserKnown() {
    return this.browserName !== 'unknown'
  }

  // Type guards work by discriminating against properties only found in that specific type

  /**
   * Type guard, will make TypeScript understand which type we're working with.
   * @param obj - The object to test
   * @returns {boolean}
   */
  isPuppeteerPage(obj: any): obj is Puppeteer.Page {
    return 'setUserAgent' in (obj as Puppeteer.Page)
  }
  /**
   * Type guard, will make TypeScript understand which type we're working with.
   * @param obj - The object to test
   * @returns {boolean}
   */
  isPuppeteerBrowser(obj: any): obj is Puppeteer.Browser {
    return 'createIncognitoBrowserContext' in (obj as Puppeteer.Browser)
  }
  /**
   * Type guard, will make TypeScript understand which type we're working with.
   * @param obj - The object to test
   * @returns {boolean}
   */
  isPuppeteerBrowserContext(obj: any): obj is Puppeteer.BrowserContext {
    return 'clearPermissionOverrides' in (obj as Puppeteer.BrowserContext)
  }
  /**
   * Type guard, will make TypeScript understand which type we're working with.
   * @param obj - The object to test
   * @returns {boolean}
   */
  isPlaywrightPage(obj: any): obj is Playwright.Page {
    return 'unroute' in (obj as Playwright.Page)
  }
  /**
   * Type guard, will make TypeScript understand which type we're working with.
   * @param obj - The object to test
   * @returns {boolean}
   */
  isPlaywrightBrowser(obj: any): obj is Playwright.Browser {
    return 'newContext' in (obj as Playwright.Browser)
  }
  /**
   * Type guard, will make TypeScript understand which type we're working with.
   * @param obj - The object to test
   * @returns {boolean}
   */
  isPlaywrightBrowserContext(obj: any): obj is Playwright.BrowserContext {
    return 'addCookies' in (obj as Playwright.BrowserContext)
  }
}
