import * as types from './types'
import * as pptr from './types/puppeteer'

import { AutomationExtraBase } from './base'

export class PuppeteerExtra extends AutomationExtraBase
  implements types.PuppeteerBrowserLauncher {
  public vanillaLauncher = this.launcher as types.PuppeteerBrowserLauncher

  constructor(_launcher?: types.PuppeteerBrowserLauncher) {
    super('puppeteer', _launcher)
  }

  // Stuff we augment for plugin purposes
  connect(options?: pptr.ConnectOptions): Promise<pptr.Browser> {
    return this._connect(options) as Promise<pptr.Browser>
  }
  launch(options?: pptr.LaunchOptions): Promise<pptr.Browser> {
    return this._launch(options) as Promise<pptr.Browser>
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
