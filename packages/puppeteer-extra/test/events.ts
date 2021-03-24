import test from 'ava'

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

import puppeteerVanilla from 'puppeteer'
import { addExtra } from 'puppeteer-extra'
import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'

test.beforeEach(t => {
  // Make sure we work with pristine modules
  try {
    delete require.cache[require.resolve('puppeteer-extra')]
    delete require.cache[require.resolve('puppeteer-extra-plugin')]
  } catch (error) {
    console.log(error)
  }
})

test('will bind launched browser events to plugins', async t => {
  const PLUGIN_EVENTS: string[] = []

  const puppeteer = addExtra(puppeteerVanilla)
  const pluginName = 'hello-world'
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts)
    }
    get name() {
      return pluginName
    }

    onPluginRegistered() {
      PLUGIN_EVENTS.push('onPluginRegistered')
      return Promise.resolve();
    }
    beforeLaunch() {
      PLUGIN_EVENTS.push('beforeLaunch')
      return Promise.resolve();
    }
    afterLaunch() {
      PLUGIN_EVENTS.push('afterLaunch')
      return Promise.resolve();
    }
    beforeConnect() {
      PLUGIN_EVENTS.push('beforeConnect')
      return Promise.resolve();
    }
    afterConnect() {
      PLUGIN_EVENTS.push('afterConnect')
      return Promise.resolve();
    }
    onBrowser() {
      PLUGIN_EVENTS.push('onBrowser')
      return Promise.resolve();
    }
    onTargetCreated() {
      PLUGIN_EVENTS.push('onTargetCreated')
      return Promise.resolve();
    }
    onPageCreated() {
      PLUGIN_EVENTS.push('onPageCreated')
      return Promise.resolve();
    }
    onTargetChanged() {
      PLUGIN_EVENTS.push('onTargetChanged')
      return Promise.resolve();
    }
    onTargetDestroyed() {
      PLUGIN_EVENTS.push('onTargetDestroyed')
      return Promise.resolve();
    }
    onDisconnected() {
      PLUGIN_EVENTS.push('onDisconnected')
      return Promise.resolve();
    }
    onClose() {
      PLUGIN_EVENTS.push('onClose')
      return Promise.resolve();
    }
  }

  const instance = new Plugin()
  puppeteer.use(instance)
  t.true(PLUGIN_EVENTS.includes('onPluginRegistered'))
  const browser = await puppeteer.launch({ args: PUPPETEER_ARGS })
  t.true(PLUGIN_EVENTS.includes('beforeLaunch'))
  t.true(PLUGIN_EVENTS.includes('afterLaunch'))
  // t.true(!PLUGIN_EVENTS.includes('beforeConnect'))
  // t.true(!PLUGIN_EVENTS.includes('afterConnect'))
  t.true(PLUGIN_EVENTS.includes('onBrowser'))
  const page = await browser.newPage().catch(console.log)
  t.true(PLUGIN_EVENTS.includes('onTargetCreated'))
  t.true(PLUGIN_EVENTS.includes('onPageCreated'))
  if (page)
    await page.goto('about:blank#foo').catch(console.log)
  t.true(PLUGIN_EVENTS.includes('onTargetChanged'))
  if (page)
    await page.close().catch(console.log)
  t.true(PLUGIN_EVENTS.includes('onTargetDestroyed'))
  await browser.close().catch(console.log)
  t.true(PLUGIN_EVENTS.includes('onDisconnected'))
  t.true(PLUGIN_EVENTS.includes('onClose'))
})

test('will bind connected browser events to plugins', async t => {
  const PLUGIN_EVENTS: string[] = [];

  // Launch vanilla puppeteer browser with no plugins

  const pptr1 = addExtra(puppeteerVanilla)

  const browserVanilla = await pptr1.launch({
    args: PUPPETEER_ARGS
  })
  const browserWSEndpoint = browserVanilla.wsEndpoint()

  const puppeteer = addExtra(puppeteerVanilla)
  const pluginName = 'hello-world'
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts)
    }
    get name() {
      return pluginName
    }

    onPluginRegistered() {
      PLUGIN_EVENTS.push('onPluginRegistered')
      return Promise.resolve();
    }
    beforeLaunch() {
      PLUGIN_EVENTS.push('beforeLaunch')
      return Promise.resolve();
    }
    afterLaunch() {
      PLUGIN_EVENTS.push('afterLaunch')
      return Promise.resolve();
    }
    beforeConnect() {
      PLUGIN_EVENTS.push('beforeConnect')
      return Promise.resolve();
    }
    afterConnect() {
      PLUGIN_EVENTS.push('afterConnect')
      return Promise.resolve();
    }
    onBrowser() {
      PLUGIN_EVENTS.push('onBrowser')
      return Promise.resolve();
    }
    onTargetCreated() {
      PLUGIN_EVENTS.push('onTargetCreated')
      return Promise.resolve();
    }
    onPageCreated() {
      PLUGIN_EVENTS.push('onPageCreated')
      return Promise.resolve();
    }
    onTargetChanged() {
      PLUGIN_EVENTS.push('onTargetChanged')
      return Promise.resolve();
    }
    onTargetDestroyed() {
      PLUGIN_EVENTS.push('onTargetDestroyed')
      return Promise.resolve();
    }
    onDisconnected() {
      PLUGIN_EVENTS.push('onDisconnected')
      return Promise.resolve();
    }
    onClose() {
      PLUGIN_EVENTS.push('onClose')
      return Promise.resolve();
    }
  }

  const instance = new Plugin()
  puppeteer.use(instance)
  t.true(PLUGIN_EVENTS.includes('onPluginRegistered'))
  const browser = await puppeteer
    .connect({ browserWSEndpoint })
    .catch(console.log)
  t.true(!PLUGIN_EVENTS.includes('beforeLaunch'))
  t.true(!PLUGIN_EVENTS.includes('afterLaunch'))
  t.true(PLUGIN_EVENTS.includes('beforeConnect'))
  t.true(PLUGIN_EVENTS.includes('afterConnect'))
  t.true(PLUGIN_EVENTS.includes('onBrowser'))

  if (browser) {
    const page = await browser.newPage()
    t.true(PLUGIN_EVENTS.includes('onTargetCreated'))
    t.true(PLUGIN_EVENTS.includes('onPageCreated'))
    await page.goto('about:blank#foo').catch(console.log)
    t.true(PLUGIN_EVENTS.includes('onTargetChanged'))
    await page.close().catch(console.log)
    t.true(PLUGIN_EVENTS.includes('onTargetDestroyed'))
    await browser.close().catch(console.log)
    t.true(PLUGIN_EVENTS.includes('onDisconnected'))
    t.true(!PLUGIN_EVENTS.includes('onClose'))
  }
})
