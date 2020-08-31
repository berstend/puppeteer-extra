import * as types from './types'
import * as pw from './types/playwright'
import * as pptr from './types/puppeteer'

import { LauncherEnv } from 'automation-extra-plugin'
import { PluginList } from './plugins'

import Debug from 'debug'
const debug = Debug('automation-extra')

export class AutomationExtraBase {
  public env: LauncherEnv
  public plugins: PluginList

  public productName?: types.PlaywrightBrowsers

  constructor(
    driverName: types.SupportedDrivers,
    public _launcher?: types.BrowserLauncher
  ) {
    this.env = new LauncherEnv(driverName)
    this.plugins = new PluginList(this.env)
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
  get launcher(): types.BrowserLauncher {
    if (!this._launcher) {
      const launcher = this._requireLauncherOrThrow()
      // In case we're running with Playwright we need to add the product name to the import
      this._launcher = this.productName ? launcher[this.productName] : launcher
    }
    return this._launcher as types.BrowserLauncher
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
  use(plugin: types.Plugin): this {
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('A plugin must be provided to .use()')
    }

    this.plugins.add(plugin)
    debug('Plugin registered', plugin.name)

    return this
  }

  async _connect(options: types.ConnectOptions = {}): Promise<types.Browser> {
    return this._launchOrConnect('connect', options)
  }

  async _launch(options: types.LaunchOptions = {}): Promise<types.Browser> {
    return this._launchOrConnect('launch', options)
  }

  async _launchOrConnect(
    method: 'launch' | 'connect',
    options: types.LaunchOptions | types.ConnectOptions = {}
  ): Promise<types.Browser> {
    debug(method)

    this.plugins.order()
    this.plugins.resolveDependencies()

    const beforeEvent = method === 'launch' ? 'beforeLaunch' : 'beforeConnect'
    const afterEvent = method === 'launch' ? 'afterLaunch' : 'afterConnect'

    // Give plugins the chance to modify the options before launch/connect
    // options = await this.plugins.getValue(beforeEvent, options)
    options =
      (await this.plugins.dispatchBlocking(beforeEvent, options)) || options
    // await this.plugins.dispatch(beforeEvent, Object.assign({}, options))

    // Only now we know the final browser
    if (this.env.isPuppeteer) {
      // Puppeteer supports defining the browser during launch
      const override =
        process.env.PUPPETEER_PRODUCT || (options as pptr.LaunchOptions).product
      this.env.browserName = override === 'firefox' ? 'firefox' : 'chromium'
    } else {
      if (this._launcher && this.env.isPlaywright) {
        const launcher = this._launcher as types.PlaywrightBrowserLauncher
        this.env.browserName = launcher.name() as types.PlaywrightBrowsers
      }
    }

    const isHeadless = (() => {
      if (types.isConnectOptions(options)) {
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
    this._patchPageCreationMethods(browser as pptr.BrowserWithInternals)

    await this.plugins.dispatchBlocking('onBrowser', browser, launchContext)

    if (this.env.isPuppeteerBrowser(browser)) {
      this._bindPuppeteerBrowserEvents(browser)
    } else {
      this._bindPlaywrightBrowserEvents(browser)
    }

    await this.plugins.dispatchBlocking(afterEvent, browser, launchContext)
    return browser
  }

  async _bindPuppeteerBrowserEvents(browser: pptr.Browser) {
    debug('_bindPuppeteerBrowserEvents')

    browser.on('disconnected', () => {
      this.plugins.dispatch('onDisconnected', browser)
      this.plugins.dispatchLegacy('onClose')
    })
    browser.on('targetcreated', async (target: pptr.Target) => {
      debug('targetcreated')
      this.plugins.dispatchLegacy('onTargetCreated', target)
      // Pre filter pages for plugin developers convenience
      if (target.type() === 'page') {
        const page = await target.page()
        page.on('close', () => {
          this.plugins.dispatch('onPageClose', page)
        })

        this.plugins.dispatch('onPageCreated', page)
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

  async _bindPlaywrightBrowserEvents(browser: pw.Browser) {
    debug('_bindPlaywrightBrowserEvents')

    browser.on('disconnected', () => {
      this.plugins.dispatch('onDisconnected', browser)
    })

    const bindContextEvents = (context: pw.BrowserContext) => {
      context.on('close', () => {
        this.plugins.dispatch('onContextClose', context)
      })
      context.on('page', page => {
        this.plugins.dispatch('onPageCreated', page)

        page.on('close', () => {
          this.plugins.dispatch('onPageClose', page)
        })
      })
    }

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

    browser.newPage = ((originalMethod, ctx) => {
      return async (options: pw.BrowserContextOptions = {}) => {
        const contextOptions: pw.BrowserContextOptions =
          (await this.plugins.dispatchBlocking(
            'beforeContext',
            options,
            browser
          )) || options
        const page = await originalMethod.call(ctx, contextOptions)
        const context = page.context()
        this.plugins.dispatch('onContextCreated', context, contextOptions)

        bindContextEvents(context)
        return page
      }
    })(browser.newPage, browser)
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
  private _patchPageCreationMethods(browser: pptr.BrowserWithInternals) {
    if (!browser || !browser._createPageInContext) {
      return
    }
    if (!this.env.isPuppeteerBrowser(browser)) {
      return
    }

    browser._createPageInContext = (function(originalMethod, context) {
      return async function() {
        const page = await originalMethod.apply(context, arguments as any)
        await page.goto('about:blank')
        return page
      }
    })(browser._createPageInContext, browser)
  }

  _requireLauncherOrThrow() {
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
