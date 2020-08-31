// Note: @types/puppeteer-core is unfortunately outdated,
// so we rely on @types/puppeteer instead.
// A wildcard import would result in a `require("puppeteer")` statement
// at the top of the transpiled js file, not what we want. :-/

export { Browser } from 'puppeteer'
export { Page } from 'puppeteer'
export { Target } from 'puppeteer'
export { ConnectOptions } from 'puppeteer'
export { ChromeArgOptions } from 'puppeteer'
export { LaunchOptions } from 'puppeteer'
export { FetcherOptions } from 'puppeteer'
export { BrowserFetcher } from 'puppeteer'

/**
 * We need to hook into non-public APIs in rare occasions to fix puppeteer bugs. :(
 * @private
 */

import { Browser, Page } from 'puppeteer'

export interface BrowserWithInternals extends Browser {
  _createPageInContext(contextId?: string): Promise<Page>
}
