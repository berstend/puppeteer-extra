// A wildcard import would result in a `require("puppeteer")` statement
// at the top of the transpiled js file, not what we want. :-/

export { Browser } from 'puppeteer-core'
export { Page } from 'puppeteer-core'
export { ConnectOptions } from 'puppeteer-core'
export { ChromeArgOptions } from 'puppeteer-core'
export { LaunchOptions } from 'puppeteer-core'
export { FetcherOptions } from 'puppeteer-core'
export { BrowserFetcher } from 'puppeteer-core'
