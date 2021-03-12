import type * as pptr from 'puppeteer'
import type * as types from './types'

import { AutomationExtraBase } from './base'

export class PuppeteerExtra
  extends AutomationExtraBase
  implements types.PuppeteerBrowserLauncher {
  protected readonly vanillaLauncher = this
    .launcher as types.PuppeteerBrowserLauncher

  constructor(_launcher?: types.PuppeteerBrowserLauncher) {
    super('puppeteer', _launcher)
    // Puppeteer supports defining the browser during `.launch`
    this.env.browserName = 'unknown'
  }

  // Stuff we augment for plugin purposes
  async connect(options?: pptr.ConnectOptions): Promise<pptr.Browser> {
    const result = await this._connect(options)
    return result as pptr.Browser
  }
  async launch(options?: pptr.LaunchOptions): Promise<pptr.Browser> {
    const result = await this._launch(options)
    return result as pptr.Browser
  }

  // Puppeteer specific things we just pipe through
  defaultArgs(options?: pptr.ChromeArgOptions): string[] {
    return this.vanillaLauncher.defaultArgs(options)
  }
  executablePath(): string {
    return this.vanillaLauncher.executablePath()
  }
  createBrowserFetcher(options?: pptr.FetcherOptions): pptr.BrowserFetcher {
    return this.vanillaLauncher.createBrowserFetcher(options)
  }
}
