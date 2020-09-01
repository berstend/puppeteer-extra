'use strict'

const test = require('ava')

const playwright = require('playwright')
const { addExtraPlaywright } = require('automation-extra')

const factory = (
  browserName = 'chromium',
  testConnect = false,
  useNewPage = false
) => async t => {
  const PLUGIN_EVENTS = []

  let browserServer = null
  let wsEndpoint = null
  if (testConnect) {
    browserServer = await playwright[browserName].launchServer()
    wsEndpoint = browserServer.wsEndpoint()
  }

  const launcher = addExtraPlaywright(playwright[browserName])
  const { AutomationExtraPlugin } = require('automation-extra-plugin')
  const pluginName = 'hello-world'

  class Plugin extends AutomationExtraPlugin {
    constructor(opts = {}) {
      super(opts)
    }
    get name() {
      return pluginName
    }

    onPluginRegistered() {
      PLUGIN_EVENTS.push('onPluginRegistered')
    }
    beforeLaunch() {
      PLUGIN_EVENTS.push('beforeLaunch')
    }
    afterLaunch() {
      PLUGIN_EVENTS.push('afterLaunch')
    }
    beforeConnect() {
      PLUGIN_EVENTS.push('beforeConnect')
    }
    afterConnect() {
      PLUGIN_EVENTS.push('afterConnect')
    }
    onBrowser() {
      PLUGIN_EVENTS.push('onBrowser')
    }
    beforeContext() {
      PLUGIN_EVENTS.push('beforeContext')
    }
    onContextCreated() {
      PLUGIN_EVENTS.push('onContextCreated')
    }
    onPageCreated() {
      PLUGIN_EVENTS.push('onPageCreated')
    }
    onPageClose() {
      PLUGIN_EVENTS.push('onPageClose')
    }
    onContextClose() {
      PLUGIN_EVENTS.push('onContextClose')
    }
    onDisconnected() {
      PLUGIN_EVENTS.push('onDisconnected')
    }
  }

  const instance = new Plugin()
  launcher.use(instance)
  t.true(PLUGIN_EVENTS.includes('onPluginRegistered'))

  let browser
  if (testConnect) {
    browser = await launcher.connect({ wsEndpoint })
    t.true(PLUGIN_EVENTS.includes('beforeConnect'))
    t.true(PLUGIN_EVENTS.includes('afterConnect'))
    t.true(!PLUGIN_EVENTS.includes('beforeLaunch'))
    t.true(!PLUGIN_EVENTS.includes('afterLaunch'))
  } else {
    browser = await launcher.launch()
    t.true(PLUGIN_EVENTS.includes('beforeLaunch'))
    t.true(PLUGIN_EVENTS.includes('afterLaunch'))
    t.true(!PLUGIN_EVENTS.includes('beforeConnect'))
    t.true(!PLUGIN_EVENTS.includes('afterConnect'))
  }

  t.true(PLUGIN_EVENTS.includes('onBrowser'))

  if (useNewPage) {
    const page = await browser.newPage()
    t.true(PLUGIN_EVENTS.includes('beforeContext'))
    t.true(PLUGIN_EVENTS.includes('onContextCreated'))
    t.true(PLUGIN_EVENTS.includes('onPageCreated'))

    await page.close()
    t.true(PLUGIN_EVENTS.includes('onPageClose'))

    await page.context().close()
    t.true(PLUGIN_EVENTS.includes('onContextClose'))
  } else {
    const context = await browser.newContext()
    t.true(PLUGIN_EVENTS.includes('beforeContext'))
    t.true(PLUGIN_EVENTS.includes('onContextCreated'))

    const page = await context.newPage().catch(console.log)
    t.true(PLUGIN_EVENTS.includes('onPageCreated'))

    await page.close()
    t.true(PLUGIN_EVENTS.includes('onPageClose'))

    await context.close()
    t.true(PLUGIN_EVENTS.includes('onContextClose'))
  }

  await browser.close().catch(console.log)
  t.true(PLUGIN_EVENTS.includes('onDisconnected'))

  if (browserServer) {
    await browserServer.close()
  }
}

test(
  'will bind launched browser events to plugins - chromium',
  factory('chromium')
)
test(
  'will bind launched browser events to plugins when using browser.newPage - chromium',
  factory('chromium', false, true)
)
test(
  'will bind launched browser events to plugins - firefox',
  factory('firefox')
)
test('will bind launched browser events to plugins - webkit', factory('webkit'))

test(
  'will bind connected browser events to plugins - chromium',
  factory('chromium', true)
)
