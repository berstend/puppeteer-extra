import { LauncherEnv } from 'automation-extra-plugin'

import * as types from './types'

import Debug from 'debug'
const debug = Debug('automation-extra:plugins')

export class PluginList {
  private _plugins: types.Plugin[] = []

  constructor(private env: LauncherEnv) {}

  /**
   * Get a list of all registered plugins.
   *
   * @member {Array<types.Plugin>}
   */
  get list() {
    return this._plugins
  }

  /**
   * Get the names of all registered plugins.
   *
   * @member {Array<string>}
   * @private
   */
  get pluginNames() {
    return this._plugins.map(p => p.name)
  }

  /**
   * Add a new plugin to the list (after checking if it's well-formed).
   *
   * @param plugin
   * @private
   */
  add(plugin: any) {
    if (!plugin || !plugin.name) {
      throw new Error('A plugin must have a .name property')
    }
    const isPuppeteerExtraPlugin = plugin._isPuppeteerExtraPlugin
    const isPlaywrightDriver = this.env.driverName === 'playwright'
    if (isPuppeteerExtraPlugin && isPlaywrightDriver) {
      console.warn(
        `Warning: Plugin "${plugin.name}" is derived from PuppeteerExtraPlugin and will most likely not work with playwright.`
      )
    }

    // Give the plugin access to the env info
    plugin.env = this.env

    if ('onPluginRegistered' in plugin) {
      plugin.onPluginRegistered()
    }

    this._plugins.push(plugin)
  }

  /**
   * Dispatch plugin lifecycle events in a typesafe way.
   * Only Plugins that expose the supplied property will be called.
   *
   * Will not await results to dispatch events as fast as possible to all plugins.
   *
   * @param name - The lifecycle method name
   * @param args - Optional: Any arguments to be supplied to the plugin methods
   */
  dispatch<TName extends types.PluginMethodNames>(
    name: TName,
    ...args: Parameters<types.PluginMethodFn<TName>>
  ): void {
    const plugins: types.AutomationExtraPlugin[] = this._plugins.filter(
      plugin => name in plugin
    ) as any

    for (const plugin of plugins) {
      try {
        ;(plugin[name] as any)(...args)
      } catch (err) {
        console.warn(
          `An error occured while executing ${name} in plugin "${plugin.name}":`,
          err
        )
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
   * @param name - The lifecycle method name
   * @param args - Optional: Any arguments to be supplied to the plugin methods
   */
  async dispatchBlocking<TName extends types.PluginMethodNames>(
    name: TName,
    ...args: Parameters<types.PluginMethodFn<TName>>
  ): Promise<ReturnType<types.PluginMethodFn<TName>>> {
    const plugins: types.AutomationExtraPlugin[] = this._plugins.filter(
      plugin => name in plugin
    ) as any

    let retValue: any = null
    for (const plugin of plugins) {
      try {
        retValue = await (plugin[name] as any)(...args)
        // In case we got a return value use that as new first argument for followup function calls
        if (retValue) {
          args[0] = retValue
        }
      } catch (err) {
        console.warn(
          `An error occured while executing ${name} in plugin "${plugin.name}":`,
          err
        )
        return retValue
      }
    }
    return retValue
  }

  dispatchLegacy<TName extends types.LegacyPluginMethodNames>(
    name: TName,
    ...args: Parameters<types.LegacyPluginMethodFn<TName>>
  ): void {
    const plugins: types.PuppeteerExtraPlugin[] = this._plugins.filter(
      plugin => name in plugin
    ) as any

    for (const plugin of plugins) {
      try {
        ;(plugin[name] as any)(...args)
        // In case we got a return value use that as new first argument for followup function calls
      } catch (err) {
        console.warn(
          `An error occured while executing ${name} in plugin "${plugin.name}":`,
          err
        )
      }
    }
  }

  /**
   * Order plugins that have expressed a special placement requirement.
   *
   * This is useful/necessary for e.g. plugins that depend on the data from other plugins.
   *
   * @private
   */
  order() {
    debug('order:before', this.pluginNames)
    const runLast = this._plugins
      .filter(p => p.requirements.has('runLast'))
      .map(p => p.name)
    for (const name of runLast) {
      const index = this._plugins.findIndex(p => p.name === name)
      this._plugins.push(this._plugins.splice(index, 1)[0])
    }
    debug('order:after', this.pluginNames)
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
  checkRequirements(launchContext: types.LaunchContext) {
    for (const plugin of this._plugins) {
      for (const requirement of plugin.requirements) {
        if (
          launchContext.context === 'launch' &&
          requirement === 'headful' &&
          launchContext.isHeadless
        ) {
          console.warn(
            `Warning: Plugin '${plugin.name}' is not supported in headless mode.`
          )
        }
        if (launchContext.context === 'connect' && requirement === 'launch') {
          console.warn(
            `Warning: Plugin '${plugin.name}' doesn't support connect().`
          )
        }
      }
    }
  }

  /**
   * Lightweight plugin dependency management to require plugins and code mods on demand.
   *
   * This uses the `dependencies` stanza (a `Set` or `Map`) exposed by `automation-extra` plugins.
   *
   * @private
   */
  resolveDependencies() {
    const pluginNames = new Set(this._plugins.map((p: any) => p.name))

    const allDeps: Map<string, any> = new Map()
    this._plugins
      // Skip plugins without dependencies
      .filter(p => 'dependencies' in p && p.dependencies.size)
      .map(p => p.dependencies)
      .forEach(deps => {
        if (deps instanceof Set) {
          deps.forEach(k => allDeps.set(k, {}))
        }
        if (deps instanceof Map) {
          deps.forEach((v, k) => {
            allDeps.set(k, v) // Note: k,v => v,k
          })
        }
      })

    const missingDeps = new Map(
      [...allDeps].filter(([k]) => !pluginNames.has(k))
    )

    if (!missingDeps.size) {
      debug('no dependencies are missing')
      return
    }
    debug('dependencies missing', missingDeps)
    // Loop through all dependencies declared missing by plugins
    for (const [name, opts] of [...missingDeps]) {
      // Check if the dependency hasn't been registered as plugin already.
      // This might happen when multiple plugins have nested dependencies.
      if (this.pluginNames.includes(name)) {
        debug(`ignoring dependency '${name}', which has been required already.`)
        continue
      }

      const hasFullName =
        name.startsWith('puppeteer-extra-plugin') ||
        name.startsWith('automation-extra-plugin')

      // We follow a plugin naming convention, but let's rather enforce it <3
      const requireNames = hasFullName
        ? [name]
        : [`automation-extra-plugin-${name}`, `puppeteer-extra-plugin-${name}`]

      const pkg = requirePackages(requireNames)
      if (!pkg) {
        throw new Error(`
          A plugin listed '${name}' as dependency,
          which is currently missing. Please install it:

${requireNames
  .map(name => {
    return `yarn add ${name.split('/')[0]}`
  })
  .join(`\n or:\n`)}

          Note: You don't need to require the plugin yourself,
          unless you want to modify it's default settings.
          `)
      }
      const plugin: types.Plugin = pkg(opts)
      this.add(plugin)

      // Handle nested dependencies :D
      if (plugin.dependencies && plugin.dependencies.size) {
        this.resolveDependencies()
      }
    }
  }
}

function requirePackages(packages: string[]) {
  for (const name of packages) {
    try {
      return require(name)
    } catch (_) {
      continue // noop
    }
  }
  return false
}
