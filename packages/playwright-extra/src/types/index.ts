import type * as pw from 'playwright-core'

type PropType<TObj, TProp extends keyof TObj> = TObj[TProp]
type PluginEnv = { framework: 'playwright' }

/** Strongly typed plugin lifecycle events for internal use */
export abstract class PluginLifecycleMethods {
  async onPluginRegistered(env?: PluginEnv): Promise<void> {}
  async beforeLaunch(
    options: pw.LaunchOptions
  ): Promise<pw.LaunchOptions | void> {}
  async afterLaunch(browserOrContext?: pw.Browser | pw.BrowserContext) {}
  async beforeConnect(
    options: pw.ConnectOptions
  ): Promise<pw.ConnectOptions | void> {}
  async afterConnect(browser: pw.Browser) {}
  async onBrowser(browser: pw.Browser) {}
  async onPageCreated(page: pw.Page) {}
  async onPageClose(page: pw.Page) {}
  async onDisconnected(browser?: pw.Browser) {}
  // Playwright only at the moment
  async beforeContext(
    options?: pw.BrowserContextOptions,
    browser?: pw.Browser
  ): Promise<pw.BrowserContextOptions | void> {}
  async onContextCreated(
    context?: pw.BrowserContext,
    options?: pw.BrowserContextOptions
  ) {}
}

/** A valid plugin method name */
export type PluginMethodName = keyof PluginLifecycleMethods
/** A valid plugin method function */
export type PluginMethodFn<TName extends PluginMethodName> = PropType<
  PluginLifecycleMethods,
  TName
>

type PluginRequirements = Set<
  'launch' | 'headful' | 'dataFromPlugins' | 'runLast'
>

// PuppeteerExtraPlugin only supports Set, the others are future proofing
type PluginDependencies = Set<string> | Map<string, any> | string[]

interface PluginData {
  name:
    | string
    // below is compat with a previously incorrect typing
    | {
        [key: string]: any
      }
  value: {
    [key: string]: any
  }
}

export interface CompatiblePluginLifecycleMethods {
  onPluginRegistered(...any: any[]): Promise<any> | any
  beforeLaunch(...any: any[]): Promise<any> | any
  afterLaunch(...any: any[]): Promise<any> | any
  beforeConnect(...any: any[]): Promise<any> | any
  afterConnect(...any: any[]): Promise<any> | any
  onBrowser(...any: any[]): Promise<any> | any
  onPageCreated(...any: any[]): Promise<any> | any
  onPageClose(...any: any[]): Promise<any> | any
  onDisconnected(...any: any[]): Promise<any> | any
  // Playwright only at the moment
  beforeContext(...any: any[]): Promise<any> | any
  onContextCreated(...any: any[]): Promise<any> | any
}

/**
 * PuppeteerExtraPlugin interface, strongly typed for internal use
 * @private
 */
export interface PuppeteerExtraPlugin extends Partial<PluginLifecycleMethods> {
  _isPuppeteerExtraPlugin: boolean
  name: string
  /** Disable the puppeteer compatibility shim for this plugin */
  noPuppeteerShim?: boolean
  requirements?: PluginRequirements
  dependencies?: PluginDependencies
  data?: PluginData[]
  getDataFromPlugins?(name?: string): void
  _registerChildClassMembers?(prototype: any): void
  _childClassMembers?: string[]
  plugins?: CompatiblePlugin[]
  // [propName: string]: any
}

/**
 * Minimal compatible PuppeteerExtraPlugin interface
 * @private
 */
export interface CompatiblePuppeteerPlugin
  extends Partial<CompatiblePluginLifecycleMethods> {
  _isPuppeteerExtraPlugin: boolean
  name?: string
}
// Future proofing
export interface CompatiblePlaywrightPlugin
  extends Partial<CompatiblePluginLifecycleMethods> {
  _isPlaywrightExtraPlugin: boolean
  name?: string
}
// Future proofing
export interface CompatibleExtraPlugin
  extends Partial<CompatiblePluginLifecycleMethods> {
  _isExtraPlugin: boolean
  name?: string
}

/**
 * A compatible plugin
 */
export type CompatiblePlugin =
  | CompatiblePuppeteerPlugin
  | CompatiblePlaywrightPlugin
  | CompatibleExtraPlugin
export type CompatiblePluginModule = (...args: any[]) => CompatiblePlugin

export type Plugin = PuppeteerExtraPlugin
export type PluginModule = (...args: any[]) => Plugin
