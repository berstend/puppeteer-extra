// A wildcard import would result in a `require("puppeteer")` statement
// at the top of the transpiled js file, not what we want. :-/

import { LaunchOptions } from 'puppeteer'
import { BrowserLaunchArgumentOptions } from 'puppeteer'
import { BrowserConnectOptions } from 'puppeteer'

export { Browser } from 'puppeteer'
export { Page } from 'puppeteer'
export { ConnectOptions } from 'puppeteer'
export { LaunchOptions } from 'puppeteer'
export { BrowserFetcher } from 'puppeteer'

// BrowserOptions renamed to BrowserConnectOptions in pptr 8.0.0
export { BrowserConnectOptions } from 'puppeteer'

// ChromeArgOptions renamed to BrowserLaunchArgumentOptions in pptr 8.0.0
export { BrowserLaunchArgumentOptions } from 'puppeteer'

// FetcherOptions renamed to BrowserFetcherOptions in pptr 8.0.0
export { BrowserFetcherOptions } from 'puppeteer'

export type AllLaunchOptions = LaunchOptions & BrowserLaunchArgumentOptions & BrowserConnectOptions;