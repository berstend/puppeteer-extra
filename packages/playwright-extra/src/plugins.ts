import Debug from 'debug'
const debug = Debug('playwright-extra:plugins')

import {
  Plugin,
  PluginMethodName,
  PluginMethodFn,
  PluginModule,
  CompatiblePluginModule
} from './types'

import { requirePackages } from './helper/loader'
import { addPuppeteerCompat } from './puppeteer-compatiblity-shim'

export class PluginList {
  private readonly _plugins: Plugin[] = []
  private readonly _dependencyDefaults: Map<string, any> = new Map()
  private readonly _dependencyResolution: Map<string, CompatiblePluginModule> =
    new Map()

  constructor() {}

  /**
   * Get a list of all registered plugins.
   */
  public get list() {
    return this._plugins
  }

  /**
   * Get the names of all registered plugins.
   */
  public get names() {
    return this._plugins.map(p => p.name)
  }

  /**
   * Add a new plugin to the list (after checking if it's well-formed).
   *
   * @param plugin
   * @internal
   */
  public add(plugin: Plugin) {
    if (!this.isValidPluginInstance(plugin)) {
      return false
    }
    if (!!plugin.onPluginRegistered) {
      plugin.onPluginRegistered({ framework: 'playwright' })
    }
    // PuppeteerExtraPlugin: Populate `_childClassMembers` list containing methods defined by the plugin
    if (!!plugin._registerChildClassMembers) {
      plugin._registerChildClassMembers(Object.getPrototypeOf(plugin))
    }
    if (plugin.requirements?.has('dataFromPlugins')) {
      plugin.getDataFromPlugins = this.getData.bind(this)
    }
    this._plugins.push(plugin)
    return true
  }

  /** Check if the shape of a plugin is correct or warn */
  protected isValidPluginInstance(plugin: Plugin) {
    if (
      !plugin ||
      typeof plugin !== 'object' ||
      !plugin._isPuppeteerExtraPlugin
    ) {
      console.error(
        `Warning: Plugin is not derived from PuppeteerExtraPlugin, ignoring.`,
        plugin
      )
      return false
    }
    if (!plugin.name) {
      console.error(
        `Warning: Plugin with no name registering, ignoring.`,
        plugin
      )
      return false
    }
    return true
  }

  /** Error callback in case calling a plugin method throws an error. Can be overwritten. */
  public onPluginError(plugin: Plugin, method: PluginMethodName, err: Error) {
    console.warn(
      `An error occured while executing "${method}" in plugin "${plugin.name}":`,
      err
    )
  }

  /**
   * Define default values for plugins implicitly required through the `dependencies` plugin stanza.
   *
   * @param dependencyPath - The string by which the dependency is listed (not the plugin name)
   *
   * @example
   * chromium.use(stealth)
   * chromium.plugins.setDependencyDefaults('stealth/evasions/webgl.vendor', { vendor: 'Bob', renderer: 'Alice' })
   */
  public setDependencyDefaults(dependencyPath: string, opts: any) {
    this._dependencyDefaults.set(dependencyPath, opts)
    return this
  }

  /**
   * Define custom plugin modules for plugins implicitly required through the `dependencies` plugin stanza.
   *
   * Using this will prevent dynamic imports from being used, which JS bundlers often have issues with.
   *
   * @example
   * chromium.use(stealth)
   * chromium.plugins.setDependencyResolution('stealth/evasions/webgl.vendor', VendorPlugin)
   */
  public setDependencyResolution(
    dependencyPath: string,
    pluginModule: CompatiblePluginModule
  ) {
    this._dependencyResolution.set(dependencyPath, pluginModule)
    return this
  }

  /**
   * Prepare plugins to be used (resolve dependencies, ordering)
   * @internal
   */
  public prepare() {
    this.resolveDependencies()
    this.order()
  }

  /** Return all plugins using the supplied method */
  protected filterByMethod(methodName: PluginMethodName) {
    return this._plugins.filter(plugin => {
      // PuppeteerExtraPlugin: The base class will already define all methods, hence we need to do a different check
      if (
        !!plugin._childClassMembers &&
        Array.isArray(plugin._childClassMembers)
      ) {
        return plugin._childClassMembers.includes(methodName)
      }
      return methodName in plugin
    })
  }

  /** Conditionally add puppeteer compatibility to values provided to the plugins */
  protected _addPuppeteerCompatIfNeeded<TMethod extends PluginMethodName>(
    plugin: Plugin,
    method: TMethod,
    args: Parameters<PluginMethodFn<TMethod>>
  ) {
    const canUseShim = plugin._isPuppeteerExtraPlugin && !plugin.noPuppeteerShim
    const methodWhitelist: PluginMethodName[] = [
      'onBrowser',
      'onPageCreated',
      'onPageClose',
      'afterConnect',
      'afterLaunch'
    ]
    const shouldUseShim = methodWhitelist.includes(method)
    if (!canUseShim || !shouldUseShim) {
      return args
    }
    debug('add puppeteer compatibility', plugin.name, method)
    return [...args.map(arg => addPuppeteerCompat(arg as any))] as Parameters<
      PluginMethodFn<TMethod>
    >
  }

  /**
   * Dispatch plugin lifecycle events in a typesafe way.
   * Only Plugins that expose the supplied property will be called.
   *
   * Will not await results to dispatch events as fast as possible to all plugins.
   *
   * @param method - The lifecycle method name
   * @param args - Optional: Any arguments to be supplied to the plugin methods
   * @internal
   */
  public dispatch<TMethod extends PluginMethodName>(
    method: TMethod,
    ...args: Parameters<PluginMethodFn<TMethod>>
  ): void {
    const plugins = this.filterByMethod(method)
    debug('dispatch', method, {
      all: this._plugins.length,
      filteredByMethod: plugins.length
    })
    for (const plugin of plugins) {
      try {
        args = this._addPuppeteerCompatIfNeeded.bind(this)(plugin, method, args)
        const fnType = plugin[method]?.constructor?.name
        debug('dispatch to plugin', {
          plugin: plugin.name,
          method,
          fnType
        })
        if (fnType === 'AsyncFunction') {
          ;(plugin[method] as any)(...args).catch((err: any) =>
            this.onPluginError(plugin, method, err)
          )
        } else {
          ;(plugin[method] as any)(...args)
        }
      } catch (err) {
        this.onPluginError(plugin, method, err as any)
      }
    }
  }

  /**
   * Dispatch plugin lifecycle events in a typesafe way.
   * Only Plugins that expose the supplied property will be called.
   *
   * Can also be used to get a definite return value after passing it to plugins:
   * Calls plugins sequentially and passes on a value (waterfall style).
   *
   * The plugins can either modify the value or return an updated one.
   * Will return the latest, updated value which ran through all plugins.
   *
   * By convention only the first argument will be used as the updated value.
   *
   * @param method - The lifecycle method name
   * @param args - Optional: Any arguments to be supplied to the plugin methods
   * @internal
   */
  public async dispatchBlocking<TMethod extends PluginMethodName>(
    method: TMethod,
    ...args: Parameters<PluginMethodFn<TMethod>>
  ): Promise<ReturnType<PluginMethodFn<TMethod>>> {
    const plugins = this.filterByMethod(method)
    debug('dispatchBlocking', method, {
      all: this._plugins.length,
      filteredByMethod: plugins.length
    })

    let retValue: any = null
    for (const plugin of plugins) {
      try {
        args = this._addPuppeteerCompatIfNeeded.bind(this)(plugin, method, args)
        retValue = await (plugin[method] as any)(...args)
        // In case we got a return value use that as new first argument for followup function calls
        if (retValue !== undefined) {
          args[0] = retValue
        }
      } catch (err) {
        this.onPluginError(plugin, method, err as any)
        return retValue
      }
    }
    return retValue
  }

  /**
   * Order plugins that have expressed a special placement requirement.
   *
   * This is useful/necessary for e.g. plugins that depend on the data from other plugins.
   *
   * @private
   */
  protected order() {
    debug('order:before', this.names)
    const runLast = this._plugins
      .filter(p => p.requirements?.has('runLast'))
      .map(p => p.name)
    for (const name of runLast) {
      const index = this._plugins.findIndex(p => p.name === name)
      this._plugins.push(this._plugins.splice(index, 1)[0])
    }
    debug('order:after', this.names)
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
   * @param name - Filter data by optional name
   *
   * @private
   */
  protected getData(name?: string) {
    const data = this._plugins
      .filter((p: any) => !!p.data)
      .map((p: any) => (Array.isArray(p.data) ? p.data : [p.data]))
      .reduce((acc, arr) => [...acc, ...arr], [])
    return name ? data.filter((d: any) => d.name === name) : data
  }

  /**
   * Handle `plugins` stanza (already instantiated plugins that don't require dynamic imports)
   */
  protected resolvePluginsStanza() {
    debug('resolvePluginsStanza')
    const pluginNames = new Set(this.names)
    this._plugins
      .filter(p => !!p.plugins && p.plugins.length)
      .filter(p => !pluginNames.has(p.name)) // TBD: Do we want to filter out existing?
      .forEach(parent => {
        ;(parent.plugins || []).forEach(p => {
          debug(parent.name, 'adding missing plugin', p.name)
          this.add(p as Plugin)
        })
      })
  }

  /**
   * Handle `dependencies` stanza (which requires dynamic imports)
   *
   * Plugins can define `dependencies` as a Set or Array of dependency paths, or a Map with additional opts
   *
   * @note
   * - The default opts for implicit dependencies can be defined using `setDependencyDefaults()`
   * - Dynamic imports can be avoided by providing plugin modules with `setDependencyResolution()`
   */
  protected resolveDependenciesStanza() {
    debug('resolveDependenciesStanza')

    /** Attempt to dynamically require a plugin module */
    const requireDependencyOrDie = (
      parentName: string,
      dependencyPath: string
    ) => {
      // If the user provided the plugin module already we use that
      if (this._dependencyResolution.has(dependencyPath)) {
        return this._dependencyResolution.get(dependencyPath) as PluginModule
      }

      const possiblePrefixes = ['puppeteer-extra-plugin-'] // could be extended later
      const isAlreadyPrefixed = possiblePrefixes.some(prefix =>
        dependencyPath.startsWith(prefix)
      )
      const packagePaths: string[] = []
      // If the dependency is not already prefixed we attempt to require all possible combinations to find one that works
      if (!isAlreadyPrefixed) {
        packagePaths.push(
          ...possiblePrefixes.map(prefix => prefix + dependencyPath)
        )
      }
      // We always attempt to require the path verbatim (as a last resort)
      packagePaths.push(dependencyPath)
      const pluginModule = requirePackages<PluginModule>(packagePaths)
      if (pluginModule) {
        return pluginModule
      }

      const explanation = `
The plugin '${parentName}' listed '${dependencyPath}' as dependency,
which could not be found. Please install it:

${packagePaths
  .map(packagePath => `yarn add ${packagePath.split('/')[0]}`)
  .join(`\n or:\n`)}

Note: You don't need to require the plugin yourself,
unless you want to modify it's default settings.

If your bundler has issues with dynamic imports take a look at '.plugins.setDependencyResolution()'.
      `
      console.warn(explanation)
      throw new Error('Plugin dependency not found')
    }

    const existingPluginNames = new Set(this.names)
    const recursivelyLoadMissingDependencies = ({
      name: parentName,
      dependencies
    }: Plugin): any => {
      if (!dependencies) {
        return
      }
      const processDependency = (dependencyPath: string, opts?: any) => {
        const pluginModule = requireDependencyOrDie(parentName, dependencyPath)
        opts = opts || this._dependencyDefaults.get(dependencyPath) || {}
        const plugin = pluginModule(opts)
        if (existingPluginNames.has(plugin.name)) {
          debug(parentName, '=> dependency already exists:', plugin.name)
          return
        }
        existingPluginNames.add(plugin.name)
        debug(parentName, '=> adding new dependency:', plugin.name, opts)
        this.add(plugin)
        return recursivelyLoadMissingDependencies(plugin)
      }

      if (dependencies instanceof Set || Array.isArray(dependencies)) {
        return [...dependencies].forEach(dependencyPath =>
          processDependency(dependencyPath)
        )
      }
      if (dependencies instanceof Map) {
        // Note: `k,v => v,k` (Map + forEach will reverse the order)
        return dependencies.forEach((v, k) => processDependency(k, v))
      }
    }
    this.list.forEach(recursivelyLoadMissingDependencies)
  }

  /**
   * Lightweight plugin dependency management to require plugins and code mods on demand.
   * @private
   */
  protected resolveDependencies() {
    debug('resolveDependencies')
    this.resolvePluginsStanza()
    this.resolveDependenciesStanza()
  }
}
