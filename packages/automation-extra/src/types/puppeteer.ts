// Note: @types/puppeteer-core is unfortunately outdated,
// so we rely on @types/puppeteer instead.
// A wildcard import would result in a `require("puppeteer")` statement
// at the top of the transpiled js file, not what we want. :-/

export type { Browser } from 'puppeteer'
export type { Page } from 'puppeteer'
export type { Target } from 'puppeteer'
export type { ConnectOptions } from 'puppeteer'
export type { ChromeArgOptions } from 'puppeteer'
export type { LaunchOptions } from 'puppeteer'
export type { FetcherOptions } from 'puppeteer'
export type { BrowserFetcher } from 'puppeteer'

/**
 * We need to hook into non-public APIs in rare occasions to fix puppeteer bugs. :(
 * @private
 */

import type { Browser, Page } from 'puppeteer'

export interface BrowserWithInternals extends Browser {
  _createPageInContext(contextId?: string): Promise<Page>
}
