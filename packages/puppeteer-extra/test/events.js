'use strict'

const { test } = require('ava')

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

test.beforeEach(t => {
  // Make sure we work with pristine modules
  delete require.cache[require.resolve('puppeteer-extra')]
  delete require.cache[require.resolve('puppeteer-extra-plugin')]
})

test('will bind launched browser events to plugins', async (t) => {
  const PLUGIN_EVENTS = []

  const puppeteer = require('puppeteer-extra')
  const PuppeteerExtraPlugin = require('puppeteer-extra-plugin')
  const pluginName = 'hello-world'
  class Plugin extends PuppeteerExtraPlugin {
    constructor (opts = { }) { super(opts) }
    get name () { return pluginName }

    onPluginRegistered () { PLUGIN_EVENTS.push('onPluginRegistered') }
    beforeLaunch () { PLUGIN_EVENTS.push('beforeLaunch') }
    afterLaunch () { PLUGIN_EVENTS.push('afterLaunch') }
    beforeConnect () { PLUGIN_EVENTS.push('beforeConnect') }
    afterConnect () { PLUGIN_EVENTS.push('afterConnect') }
    onBrowser () { PLUGIN_EVENTS.push('onBrowser') }
    onTargetCreated () { PLUGIN_EVENTS.push('onTargetCreated') }
    onPageCreated () { PLUGIN_EVENTS.push('onPageCreated') }
    onTargetChanged () { PLUGIN_EVENTS.push('onTargetChanged') }
    onTargetDestroyed () { PLUGIN_EVENTS.push('onTargetDestroyed') }
    onDisconnected () { PLUGIN_EVENTS.push('onDisconnected') }
    onClose () { PLUGIN_EVENTS.push('onClose') }
  }

  const instance = new Plugin()
  puppeteer.use(instance)
  t.true(PLUGIN_EVENTS.includes('onPluginRegistered'))
  const browser = await puppeteer.launch({ args: PUPPETEER_ARGS })
  t.true(PLUGIN_EVENTS.includes('beforeLaunch'))
  t.true(PLUGIN_EVENTS.includes('afterLaunch'))
  t.true(!PLUGIN_EVENTS.includes('beforeConnect'))
  t.true(!PLUGIN_EVENTS.includes('afterConnect'))
  t.true(PLUGIN_EVENTS.includes('onBrowser'))
  const page = await browser.newPage()
  t.true(PLUGIN_EVENTS.includes('onTargetCreated'))
  t.true(PLUGIN_EVENTS.includes('onPageCreated'))
  await page.goto('about:blank#foo')
  t.true(PLUGIN_EVENTS.includes('onTargetChanged'))
  await page.close()
  t.true(PLUGIN_EVENTS.includes('onTargetDestroyed'))
  await browser.close()
  t.true(PLUGIN_EVENTS.includes('onDisconnected'))
  t.true(PLUGIN_EVENTS.includes('onClose'))
})

test('will bind connected browser events to plugins', async (t) => {
  const PLUGIN_EVENTS = []

  // Launch vanilla puppeteer browser with no plugins
  const puppeteerVanilla = require('puppeteer')
  const browserVanilla = await puppeteerVanilla.launch({ args: PUPPETEER_ARGS })
  const browserWSEndpoint = browserVanilla.wsEndpoint()

  const puppeteer = require('puppeteer-extra')
  const PuppeteerExtraPlugin = require('puppeteer-extra-plugin')
  const pluginName = 'hello-world'
  class Plugin extends PuppeteerExtraPlugin {
    constructor (opts = { }) { super(opts) }
    get name () { return pluginName }

    onPluginRegistered () { PLUGIN_EVENTS.push('onPluginRegistered') }
    beforeLaunch () { PLUGIN_EVENTS.push('beforeLaunch') }
    afterLaunch () { PLUGIN_EVENTS.push('afterLaunch') }
    beforeConnect () { PLUGIN_EVENTS.push('beforeConnect') }
    afterConnect () { PLUGIN_EVENTS.push('afterConnect') }
    onBrowser () { PLUGIN_EVENTS.push('onBrowser') }
    onTargetCreated () { PLUGIN_EVENTS.push('onTargetCreated') }
    onPageCreated () { PLUGIN_EVENTS.push('onPageCreated') }
    onTargetChanged () { PLUGIN_EVENTS.push('onTargetChanged') }
    onTargetDestroyed () { PLUGIN_EVENTS.push('onTargetDestroyed') }
    onDisconnected () { PLUGIN_EVENTS.push('onDisconnected') }
    onClose () { PLUGIN_EVENTS.push('onClose') }
  }

  const instance = new Plugin()
  puppeteer.use(instance)
  t.true(PLUGIN_EVENTS.includes('onPluginRegistered'))
  const browser = await puppeteer.connect({ browserWSEndpoint })
  t.true(!PLUGIN_EVENTS.includes('beforeLaunch'))
  t.true(!PLUGIN_EVENTS.includes('afterLaunch'))
  t.true(PLUGIN_EVENTS.includes('beforeConnect'))
  t.true(PLUGIN_EVENTS.includes('afterConnect'))
  t.true(PLUGIN_EVENTS.includes('onBrowser'))
  const page = await browser.newPage()
  t.true(PLUGIN_EVENTS.includes('onTargetCreated'))
  t.true(PLUGIN_EVENTS.includes('onPageCreated'))
  await page.goto('about:blank#foo')
  t.true(PLUGIN_EVENTS.includes('onTargetChanged'))
  await page.close()
  t.true(PLUGIN_EVENTS.includes('onTargetDestroyed'))
  await browser.close()
  t.true(PLUGIN_EVENTS.includes('onDisconnected'))
  t.true(!PLUGIN_EVENTS.includes('onClose'))
})
