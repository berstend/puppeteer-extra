import { test, expect } from './fixtures/extra'

test('should export the basic functionality', async ({ playwrightExtra }) => {
  expect(playwrightExtra.addExtra).toBeDefined()
  expect(playwrightExtra.chromium).toBeDefined()
  expect(playwrightExtra.chromium.use).toBeDefined()
  expect(playwrightExtra.chromium.plugins).toBeDefined()
  expect(playwrightExtra.chromium.plugins.list).toBeDefined()
  expect(playwrightExtra.chromium.plugins.names).toBeDefined()
  expect(playwrightExtra.chromium.plugins.onPluginError).toBeDefined()
  expect(playwrightExtra.chromium.launch).toBeDefined()
  expect(playwrightExtra.chromium.launchPersistentContext).toBeDefined()
  expect(playwrightExtra.chromium.connect).toBeDefined()
  expect(playwrightExtra.chromium.connectOverCDP).toBeDefined()
  expect(playwrightExtra.firefox).toBeDefined()
  expect(playwrightExtra.firefox.use).toBeDefined()
  expect(playwrightExtra.firefox.launch).toBeDefined()
  expect(playwrightExtra.firefox.connect).toBeDefined()
  expect(playwrightExtra.webkit).toBeDefined()
  expect(playwrightExtra.webkit.use).toBeDefined()
  expect(playwrightExtra.webkit.launch).toBeDefined()
  expect(playwrightExtra.webkit.connect).toBeDefined()
  expect((playwrightExtra as any).nonexistent).toBeUndefined()
})

test('chromium export should be well formed', async ({ playwrightExtra }) => {
  const { chromium } = playwrightExtra
  expect(typeof chromium).toBe('object')
  expect(typeof chromium.use).toBe('function')
  expect(typeof chromium.launch).toBe('function')
  expect(typeof chromium.connect).toBe('function')
  expect(typeof chromium.name).toBe('function')
  expect(typeof chromium.name()).toBe('string')
  expect(chromium.constructor.name).toBe('PlaywrightExtraClass')
})

test('addExtra export should be well formed', async ({ playwrightExtra }) => {
  const { addExtra } = playwrightExtra
  expect(typeof addExtra).toBe('function')

  const launcher = addExtra()
  expect(typeof launcher).toBe('object')
  expect(launcher.constructor.name).toBe('PlaywrightExtraClass')
})

test('should re-export the same additional exports verbatim', async ({
  playwrightExtra,
  playwrightVanilla
}) => {
  expect(playwrightExtra.errors).toStrictEqual(playwrightVanilla.errors)
  expect(playwrightExtra.devices).toStrictEqual(playwrightVanilla.devices)
  expect(playwrightExtra.selectors).toStrictEqual(playwrightVanilla.selectors)
  expect(playwrightExtra.request).toStrictEqual(playwrightVanilla.request)
})
