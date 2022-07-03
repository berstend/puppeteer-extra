// Playwright objects extended with puppeteer compatiblity shims

import type {} from 'playwright-core'

import type { PuppeteerPageShim, PuppeteerBrowserShim } from '.'

declare module 'playwright-core' {
  interface Page extends PuppeteerPageShim {}
  interface Frame extends PuppeteerPageShim {}
  interface Browser extends PuppeteerBrowserShim {}
}
