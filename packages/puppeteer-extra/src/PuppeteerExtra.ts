import { Browser } from 'puppeteer'
import { VanillaPuppeteer, PuppeteerLaunchOption, BrowserEventOptions, PuppeteerExtraPlugin, BrowserInternals, PluginData } from './deps';
import Debug from 'debug'
const debug = Debug('puppeteer-extra')

import merge from 'deepmerge'

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

export const commonPlugins = ['adblocker', 'anonymize-ua', 'block-resources', 'click-and-wait', 'devtools', 'flash', 'font-size', 'recaptcha', 'repl', 'stealth', 'user-data-dir', 'user-preferences'] as const;

export type PluginName =
  | `stealth/evasions/${typeof allAvailableEvasions[number]}`
  | `${typeof commonPlugins[number]}`
  | `${string}`

/**
 * Modular plugin framework to teach `puppeteer` new tricks.
 *
 * This module acts as a drop-in replacement for `puppeteer`.
 *
 * Allows PuppeteerExtraPlugin's to register themselves and
 * to extend puppeteer with additional functionality.
 *
 * @class PuppeteerExtra
 * @implements {VanillaPuppeteer}
 *
 * @example
 * const puppeteer = require('puppeteer-extra')
 * puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua').default())
 * puppeteer.use(require('puppeteer-extra-plugin-font-size')({defaultFontSize: 18}))
 *
 * ;(async () => {
 *   const browser = await puppeteer.launch({headless: false})
 *   const page = await browser.newPage()
 *   await page.goto('http://example.com', {waitUntil: 'domcontentloaded'})
 *   await browser.close()
 * })()
 */
export class PuppeteerExtra implements VanillaPuppeteer {
  private _plugins: PuppeteerExtraPlugin[] = []
    // Option given to the `new Plugin()` constructor
    private _pluginOptions: { [key: PluginName]: any } = {};

  constructor(
    private _pptr?: VanillaPuppeteer,
    private _requireError?: Error
  ) { }

  /**
   * set a plugin option this method must be called befor lanch or connect
   * @param name plugin name
   * @param options option
   */
  public setPluginOptions(name: PluginName, options: any): void {
      this._pluginOptions[name] = options
  }
  
    /**
     * get all plugins options
     */
  public get pluginOptions(): { [key: PluginName]: any } {
      return this._pluginOptions;
  }

  /**
   * The **main interface** to register `puppeteer-extra` plugins.
   * call this use multiple time to enable multiple plugins
   *
   * @example
   * puppeteer.use(plugin1).use(plugin2)
   *
   * @see [PuppeteerExtraPlugin]
   *
   * @return The same `PuppeteerExtra` instance (for optional chaining)
   */
  public use(plugin: PuppeteerExtraPlugin): this {
    if (typeof plugin !== 'object' || !plugin._isPuppeteerExtraPlugin) {
      console.error(`Warning: Plugin is not derived from PuppeteerExtraPlugin, ignoring.`, plugin)
      return this
    }
    if (!plugin.name) {
      console.error(`Warning: Plugin with no name registering, ignoring.`, plugin)
      return this
    }
    if (plugin.requirements.has('dataFromPlugins')) {
      plugin.getDataFromPlugins = this.getPluginData.bind(this)
    }
    const extraOptions = plugin.dependenciesOptions
    if (extraOptions) {
      for (const [name, options] of Object.entries(extraOptions)) {
        this.setPluginOptions(name, options)
      }
    }
    plugin._register(Object.getPrototypeOf(plugin))
    this._plugins.push(plugin)
    debug('plugin registered', plugin.name)
    return this
  }

  /**
   * To stay backwards compatible with puppeteer's (and our) default export after adding `addExtra`
   * we need to defer the check if we have a puppeteer instance to work with.
   * Otherwise we would throw even if the user intends to use their non-standard puppeteer implementation.
   *
   * @private
   */
  get pptr(): VanillaPuppeteer {
    if (this._pptr) {
      return this._pptr
    }

    // Whoopsie
    console.warn(`
    Puppeteer is missing. :-)

    Note: puppeteer is a peer dependency of puppeteer-extra,
    which means you can install your own preferred version.

    - To get the latest stable version run: 'yarn add puppeteer' or 'npm i puppeteer'

    Alternatively:
    - To get puppeteer without the bundled Chromium browser install 'puppeteer-core'
    `)
    throw this._requireError || new Error('No puppeteer instance provided.')
  }

  /**
   * The method launches a browser instance with given arguments. The browser will be closed when the parent node.js process is closed.
   *
   * Augments the original `puppeteer.launch` method with plugin lifecycle methods.
   *
   * All registered plugins that have a `beforeLaunch` method will be called
   * in sequence to potentially update the `options` Object before launching the browser.
   *
   * @example
   * const browser = await puppeteer.launch({
   *   headless: false,
   *   defaultViewport: null
   * })
   *
   * @param options - See [puppeteer docs](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions).
   */
  async launch(
    options?: PuppeteerLaunchOption
  ): ReturnType<VanillaPuppeteer['launch']> {
    // Ensure there are certain properties (e.g. the `options.args` array)
    const defaultLaunchOptions = { args: [] }
    options = merge(defaultLaunchOptions, options || {})
    this.resolvePluginDependencies()
    this.orderPlugins()

    // Give plugins the chance to modify the options before launch
    options = await this.callPluginsWithValue('beforeLaunch', options)

    const opts: BrowserEventOptions = {
      context: 'launch',
      options,
      defaultArgs: this.defaultArgs
    }

    // Let's check requirements after plugin had the chance to modify the options
    this.checkPluginRequirements(opts)

    const browser = await this.pptr.launch(options)
    this._patchPageCreationMethods(browser as BrowserInternals) // casts needed for pptr 8-

    await this.callPlugins('_bindBrowserEvents', browser, opts)
    return browser
  }

  /**
   * Attach Puppeteer to an existing Chromium instance.
   *
   * Augments the original `puppeteer.connect` method with plugin lifecycle methods.
   *
   * All registered plugins that have a `beforeConnect` method will be called
   * in sequence to potentially update the `options` Object before launching the browser.
   *
   * @param options - See [puppeteer docs](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteerconnectoptions).
   */
  async connect(
    options: Parameters<VanillaPuppeteer['connect']>[0]
  ): ReturnType<VanillaPuppeteer['connect']> {
    this.resolvePluginDependencies()
    this.orderPlugins()

    // Give plugins the chance to modify the options before connect
    options = await this.callPluginsWithValue('beforeConnect', options)

    const opts: BrowserEventOptions = { context: 'connect', options }

    // Let's check requirements after plugin had the chance to modify the options
    this.checkPluginRequirements(opts)

    const browser = await this.pptr.connect(options)
    this._patchPageCreationMethods(browser as BrowserInternals) // casts needed for pptr 8-

    await this.callPlugins('_bindBrowserEvents', browser, opts)
    return browser
  }

  /**
   * The default flags that Chromium will be launched with.
   *
   * @param options - See [puppeteer docs](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteerdefaultargsoptions).
   */
  defaultArgs(
    options?: Parameters<VanillaPuppeteer['defaultArgs']>[0]
  ): ReturnType<VanillaPuppeteer['defaultArgs']> {
    return this.pptr.defaultArgs(options)
  }

  /** Path where Puppeteer expects to find bundled Chromium. */
  executablePath(): string {
    return this.pptr.executablePath()
  }

  /**
   * This methods attaches Puppeteer to an existing Chromium instance.
   *
   * @param options - See [puppeteer docs](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteercreatebrowserfetcheroptions).
   */
  createBrowserFetcher(
    options: Parameters<VanillaPuppeteer['createBrowserFetcher']>[0]
  ): ReturnType<VanillaPuppeteer['createBrowserFetcher']> {
    return this.pptr.createBrowserFetcher(options)
  }

  /**
   * Patch page creation methods (both regular and incognito contexts).
   *
   * Unfortunately it's possible that the `targetcreated` events are not triggered
   * early enough for listeners (e.g. plugins using `onPageCreated`) to be able to
   * modify the page instance (e.g. user-agent) before the browser request occurs.
   *
   * This only affects the first request of a newly created page target.
   *
   * As a workaround I've noticed that navigating to `about:blank` (again),
   * right after a page has been created reliably fixes this issue and adds
   * no noticable delay or side-effects.
   *
   * This problem is not specific to `puppeteer-extra` but default Puppeteer behaviour.
   *
   * Note: This patch only fixes explicitly created pages, implicitly created ones
   * (e.g. through `window.open`) are still subject to this issue. I didn't find a
   * reliable mitigation for implicitly created pages yet.
   *
   * Puppeteer issues:
   * https://github.com/GoogleChrome/puppeteer/issues/2669
   * https://github.com/puppeteer/puppeteer/issues/3667
   * https://github.com/GoogleChrome/puppeteer/issues/386#issuecomment-343059315
   * https://github.com/GoogleChrome/puppeteer/issues/1378#issue-273733905
   *
   * @private
   */
  private _patchPageCreationMethods(browser: BrowserInternals): void {
    if (!browser._createPageInContext) {
      debug(
        'warning: _patchPageCreationMethods failed (no browser._createPageInContext)'
      )
      return
    }
    browser._createPageInContext = (function (originalMethod, context) {
      return async function () {
        const page = await originalMethod.apply(context, arguments as any)
        await page.goto('about:blank')
        return page
      }
    })(browser._createPageInContext, browser)
  }

  /**
   * Get a list of all registered plugins.
   *
   * @member {Array<PuppeteerExtraPlugin>}
   */
  get plugins(): PuppeteerExtraPlugin[] {
    return this._plugins
  }

  /**
   * Get the names of all registered plugins.
   *
   * @member {Array<string>}
   * @private
   */
   get pluginNames(): string[] {
    return this._plugins.map(p => p.name)
  }

  /**
   * Collects the exposed `data` property of all registered plugins.
   * Will be reduced/flattened to a single array.
   *
   * Can be accessed by plugins that listed the `dataFromPlugins` requirement.
   *
   * Implemented mainly for plugins that need data from other plugins (e.g. `user-preferences`).
   *
   * @see [PuppeteerExtraPlugin]/data
   * @param name - Filter data by optional plugin name
   *
   * @private
   */
  public getPluginData(name?: PluginName): PluginData[] {
    const data = this._plugins
      .map(p => (Array.isArray(p.data) ? p.data : [p.data]))
      .reduce((acc, arr) => [...acc, ...arr], [])
    return name ? data.filter((d: any) => d.name === name) : data
  }

  /**
   * Get all plugins that feature a given property/class method.
   *
   * @private
   */
  private getPluginsByProp(prop: '_bindBrowserEvents' | 'beforeLaunch' | 'beforeConnect'): PuppeteerExtraPlugin[] {
    return this._plugins.filter(plugin => prop in plugin)
  }

  /**
   * Lightweight plugin dependency management to require plugins and code mods on demand.
   *
   * This uses the `dependencies` stanza (a `Set`) exposed by `puppeteer-extra` plugins.
   *
   * @todo Allow objects as depdencies that contains opts for the requested plugin.
   *
   * @private
   */
   private resolvePluginDependencies(): void {
    const loadedPlugins = new Set<string>(this._plugins.map(p => p.name))
    const missingPlugins = new Set<string>()

    const requierDep = (plugin: PuppeteerExtraPlugin): void => {
      let dependencies = plugin.dependencies;

      if (!dependencies) { // patch retrocompatibility with old plugins
        const getMissingDependencies = (plugin as any)._getMissingDependencies;
        if (getMissingDependencies) {
          console.error(`${plugin.name} is an old plugin that do not provide dependencies, Recovering old dependencies`);
          dependencies = getMissingDependencies([]);
        } else {
          console.error(`${plugin.name} plugin does not provide dependencies list`);
          dependencies = [];
        }
      }
      // convert Set<string> to Array<string>
      [...plugin.dependencies].filter(p => !loadedPlugins.has(p)).forEach(dep => missingPlugins.add(dep))
    }

    for (const plugin of this._plugins) {
      requierDep(plugin)
    }

    while (missingPlugins.size) {
      debug('dependencies missing', missingPlugins)
      // Loop through all dependencies declared missing by plugins
      for (let n of [...missingPlugins]) {
        missingPlugins.delete(n)
        // We follow a plugin naming convention, but let's rather enforce it <3
        // export type PluginFullName = `puppeteer-extra-plugin-${PluginName}`;
        const fullname = n.startsWith('puppeteer-extra-plugin') ? n : `puppeteer-extra-plugin-${n}`
        // In case a module sub resource is requested print out the main package name
        // e.g. puppeteer-extra-plugin-stealth/evasions/console.debug => puppeteer-extra-plugin-stealth
        const packageName = fullname.split('/')[0]
        try {
          const req = require(fullname);
          const shortName: PluginName = fullname.substring('puppeteer-extra-plugin-'.length);
          const opts = this._pluginOptions[shortName] || undefined;
          let dep: PuppeteerExtraPlugin | null = null
          // Try to require and instantiate the stated dependency
          if ('default' in req) {
            dep = req.default(opts)
          } else {
            dep = req(opts)
          }
          loadedPlugins.add(n)
          // Register it with `puppeteer-extra` as plugin
          if (dep) {
            this.use(dep)
            requierDep(dep)
          }
        } catch (err) {
          console.warn(`
            A plugin listed '${fullname}' as dependency,
            which is currently missing. Please install it:
  
            yarn add ${packageName}
  
            Note: You don't need to require the plugin yourself,
            unless you want to modify it's default settings.
            `)
          throw err
        }
      }
    }
  }

  /**
   * Order plugins that have expressed a special placement requirement.
   *
   * This is useful/necessary for e.g. plugins that depend on the data from other plugins.
   *
   * @todo Support more than 'runLast'.
   * @todo If there are multiple plugins defining 'runLast', sort them depending on who depends on whom. :D
   *
   * @private
   */
   private orderPlugins(): void {
    debug('orderPlugins:before', this.pluginNames)
    const runFirst: PuppeteerExtraPlugin[] = []
    const runLast: PuppeteerExtraPlugin[] = []
    for (const p of this._plugins) {
      if (p.requirements.has('runLast'))
        runLast.push(p)
      else
        runFirst.push(p)
    }
    this._plugins = [...runFirst, ...runLast]
    debug('orderPlugins:after', this.pluginNames)
  }

  /**
   * Lightweight plugin requirement checking.
   *
   * The main intent is to notify the user when a plugin won't work as expected.
   *
   * @todo This could be improved, e.g. be evaluated by the plugin base class.
   *
   * @private
   */
   private checkPluginRequirements(opts: BrowserEventOptions): void;
   private checkPluginRequirements(opts = {} as { context: 'launch' | 'connect', options: any }): void {
     for (const plugin of this._plugins) {
      for (const requirement of plugin.requirements) {
        if (
          opts.context === 'launch' &&
          requirement === 'headful' &&
          opts.options.headless
        ) {
          console.warn(
            `Warning: Plugin '${plugin.name}' is not supported in headless mode.`
          )
        }
        if (opts.context === 'connect' && requirement === 'launch') {
          console.warn(
            `Warning: Plugin '${plugin.name}' doesn't support puppeteer.connect().`
          )
        }
      }
    }
  }

  /**
   * Call plugins sequentially with the same values.
   * Plugins that expose the supplied property will be called.
   *
   * @param prop - The plugin property to call
   * @param values - Any number of values
   * @private
   */
   private async callPlugins(prop: '_bindBrowserEvents', browser: Browser, opts: BrowserEventOptions): Promise<void>;
   private async callPlugins(prop: '_bindBrowserEvents', ...values: any[]): Promise<void> {
       for (const plugin of this.getPluginsByProp(prop)) {
      await plugin[prop].apply(plugin, values)
    }
  }

  /**
   * Call plugins sequentially and pass on a value (waterfall style).
   * Plugins that expose the supplied property will be called.
   *
   * The plugins can either modify the value or return an updated one.
   * Will return the latest, updated value which ran through all plugins.
   *
   * @param prop - The plugin property to call
   * @param value - Any value
   * @return The new updated value
   * @private
   */
   private async callPluginsWithValue(prop: 'beforeLaunch', value: PuppeteerLaunchOption): Promise<PuppeteerLaunchOption>;
   private async callPluginsWithValue(prop: 'beforeConnect', value: Parameters<VanillaPuppeteer['connect']>[0]): Promise<Parameters<VanillaPuppeteer['connect']>[0]>;
   private async callPluginsWithValue(prop: 'beforeLaunch' | 'beforeConnect', value: PuppeteerLaunchOption | Parameters<VanillaPuppeteer['connect']>[0]) {
    for (const plugin of this.getPluginsByProp(prop)) {
      const newValue = await plugin[prop](value)
      if (newValue) {
        value = newValue
      }
    }
    return value
  }
}

export default PuppeteerExtra;