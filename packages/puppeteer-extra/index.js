'use strict'

let Puppeteer
try {
  // https://github.com/GoogleChrome/puppeteer/pull/3208
  try {
    Puppeteer = require('puppeteer')
  } catch (err) {
    Puppeteer = require('puppeteer-core')
  }
} catch (err) {
  console.warn(`
    Puppeteer is missing. :-)

    Note: puppeteer is a peer dependency of puppeteer-extra,
    which means you can install your own preferred version.

    To get the latest stable verson run: 'yarn add puppeteer'
    To get the latest tip-of-tree verson run: 'yarn add puppeteer@next'
  `)
  throw err
}

const merge = require('deepmerge')
const debug = require('debug')('puppeteer-extra')

/**
 * Modular plugin framework to teach `puppeteer` new tricks.
 *
 * This module acts a drop-in replacement for `puppeteer`.
 *
 * Allows PuppeteerExtraPlugin's to register themselves and
 * to extend puppeteer with additional functionality.
 *
 * @example
 * const puppeteer = require('puppeteer-extra')
 * puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')())
 * puppeteer.use(require('puppeteer-extra-plugin-font-size')({defaultFontSize: 18}))
 *
 * ;(async () => {
 *   const browser = await puppeteer.launch({headless: false})
 *   const page = await browser.newPage()
 *   await page.goto('http://example.com', {waitUntil: 'domcontentloaded'})
 *   await browser.close()
 * })()
 */
class PuppeteerExtra {
  constructor () {
    this._plugins = []

    // Ensure there are certain properties (e.g. the `options.args` array)
    this._defaultLaunchOptions = { args: [] }
  }

  /**
   * Outside interface to register plugins.
   *
   * @param  {PuppeteerExtraPlugin} plugin
   * @return {this} - For chaining
   *
   * @example
   * const puppeteer = require('puppeteer-extra')
   * puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')())
   * puppeteer.use(require('puppeteer-extra-plugin-user-preferences')())
   * const browser = await puppeteer.launch(...)
   */
  use (plugin) {
    if ((typeof plugin !== 'object') || !plugin._isPuppeteerExtraPlugin) {
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
    plugin._register(Object.getPrototypeOf(plugin))
    this._plugins.push(plugin)
    debug('plugin registered', plugin.name)
    return this
  }

  /**
   * Launch a new browser instance with given arguments.
   *
   * Augments the original `puppeteer.launch` method with plugin lifecycle methods.
   *
   * All registered plugins that have a `beforeLaunch` method will be called
   * in sequence to potentially update the `options` Object before launching the browser.
   *
   * @todo pass `defaultArgs` to `beforeLaunch` calls to plugins.
   *
   * @param {Object=} options - Regular [Puppeteer launch options](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions)
   * @return {Puppeteer.Browser}
   */
  async launch (options = {}) {
    options = merge(this._defaultLaunchOptions, options)
    this.resolvePluginDependencies()
    this.orderPlugins()

    // Give plugins the chance to modify the options before launch
    options = await this.callPluginsWithValue('beforeLaunch', options)

    const opts = { context: 'launch', options, defaultArgs: this.defaultArgs }

    // Let's check requirements after plugin had the chance to modify the options
    this.checkPluginRequirements(opts)

    const browser = await Puppeteer.launch(options)
    this._patchPageCreationMethods(browser)

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
   * @param {{browserWSEndpoint: string, ignoreHTTPSErrors: boolean}} options
   * @return {Promise<!Puppeteer.Browser>}
   */
  async connect (options = {}) {
    this.resolvePluginDependencies()
    this.orderPlugins()

    // Give plugins the chance to modify the options before connect
    options = await this.callPluginsWithValue('beforeConnect', options)

    const opts = { context: 'connect', options }

    // Let's check requirements after plugin had the chance to modify the options
    this.checkPluginRequirements(opts)

    const browser = await Puppeteer.connect(options)
    this._patchPageCreationMethods(browser)

    await this.callPlugins('_bindBrowserEvents', browser, opts)

    return browser
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
   * https://github.com/GoogleChrome/puppeteer/issues/386#issuecomment-343059315
   * https://github.com/GoogleChrome/puppeteer/issues/1378#issue-273733905
   *
   * @private
   */
  _patchPageCreationMethods (browser) {
    browser._createPageInContext = (function (originalMethod, context) {
      return async (contextId) => {
        const page = await originalMethod.apply(context, arguments)
        await page.goto('about:blank')
        return page
      }
    })(browser._createPageInContext, browser)
  }

  /**
   * Get all registered plugins.
   *
   * @member {Array<PuppeteerExtraPlugin>}
   */
  get plugins () { return this._plugins }

  /**
   * Get the names of all registered plugins.
   *
   * @member {Array<string>}
   * @private
   */
  get pluginNames () { return this._plugins.map(p => p.name) }

  /**
   * Collects the exposed `data` property of all registered plugins.
   * Will be reduced/flattened to a single array.
   *
   * Can be accessed by plugins that listed the `dataFromPlugins` requirement.
   *
   * Implemented mainly for plugins that need data from other plugins (e.g. `user-preferences`).
   *
   * @see puppeteer-extra-plugin/data
   * @param {string=} name - Filter data by name property
   * @return {Array<Object>}
   */
  getPluginData (name = null) {
    const data = this._plugins
      .map(p => Array.isArray(p.data) ? p.data : [p.data])
      .reduce((acc, arr) => [...acc, ...arr], [])
    return name ? data.filter(d => d.name === name) : data
  }

  /**
   * Get all plugins that feature a given property/class method.
   *
   * @param  {string} prop
   * @return {Array<PuppeteerExtraPlugin>}
   * @private
   */
  getPluginsByProp (prop) {
    return this._plugins.filter(plugin => (prop in plugin))
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
  resolvePluginDependencies () {
    // Request missing dependencies from all plugins and flatten to a single Set
    const missingPlugins = this._plugins
      .map(p => p._getMissingDependencies(this._plugins))
      .reduce((combined, list) => {
        return new Set([...combined, ...list])
      }, new Set())
    if (!missingPlugins.size) {
      debug('no dependencies are missing')
      return
    }
    debug('dependencies missing', missingPlugins)
    // Loop through all dependencies declared missing by plugins
    for (let name of [...missingPlugins]) {
      // Check if the dependency hasn't been registered as plugin already.
      // This might happen when multiple plugins have nested dependencies.
      if (this.pluginNames.includes(name)) {
        debug(`ignoring dependency '${name}', which has been required already.`)
        continue
      }
      // We follow a plugin naming convention, but let's rather enforce it <3
      name = name.startsWith('puppeteer-extra-plugin') ? name : `puppeteer-extra-plugin-${name}`
      // In case a module sub resource is requested print out the main package name
      // e.g. puppeteer-extra-plugin-stealth/evasions/console.debug => puppeteer-extra-plugin-stealth
      const packageName = name.split('/')[0]
      let dep = null
      try {
        // Try to require and instantiate the stated dependency
        dep = require(name)()
        // Register it with `puppeteer-extra` as plugin
        this.use(dep)
      } catch (err) {
        console.warn(`
          A plugin listed '${name}' as dependency,
          which is currently missing. Please install it:

          yarn add ${packageName}

          Note: You don't need to require the plugin yourself,
          unless you want to modify it's default settings.
          `)
        throw err
      }
      // Handle nested dependencies :D
      if (dep.dependencies.size) {
        this.resolvePluginDependencies()
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
  orderPlugins () {
    debug('orderPlugins:before', this.pluginNames)
    const runLast = this._plugins
      .filter(p => p.requirements.has('runLast'))
      .map(p => p.name)
    for (const name of runLast) {
      const index = this._plugins.findIndex(p => p.name === name)
      this._plugins.push(this._plugins.splice(index, 1)[0])
    }
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
  checkPluginRequirements (opts = {}) {
    for (const plugin of this._plugins) {
      for (const requirement of plugin.requirements) {
        if ((opts.context === 'launch') && (requirement === 'headful') && opts.options.headless) {
          console.warn(`Warning: Plugin '${plugin.name}' is not supported in headless mode.`)
        }
        if ((opts.context === 'connect') && (requirement === 'launch')) {
          console.warn(`Warning: Plugin '${plugin.name}' doesn't support puppeteer.connect().`)
        }
      }
    }
  }

  /**
   * Call plugins sequentially with the same values.
   * Plugins that expose the supplied property will be called.
   *
   * @param  {string} prop - The plugin property to call
   * @param  {...*} values - Any number of values
   * @private
   */
  async callPlugins (prop, ...values) {
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
   * @param  {string} prop - The plugin property to call
   * @param  {*} value - Any value
   * @return {*} - The new updated value
   * @private
   */
  async callPluginsWithValue (prop, value) {
    for (const plugin of this.getPluginsByProp(prop)) {
      const newValue = await plugin[prop](value)
      if (newValue) { value = newValue }
    }
    return value
  }

  /**
   * Regular Puppeteer method that is being passed through.
   *
   * @return {string}
   */
  executablePath () {
    return Puppeteer.executablePath()
  }

  /**
   * Regular Puppeteer method that is being passed through.
   *
   * @return {Array<string>}
   */
  defaultArgs () {
    return Puppeteer.defaultArgs()
  }

  /**
   * Regular Puppeteer method that is being passed through.
   *
   * @param {Object=} options
   * @return {PuppeteerBrowserFetcher}
   */
  createBrowserFetcher (options) {
    return Puppeteer.createBrowserFetcher(options)
  }
}

module.exports = new PuppeteerExtra()
