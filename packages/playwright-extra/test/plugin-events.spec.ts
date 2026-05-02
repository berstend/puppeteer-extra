import { test, expect } from './fixtures/extra'

import { DummyPlugin } from './fixtures/dummyplugin'

test.use({ plugins: [{ module: (opts: any) => new DummyPlugin(opts) }] })

test('emits correct events for launch', async ({ extraLauncher }) => {
  const browser = await extraLauncher.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.close()
  await browser.close()

  const plugin = extraLauncher.plugins.list[0] as unknown as DummyPlugin
  expect(plugin.pluginEventList).toStrictEqual([
    'onPluginRegistered',
    'beforeLaunch',
    'onBrowser',
    'afterLaunch',
    'beforeContext',
    'onContextCreated',
    'onPageCreated',
    'onDisconnected'
  ])
})

test('emits correct events for launch without .newContext()', async ({
  extraLauncher
}) => {
  const browser = await extraLauncher.launch()
  const page = await browser.newPage()
  await page.close()
  await browser.close()

  const plugin = extraLauncher.plugins.list[0] as unknown as DummyPlugin
  expect(plugin.pluginEventList).toStrictEqual([
    'onPluginRegistered',
    'beforeLaunch',
    'onBrowser',
    'afterLaunch',
    'beforeContext',
    'onContextCreated',
    'onPageCreated',
    'onDisconnected'
  ])
})

test('emits correct events for launchPersistentContext', async ({
  extraLauncher,
  browserName
}) => {
  const context = await extraLauncher.launchPersistentContext('')
  const page = await context.newPage()
  await page.close()
  await context.close()

  const plugin = extraLauncher.plugins.list[0] as unknown as DummyPlugin
  const expectedEvents = [
    'onPluginRegistered',
    'beforeLaunch',
    'afterLaunch',
    'onContextCreated',
    'onPageCreated',
    'onDisconnected'
  ]

  if (browserName === 'chromium') {
    expectedEvents.splice(5, 0, 'onPageCreated')
  }

  expect(plugin.pluginEventList).toStrictEqual(expectedEvents)
})

class BeforeContextCompatPlugin extends DummyPlugin {
  get name() {
    return 'before-context-compat'
  }

  async beforeContext(options: any, browser: any) {
    this.pluginEventMap.set('beforeContextBrowserIsCompat', !!browser?.isCompatShim)
    this.pluginEventMap.set(
      'beforeContextUserAgent',
      await browser.userAgent()
    )
    return options
  }

  onPageCreated() {
    this.pluginEventMap.set(
      'onPageCreatedCount',
      (this.pluginEventMap.get('onPageCreatedCount') || 0) + 1
    )
  }
}

test('uses Puppeteer-compatible browser in beforeContext hooks', async ({
  playwrightExtra,
  playwrightVanilla,
  browserName
}) => {
  test.skip(browserName !== 'chromium', 'Chromium only')

  const extraLauncher = playwrightExtra.addExtra(playwrightVanilla[browserName])
  extraLauncher.use(new BeforeContextCompatPlugin())

  const browser = await extraLauncher.launch()
  const context = await browser.newContext()

  const plugin = extraLauncher.plugins.list[0] as BeforeContextCompatPlugin

  expect(plugin.pluginEventMap.get('beforeContextBrowserIsCompat')).toBe(true)
  expect(plugin.pluginEventMap.get('beforeContextUserAgent')).toContain(
    'Mozilla/5.0'
  )

  await context.close()
  await browser.close()
})

test('binds existing persistent pages when context is attached', async ({
  playwrightExtra,
  playwrightVanilla,
  browserName
}) => {
  test.skip(browserName !== 'chromium', 'Chromium only')

  const extraLauncher = playwrightExtra.addExtra(playwrightVanilla[browserName])
  extraLauncher.use(new BeforeContextCompatPlugin())

  const context = await extraLauncher.launchPersistentContext('')
  await context.newPage()

  const plugin = extraLauncher.plugins.list[0] as BeforeContextCompatPlugin

  expect(plugin.pluginEventMap.get('onPageCreatedCount')).toBe(2)

  await context.close()
})

test('emits correct events for connect', async ({ extraLauncher }) => {
  const server = await extraLauncher.launchServer()

  const browser = await extraLauncher.connect(server.wsEndpoint())
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.close()
  await browser.close()
  await server.close()

  const plugin = extraLauncher.plugins.list[0] as unknown as DummyPlugin
  expect(plugin.pluginEventList).toStrictEqual([
    'onPluginRegistered',
    'beforeConnect',
    'onBrowser',
    'afterConnect',
    'beforeContext',
    'onContextCreated',
    'onPageCreated',
    'onDisconnected'
  ])
})

test('emits correct events for connectOverCDP', async ({
  extraLauncher,
  browserName
}) => {
  test.skip(browserName !== 'chromium', 'Chromium only')

  const server = await extraLauncher.launchServer({
    args: ['--remote-debugging-port=9333']
  })

  const browser = await extraLauncher.connectOverCDP('http://localhost:9333')
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.close()
  await browser.close()
  await server.close()

  const plugin = extraLauncher.plugins.list[0] as unknown as DummyPlugin
  expect(plugin.pluginEventList).toStrictEqual([
    'onPluginRegistered',
    'beforeConnect',
    'onBrowser',
    'afterConnect',
    'beforeContext',
    'onContextCreated',
    'onPageCreated',
    'onDisconnected'
  ])
})
