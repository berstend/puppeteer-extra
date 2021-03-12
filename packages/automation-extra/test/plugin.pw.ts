import test from 'ava'

import { addExtraPlaywright } from '../src/index'

import * as playwright from 'playwright'
import * as Playwright from 'playwright-core'

import {
  AutomationExtraPlugin,
  Browser,
  LaunchContext,
  LaunchOptions,
  Page
} from 'automation-extra-plugin'

test('will be able to modify launch options', async t => {
  let FINAL_OPTIONS = null

  class Plugin extends AutomationExtraPlugin {
    static id = 'foobar'
    constructor(opts = {}) {
      super(opts)
    }

    async beforeLaunch(options: LaunchOptions) {
      if (!options.args) {
        options.args = []
      }
      options.args.push('--foobar=true')
      options.timeout = 60 * 1000
      options.headless = true

      return options
    }
    async afterLaunch(browser: Browser, launchContext: LaunchContext) {
      FINAL_OPTIONS = launchContext.options
    }
  }
  const instance = new Plugin()

  const chromium = addExtraPlaywright(playwright.chromium)
  chromium.use(instance)
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  t.deepEqual(FINAL_OPTIONS, {
    args: ['--foobar=true'],
    headless: true,
    timeout: 60000
  })

  await page.goto('about:blank')
  await browser.close()
})

test('will set env correctly', async t => {
  let result = {} as any

  class Plugin extends AutomationExtraPlugin {
    static id = 'foobar'
    constructor(opts = {}) {
      super(opts)
    }

    async onPageCreated(page: Page) {
      result = { ...this.env }
    }
  }
  const instance = new Plugin()

  const chromium = addExtraPlaywright(playwright.chromium)
  chromium.use(instance)
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  t.is(result.browserName, 'chromium')
  t.is(result.driverName, 'playwright')

  await page.goto('about:blank')
  await browser.close()
})

test('will overwrite user-agent correctly', async t => {
  class Plugin extends AutomationExtraPlugin {
    static id = 'foobar'
    constructor(opts = {}) {
      super(opts)
    }

    async beforeContext(options: Playwright.BrowserContextOptions) {
      options.userAgent = 'foobar/1.0'
      return options
    }
  }
  const instance = new Plugin()

  const chromium = addExtraPlaywright(playwright.chromium)
  chromium.use(instance)
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('about:blank')

  const result = await page.evaluate(() => navigator.userAgent)

  t.is(result, 'foobar/1.0')

  await browser.close()
})
