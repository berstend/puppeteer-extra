// A wildcard import would result in a `require("playwright-core")` statement
// at the top of the transpiled js file, not what we want. :-/

export { Browser } from 'playwright-core'
export { Page } from 'playwright-core'
export { BrowserContextOptions } from 'playwright-core'
export { LaunchOptions } from 'playwright-core'
export { BrowserContext } from 'playwright-core'

// Stuff that is unfortunately not exported
import { Browser, BrowserType } from 'playwright-core'

// Get type of first parameter to connect
export type BrowserTypeConnectOptions = Parameters<
  BrowserType<Browser>['connect']
>[0]
