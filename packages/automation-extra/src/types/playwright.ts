// A wildcard import would result in a `require("playwright-core")` statement
// at the top of the transpiled js file, not what we want. :-/

// We like playwright very much as it's written in Typescript
export { Browser } from 'playwright-core'
export { BrowserServer } from 'playwright-core'
export { Page } from 'playwright-core'
export { BrowserContextOptions } from 'playwright-core'
export { LaunchOptions } from 'playwright-core'
export { BrowserContext } from 'playwright-core'
export { BrowserType } from 'playwright-core'
export { ChromiumBrowser } from 'playwright-core'
export { WebKitBrowser } from 'playwright-core'
export { FirefoxBrowser } from 'playwright-core'

// Stuff that is unfortunately not exported
import { Browser, BrowserType } from 'playwright-core'

// Get type of first parameter to connect
export type BrowserTypeConnectOptions = Parameters<
  BrowserType<Browser>['connect']
>[0]
