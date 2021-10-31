// A wildcard import would result in a `require("puppeteer")` statement
// at the top of the transpiled js file, not what we want. :-/
// "import type" is a solution here but requires TS >= v3.8 which we don't want to require yet as a minimum.

export { Browser } from 'puppeteer'
export { Page } from 'puppeteer'
export { Target } from 'puppeteer'
export { ConnectOptions } from 'puppeteer'
export { LaunchOptions } from 'puppeteer'
