import * as types from './types'
import * as pw from './types/playwright'

import { AutomationExtraBase } from './base'

export class PlaywrightExtra extends AutomationExtraBase
  implements types.PlaywrightBrowserLauncher {
  public vanillaLauncher = this.launcher as types.PlaywrightBrowserLauncher

  constructor(_launcher?: types.PlaywrightBrowserLauncher) {
    super('playwright', _launcher)
  }

  // Stuff we augment for plugin purposes
  connect(options: pw.BrowserTypeConnectOptions): Promise<pw.Browser> {
    return this._connect(options) as Promise<pw.Browser>
  }
  launch(options?: pw.LaunchOptions): Promise<pw.Browser> {
    return this._launch(options) as Promise<pw.Browser>
  }

  // FIXME: Augment this
  launchPersistentContext(
    userDataDir: string,
    options?: any // Not exported
  ): Promise<pw.BrowserContext> {
    console.warn(
      'Note: launchPersistentContext does not trigger plugins currently.'
    )
    return this.vanillaLauncher.launchPersistentContext(userDataDir, options)
  }
  launchServer(
    options?: any // Not exported
  ): Promise<pw.BrowserServer> {
    return this.vanillaLauncher.launchServer(options)
  }

  // Playwright specific things we just pipe through
  executablePath(): string {
    return this.vanillaLauncher.executablePath()
  }
  name(): string {
    return this.vanillaLauncher.name()
  }
}
