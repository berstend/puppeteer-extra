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
  extraLauncher
}) => {
  const context = await extraLauncher.launchPersistentContext('')
  const page = await context.newPage()
  await page.close()
  await context.close()

  const plugin = extraLauncher.plugins.list[0] as unknown as DummyPlugin
  expect(plugin.pluginEventList).toStrictEqual([
    'onPluginRegistered',
    'beforeLaunch',
    'afterLaunch',
    'onContextCreated',
    'onPageCreated',
    'onDisconnected'
  ])
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
