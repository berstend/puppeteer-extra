import type * as pw from 'playwright-core'

import { PlaywrightExtra, PlaywrightExtraClass } from './extra'
import { PluginList } from './plugins'
import { playwrightLoader as loader } from './helper/loader'

export { PlaywrightExtra, PlaywrightExtraClass } from './extra'
export { PluginList } from './plugins'

/** A playwright browser launcher */
export type PlaywrightBrowserLauncher = pw.BrowserType<{}>
/** A playwright browser launcher with plugin functionality */
export type AugmentedBrowserLauncher = PlaywrightExtraClass &
  PlaywrightBrowserLauncher

/**
 * The minimum shape we expect from a playwright compatible launcher object.
 * We intentionally keep this not strict so other custom or compatible launchers can be used.
 */
export interface PlaywrightCompatibleLauncher {
  connect(...args: any[]): Promise<any>
  launch(...args: any[]): Promise<any>
}

/** Our custom module exports */
interface ExtraModuleExports {
  PlaywrightExtra: typeof PlaywrightExtra
  PlaywrightExtraClass: typeof PlaywrightExtraClass
  PluginList: typeof PluginList
  addExtra: typeof addExtra
  chromium: AugmentedBrowserLauncher
  firefox: AugmentedBrowserLauncher
  webkit: AugmentedBrowserLauncher
}

/** Vanilla playwright module exports */
type PlaywrightModuleExports = typeof pw

/**
 * Augment the provided Playwright browser launcher with plugin functionality.
 *
 * Using `addExtra` will always create a fresh PlaywrightExtra instance.
 *
 * @example
 * import playwright from 'playwright'
 * import { addExtra } from 'playwright-extra'
 *
 * const chromium = addExtra(playwright.chromium)
 * chromium.use(plugin)
 *
 * @param launcher - Playwright (or compatible) browser launcher
 */
export const addExtra = <Launcher extends PlaywrightCompatibleLauncher>(
  launcher?: Launcher
) => new PlaywrightExtra(launcher) as PlaywrightExtraClass & Launcher

/**
 * This object can be used to launch or connect to Chromium with plugin functionality.
 *
 * This default export will behave exactly the same as the regular playwright
 * (just with extra plugin functionality) and can be used as a drop-in replacement.
 *
 * Behind the scenes it will try to require either the `playwright-core`
 * or `playwright` module from the installed dependencies.
 *
 * @note
 * Due to Node.js import caching this will result in a single
 * PlaywrightExtra instance, even when used in different files. If you need multiple
 * instances with different plugins please use `addExtra`.
 *
 * @example
 * // javascript import
 * const { chromium } = require('playwright-extra')
 *
 * // typescript/es6 module import
 * import { chromium } from 'playwright-extra'
 *
 * // Add plugins
 * chromium.use(...)
 */
export const chromium = addExtra((loader.loadModule() || {}).chromium)
/**
 * This object can be used to launch or connect to Firefox with plugin functionality
 * @note This export will always return the same instance, if you wish to use multiple instances with different plugins use `addExtra`
 */
export const firefox = addExtra((loader.loadModule() || {}).firefox)
/**
 * This object can be used to launch or connect to Webkit with plugin functionality
 * @note This export will always return the same instance, if you wish to use multiple instances with different plugins use `addExtra`
 */
export const webkit = addExtra((loader.loadModule() || {}).webkit)

// Other playwright module exports we simply re-export with lazy loading
export const _android = loader.lazyloadExportOrDie('_android')
export const _electron = loader.lazyloadExportOrDie('_electron')
export const request = loader.lazyloadExportOrDie('request')
export const selectors = loader.lazyloadExportOrDie('selectors')
export const devices = loader.lazyloadExportOrDie('devices')
export const errors = loader.lazyloadExportOrDie('errors')

/** Playwright with plugin functionality */
const moduleExports: ExtraModuleExports & PlaywrightModuleExports = {
  // custom exports
  PlaywrightExtra,
  PlaywrightExtraClass,
  PluginList,
  addExtra,
  chromium,
  firefox,
  webkit,

  // vanilla exports
  _android,
  _electron,
  request,
  selectors,
  devices,
  errors
}

export default moduleExports
