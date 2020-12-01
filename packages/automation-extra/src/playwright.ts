import type * as pw from 'playwright-core'
import type * as types from './types'

import { AutomationExtraBase } from './base'

export class PlaywrightExtra
  extends AutomationExtraBase
  implements types.PlaywrightBrowserLauncher {
  protected readonly vanillaLauncher: types.PlaywrightBrowserLauncher

  constructor(
    _launcherOrBrowserName:
      | types.PlaywrightBrowserLauncher
      | types.PlaywrightBrowsers
  ) {
    if (typeof _launcherOrBrowserName === 'string') {
      super('playwright')
      this.env.browserName = _launcherOrBrowserName
    } else {
      super('playwright', _launcherOrBrowserName)
      this.env.browserName = _launcherOrBrowserName.name() as types.PlaywrightBrowsers
    }
    this.vanillaLauncher = this.launcher as types.PlaywrightBrowserLauncher
  }

  // Stuff we augment for plugin purposes
  async connect(options: pw.ConnectOptions): Promise<pw.Browser> {
    const result = await this._connect(options)
    return result as pw.Browser
  }
  async launch(options?: pw.LaunchOptions): Promise<pw.Browser> {
    const result = await this._launch(options)
    return result as pw.Browser
  }

  // FIXME: Augment this
  async launchPersistentContext(
    userDataDir: string,
    options?: any // Not exported
  ): Promise<pw.BrowserContext> {
    console.warn(
      'Note: launchPersistentContext does not trigger plugins currently.'
    )
    return await this.vanillaLauncher.launchPersistentContext(
      userDataDir,
      options
    )
  }
  async launchServer(
    options?: any // Not exported
  ): Promise<pw.BrowserServer> {
    return await this.vanillaLauncher.launchServer(options)
  }

  // Playwright specific things we just pipe through
  executablePath(): string {
    return this.vanillaLauncher.executablePath()
  }
  name(): string {
    return this.vanillaLauncher.name()
  }
}
