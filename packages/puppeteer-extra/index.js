'use strict'

let Puppeteer, PuppeteerBrowserFetcher
try {
  Puppeteer = require('puppeteer/lib/Puppeteer')
  PuppeteerBrowserFetcher = require('puppeteer/lib/BrowserFetcher')
} catch (err) {
  console.warn(`
    Puppeteer is missing. :-)

    Note: puppeteer is a peer dependency of puppeteer-extra,
    which means you can install your own preferred version.

    To get the latest stable verson run: 'npm i --save puppeteer'
    To get the latest tip-of-tree verson run: 'npm i --save puppeteer@next'
  `)
  throw err
}

const merge = require('deepmerge')
const debug = require('debug')('puppeteer-extra')

/**
 * Modular framework to teach puppeteer new tricks.
 *
 * This module acts a drop-in replacement for puppeteer.
 *
 * Allows PuppeteerExtraPlugin's to register themselves and
 * to extend puppeteer with additional functionality.
 */
class PuppeteerExtra {
  constructor () {
    this._plugins = []
    this._browser = null
    this._options = {
      args: []
    }
  }

  /**
   * Main outside interface to register plugins.
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
    if (!plugin.name) {
      console.error(`Warning: Plugin with no name registered, ignoring.`, plugin)
      return this
    }
    plugin.puppeteer = this
    this._plugins.push(plugin)
    debug('plugin loaded', plugin.name)
    return this
  }

  /**
   * Main launch method kickstarting the extra functionality.
   *
   * @param {Object=} options - Regular Puppeteer options
   * @return {Promise<Puppeteer.Browser>}
   */
  async launch (options = {}) {
    debug('launch', {options})
    // Ensure there are certain properties (e.g. the `options.args` array)
    this._options = merge(this._options, options)
    this.checkPluginDependencies()
    this.checkPluginRequirements()

    this._options = await this.beforeLaunch(this._options)
    this._browser = await Puppeteer.launch(this._options)

    for (const plugin of this._plugins) {
      plugin.browser = this._browser
      plugin.options = this._options
    }
    this.bindBrowserEvents(this._browser)
    await this.afterLaunch(this._browser)
    return this._browser
  }

  /**
   * Get all loaded plugins.
   *
   * @member {Array<PuppeteerExtraPlugin>}
   */
  get plugins () { return this._plugins }

  /**
   * Get the names of all loaded plugins.
   *
   * @member {Array<string>}
   */
  get pluginNames () { return this._plugins.map(p => p.name) }

  /**
   * Get all plugins that feature a given property.
   *
   * The idea of plugins registering their hooks
   * by exposing specific properties is used throughout this module.
   *
   * @param  {string} prop
   * @return {Array<PuppeteerExtraPlugin>}
   */
  getPluginsByProp (prop) {
    return this._plugins.filter(plugin => (prop in plugin))
  }

  /**
   * Generate and return files based on plugin properties and values.
   *
   * Currently we use this exclusively for userPreferences
   * but this could be extended to allow plguins to define
   * arbitrary files to be written.
   *
   * The current main consumer is the 'user-data-dir' plugin.
   *
   * @member {Array<Objects>}
   */
  get files () {
    const files = []
    // Deep merge all plugin provided user preferences
    const userPreferences = merge.all(
      this.getPluginsByProp('userPreferences').map(p => p.userPreferences)
    )
    files.push({
      target: 'Profile',
      file: 'Preferences',
      contents: JSON.stringify(userPreferences, null, 2)
    })
    return files
  }

  checkPluginRequirements () {
    for (const plugin of this._plugins) {
      for (const requirement of plugin.requirements) {
        if ((requirement === 'headful') && this._options.headless) {
          console.warn(`Warning: Plugin '${plugin.name}' is not supported in headless mode.`)
        }
      }
    }
  }

  checkPluginDependencies () {
    const requiresUserDataDir = !!this.getPluginsByProp('userPreferences').length
    debug('requiresUserDataDir', requiresUserDataDir)
    if (!requiresUserDataDir) { return }

    const hasUserDataDirPlugin = this.pluginNames.includes('user-data-dir')
    if (hasUserDataDirPlugin) {
      // Move user-data-dir plugin to last position
      const index = this._plugins.findIndex(p => p.name === 'user-data-dir')
      this._plugins.push(this._plugins.splice(index, 1)[0])
    } else {
      try {
        this.use(require('puppeteer-extra-plugin-user-data-dir')())
      } catch (err) {
        console.warn(`
          A plugin requires a custom user data dir,
          please install this dependency: 'puppeteer-extra-plugin-user-data-dir'.

          npm i --save puppeteer-extra-plugin-user-data-dir

          Note: You don't need to require it yourself,
          unless you want to deviate from the defaults.
          `)
        throw err
      }
    }
  }

  /**
   * Call plugins sequentially with the same value.
   * Plugins that expose the supplied property will be called.
   *
   * @param  {string} prop - The plugin property to call
   * @param  {*} value - Any value
   */

  async callPlugins (prop, value) {
    for (const plugin of this.getPluginsByProp(prop)) {
      await plugin[prop](value)
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
   */
  async callPluginsWithValue (prop, value) {
    for (const plugin of this.getPluginsByProp(prop)) {
      const newValue = await plugin[prop](value)
      if (newValue) { value = newValue }
    }
    return value
  }

  /**
   * Register common browser/process events and dispatch
   * them to Plugins that expressed interest in them.
   *
   * Plugins could do this themselves but the idea is to
   * avoid boilerplates and make the Plugin code more terse.
   *
   * @param  {<Puppeteer.Browser>} browser
   */
  async bindBrowserEvents (browser) {
    // Note: This includes incognito browser contexts as wel
    // https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#event-targetcreated
    browser.on('targetcreated', this.onTargetCreated.bind(this))
    browser.on('targetchanged', this.onTargetChanged.bind(this))
    browser.on('targetdestroyed', this.onTargetDestroyed.bind(this))
    browser.on('disconnected', this.onDisconnected.bind(this))

    // Expose an additional event to make it easy for plugins to clean up.
    // This is a bit extreme, but better safe than sorry. :-)
    browser._process.once('close', this.onClose.bind(this))
    process.on('exit', this.onClose.bind(this))
    if (!(this._options.handleSIGINT === false)) {
      process.on('SIGINT', this.onClose.bind(this))
    }
    if (!(this._options.handleSIGTERM === false)) {
      process.on('SIGTERM', this.onClose.bind(this))
    }
    if (!(this._options.handleSIGHUP === false)) {
      process.on('SIGHUP', this.onClose.bind(this))
    }
  }

  async onTargetCreated (target) {
    // Pre filter for plugin developers convenience
    if (target.type() === 'page') {
      await this.onPageCreated(await target.page())
    }
    await this.callPlugins('onTargetCreated', target)
  }

  async onPageCreated (page) {
    await this.callPlugins('onPageCreated', page)
  }

  async onTargetChanged (target) {
    await this.callPlugins('onTargetChanged', target)
  }

  async onTargetDestroyed (target) {
    await this.callPlugins('onTargetDestroyed', target)
  }

  async onDisconnected () {
    await this.callPlugins('onDisconnected')
  }

  async onClose () {
    await this.callPlugins('onClose')
  }

  async beforeLaunch (options) {
    return this.callPluginsWithValue('beforeLaunch', options)
  }

  async afterLaunch (browser) {
    await this.callPlugins('afterLaunch', browser)
  }

  /**
   * Regular Puppeteer method that is being passed through.
   *
   * @param {{browserWSEndpoint: string, ignoreHTTPSErrors: boolean}} options
   * @return {Promise<!Puppeteer.Browser>}
   */
  connect (options) {
    return Puppeteer.connect(options)
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
    return new PuppeteerBrowserFetcher(options)
  }
}

module.exports = new PuppeteerExtra()
