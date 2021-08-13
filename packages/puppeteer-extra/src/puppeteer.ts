// A wildcard import would result in a `require("puppeteer")` statement
// at the top of the transpiled js file, not what we want. :-/

export { Browser } from 'puppeteer'
export { Page } from 'puppeteer'
export { ConnectOptions, BrowserConnectOptions } from 'puppeteer'
export { ProductLauncher } from 'puppeteer'
export { LaunchOptions } from 'puppeteer'
export { BrowserLaunchArgumentOptions } from 'puppeteer'
export { BrowserFetcher, BrowserFetcherOptions } from 'puppeteer'
