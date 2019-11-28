// A wildcard import would result in a `require("puppeteer")` statement
// at the top of the transpiled js file, not what we want. :-/

export { Browser } from 'puppeteer'
export { Page } from 'puppeteer'
export { ConnectOptions } from 'puppeteer'
export { ChromeArgOptions } from 'puppeteer'
export { LaunchOptions } from 'puppeteer'
export { FetcherOptions } from 'puppeteer'
export { BrowserFetcher } from 'puppeteer'
