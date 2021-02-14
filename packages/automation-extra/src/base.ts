import type * as pw from 'playwright-core'
import type * as pptr from 'puppeteer'
import type * as types from './types'

import { LauncherEnv } from 'automation-extra-plugin'
import { PluginList } from './plugins'

import Debug from 'debug'
const debug = Debug('automation-extra')

export class AutomationExtraBase {
  /** Information about the launcher environment */
  public readonly env: LauncherEnv
  /** List of plugins */
  public readonly plugins: PluginList

  constructor(
    driverName: types.SupportedDrivers,
    protected _launcher?: types.BrowserLauncher
  ) {
    this.env = new LauncherEnv(driverName)
    this.plugins = new PluginList(this.env)
  }

  /**
   * The **main interface** to register plugins.
   *
   * @example
   * puppeteer.use(plugin1).use(plugin2)
   * // or
   * chromium.use(plugin1).use(plugin2)
   * firefox.use(plugin1).use(plugin2)
   *
   * @see [AutomationExtraPlugin]
   *
   * @return The same `PuppeteerExtra` or `PlaywrightExtra` instance (for optional chaining)
   */
  public use(plugin: types.Plugin): this {
    const isValid = plugin && 'name' in plugin
    if (!isValid) {
      throw new Error('A plugin must be provided to .use()')
    }

    this.plugins.add(plugin)
    debug('Plugin registered', plugin.name) /* tslint:disable-line */

    return this
  }

  /**
   * In order to support a default export which will require vanilla puppeteer or playwright automatically,
   * as well as named exports to patch the provided launcher, we need to so some gymnastics here unfortunately.
   *
   * If we just do e.g. `require('puppeteer')` in our default export this would throw immediately,
   * even when only using the `addExtra` export in combination with `puppeteer-core`. :-/
   *
   * The solution is to make the vanilla launcher optional and only throw once we try to effectively use and can't find it.
   */
  protected get launcher(): types.BrowserLauncher {
    if (!this._launcher) {
      this._launcher = this._requireLauncherOrThrow()
      // In case we're dealing with Playwright we need to add the product name to the import
      if (this.env.isPlaywright) {
        this._launcher = (this._launcher as any)[this.env.browserName]
      }
    }
    return this._launcher as types.BrowserLauncher
  }

  /** @internal */
  protected async _connect(
    options: types.ConnectOptions = {}
  ): Promise<types.Browser> {
    return await this._launchOrConnect('connect', options)
  }

  /** @internal */
  protected async _launch(
    options: types.LaunchOptions = {}
  ): Promise<types.Browser> {
    return await this._launchOrConnect('launch', options)
  }

  /** @internal */
  protected async _launchOrConnect(
    method: 'launch' | 'connect',
    options: types.LaunchOptions | types.ConnectOptions = {}
  ): Promise<types.Browser> {
    debug(method)

    this.plugins.order()
    this.plugins.resolveDependencies()

    const beforeEvent = method === 'launch' ? 'beforeLaunch' : 'beforeConnect'
    const afterEvent = method === 'launch' ? 'afterLaunch' : 'afterConnect'

    // Only now we know the final browser with puppeteer
    if (this.env.isPuppeteer) {
      this.env.browserName = getPuppeteerProduct(options)
    }

    // Make it possible for plugins to use `options.args` without checking
    if (!isConnectOptions(options)) {
      if (typeof options.args === 'undefined') {
        options.args = []
      }
    }

    // Give plugins the chance to modify the options before launch/connect
    options =
      (await this.plugins.dispatchBlocking(beforeEvent, options)) || options

    // One of the plugins might have changed the browser product
    if (this.env.isPuppeteer) {
      this.env.browserName = getPuppeteerProduct(options)
    }

    const isHeadless = (() => {
      if (isConnectOptions(options)) {
        return false // we don't know :-)
      }
      if ('headless' in options) {
        return options.headless === true
      }
      return true // default
    })()

    const launchContext: types.LaunchContext = {
      context: method,
      isHeadless,
      options
    }

    // Let's check requirements after plugin had the chance to modify the options
    this.plugins.checkRequirements(launchContext)

    const browser = await this.launcher[method](options as any)

    if (this.env.isPuppeteerBrowser(browser)) {
      this._patchPageCreationMethods(browser)
    }

    await this.plugins.dispatchBlocking('onBrowser', browser, launchContext)

    if (this.env.isPuppeteerBrowser(browser)) {
      await this._bindPuppeteerBrowserEvents(browser)
    } else {
      await this._bindPlaywrightBrowserEvents(browser)
    }

    await this.plugins.dispatchBlocking(afterEvent, browser, launchContext)
    return browser
  }

  protected async _bindPuppeteerBrowserEvents(browser: pptr.Browser) {
    debug('_bindPuppeteerBrowserEvents')

    browser.on('disconnected', () => {
      this.plugins.dispatch('onDisconnected', browser)
      this.plugins.dispatchLegacy('onClose')
    })
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    browser.on('targetcreated', async (target: pptr.Target) => {
      debug('targetcreated')
      this.plugins.dispatchLegacy('onTargetCreated', target)
      // Pre filter pages for plugin developers convenience
      if (target.type() === 'page') {
        const page = await target.page()
        page.on('close', () => {
          this.plugins.dispatch('onPageClose', page)
        })
        page.on('workercreated', worker => {
          // handle dedicated webworkers
          this.plugins.dispatch('onWorkerCreated', worker)
        })
        this.plugins.dispatch('onPageCreated', page)
      }
      if (
        target.type() === 'service_worker' ||
        target.type() === 'shared_worker'
      ) {
        // handle service + shared workers
        const worker = await target.worker()
        if (worker) {
          this.plugins.dispatch('onWorkerCreated', worker)
        }
      }
    })
    // // Legacy events
    browser.on('targetchanged', (target: pptr.Target) => {
      this.plugins.dispatchLegacy('onTargetChanged', target)
    })
    browser.on('targetdestroyed', (target: pptr.Target) => {
      this.plugins.dispatchLegacy('onTargetDestroyed', target)
    })
  }

  protected async _bindPlaywrightBrowserEvents(browser: pw.Browser) {
    debug('_bindPlaywrightBrowserEvents')

    browser.on('disconnected', () => {
      this.plugins.dispatch('onDisconnected', browser)
    })

    const bindContextEvents = (context: pw.BrowserContext) => {
      // Make sure things like `addInitScript` show an effect on the very first page as well
      context.newPage = ((originalMethod, ctx) => {
        return async () => {
          const page = await originalMethod.call(ctx)
          await page.goto('about:blank')
          return page
        }
      })(context.newPage, context)

      context.on('close', () => {
        this.plugins.dispatch('onContextClose', context)
      })
      context.on('page', page => {
        this.plugins.dispatch('onPageCreated', page)

        page.on('close', () => {
          this.plugins.dispatch('onPageClose', page)
        })

        page.on('worker', worker => {
          // handle dedicated webworkers
          this.plugins.dispatch('onWorkerCreated', worker)
        })

        if (this.env.isChromium) {
          ;(context as pw.ChromiumBrowserContext).on(
            'serviceworker',
            worker => {
              // handle service worker
              this.plugins.dispatch('onWorkerCreated', worker)
            }
          )
        }
      })
    }

    // Note: `browser.newPage` will implicitly call `browser.newContext` as well
    browser.newContext = ((originalMethod, ctx) => {
      return async (options: pw.BrowserContextOptions = {}) => {
        const contextOptions: pw.BrowserContextOptions =
          (await this.plugins.dispatchBlocking(
            'beforeContext',
            options || {},
            browser
          )) || options
        const context = await originalMethod.call(ctx, contextOptions)
        this.plugins.dispatch('onContextCreated', context, contextOptions)

        bindContextEvents(context)
        return context
      }
    })(browser.newContext, browser)
  }

  /**
   * Puppeteer: Patch page creation methods (both regular and incognito contexts).
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
  private _patchPageCreationMethods(browser: pptr.Browser) {
    if (!browser || !browser._createPageInContext) {
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

  protected _requireLauncherOrThrow() {
    const driverName = this.env.driverName
    const packages = [driverName + '-core', driverName]
    const launcher = requirePackages(packages)
    if (launcher) {
      return launcher
    }

    const driverNamePretty =
      driverName.charAt(0).toUpperCase() + driverName.slice(1)
    throw new Error(`

  ${driverNamePretty} is missing. :-)

  I tried requiring ${packages.join(', ')} - no luck.

  Make sure you install one of those packages or use the named 'addExtra' export,
  to patch a specific (and maybe non-standard) implementation of ${driverNamePretty}.

  To get the latest stable version of ${driverNamePretty} run:
  'yarn add ${driverName}' or 'npm i ${driverName}'
  `)
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

/** Type guard: check if current options are connect options */
function isConnectOptions(
  options: types.ConnectOptions | types.LaunchOptions
): options is types.ConnectOptions {
  const yup =
    'browserURL' in (options as pptr.ConnectOptions) ||
    'browserWSEndpoint' in (options as pptr.ConnectOptions) ||
    'wsEndpoint' in (options as pw.ConnectOptions)
  return yup
}

function getPuppeteerProduct(
  options: pptr.LaunchOptions
): 'firefox' | 'chromium' {
  // Puppeteer supports defining the browser during launch or through an environment variable
  const override = process.env.PUPPETEER_PRODUCT ?? (options || {}).product
  return override === 'firefox' ? 'firefox' : 'chromium'
}
