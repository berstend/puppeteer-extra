// A wildcard import would result in a `require("playwright-core")` statement
// at the top of the transpiled js file, not what we want. :-/

// We like playwright very much as it's written in Typescript
export type { Browser } from 'playwright-core'
export type { BrowserServer } from 'playwright-core'
export type { Page } from 'playwright-core'
export type { BrowserContextOptions } from 'playwright-core'
export type { LaunchOptions } from 'playwright-core'
export type { BrowserContext } from 'playwright-core'
export type { BrowserType } from 'playwright-core'
export type { ChromiumBrowser } from 'playwright-core'
export type { WebKitBrowser } from 'playwright-core'
export type { FirefoxBrowser } from 'playwright-core'

// Stuff that is unfortunately not exported
import type { Browser, BrowserType } from 'playwright-core'

// Get type of first parameter to connect
export type BrowserTypeConnectOptions = Parameters<
  BrowserType<Browser>['connect']
>[0]
