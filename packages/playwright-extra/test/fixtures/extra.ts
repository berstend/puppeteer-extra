// Playwrights test runner is great, originally based on folio (which unfortunately isn't maintained anymore): https://github.com/microsoft/folio
import { test as base } from '@playwright/test'
import * as pwTest from '@playwright/test'

import * as pwExtraModule from '../../src'
import * as pwVanillaModule from 'playwright-core'

type PluginModuleWithOptions = { module: any; opts?: Record<string, any> }

export type ExtraOptions = {}

export type ExtraFixtures = {
  /** playwright-extra module */
  playwrightExtra: typeof pwExtraModule
  /** playwright-core module */
  playwrightVanilla: typeof pwVanillaModule
  /** Augmented launcher */
  extraLauncher: pwExtraModule.AugmentedBrowserLauncher
}

type WorkerFixtures = {
  _connectedBrowser: pwTest.Browser | undefined
  _browserOptions: pwTest.LaunchOptions
  _artifactsDir: () => string
  _snapshotSuffix: string

  plugins: PluginModuleWithOptions[]
}

export const worker = base.extend<{}, WorkerFixtures>({
  plugins: [[], { option: true, scope: 'worker' as any }],

  browser: async (
    { playwright, browserName, _connectedBrowser, plugins },
    use
  ) => {
    if (_connectedBrowser) {
      await use(_connectedBrowser)
      return
    }

    if (!['chromium', 'firefox', 'webkit'].includes(browserName))
      throw new Error(
        `Unexpected browserName "${browserName}", must be one of "chromium", "firefox" or "webkit"`
      )
    const launcher = pwExtraModule.addExtra(playwright[browserName])

    plugins.forEach(({ module: pluginModule, opts }) => {
      launcher.use(pluginModule(opts))
    })

    const browser = await launcher.launch()
    ;(browser as any)._launcher = launcher
    await use(browser as any)
    await browser.close()
  }
})

// Extend base test by providing "todoPage" and "settingsPage".
// This new "test" can be used in multiple test files, and each of them will get the fixtures.
export const test = worker.extend<ExtraOptions & ExtraFixtures>({
  extraLauncher: async (
    { plugins, playwrightExtra, playwrightVanilla, browserName },
    use
  ) => {
    const launcher = playwrightExtra.addExtra(playwrightVanilla[browserName])
    plugins.forEach(({ module: pluginModule, opts }) => {
      launcher.use(pluginModule(opts))
    })
    await use(launcher)
  },
  playwrightExtra: async ({}, use) => {
    await use(pwExtraModule)
  },
  playwrightVanilla: async ({}, use) => {
    await use(pwVanillaModule)
  }
})

export { expect } from '@playwright/test'
