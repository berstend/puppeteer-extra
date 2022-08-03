import test from 'ava'
import { PuppeteerLaunchOption } from '../../puppeteer-extra-plugin/src'

declare const require: any;

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

test.beforeEach(t => {
  // Make sure we work with pristine modules
  try {
    delete require.cache[require.resolve('puppeteer-extra')]
    delete require.cache[require.resolve('puppeteer-extra-plugin')]
  } catch (error) {
    console.log(error)
  }
})

test.serial('will modify puppeteer launch options through plugins', async t => {
  let FINAL_OPTIONS = null

  const puppeteer = require('puppeteer-extra')
  const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')
  const pluginName = 'hello-world'
  const pluginData = [{ name: 'foo', value: 'bar' }]
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts)
    }
    get name(): string {
      return pluginName
    }
    get data() {
      return pluginData
    }
    async beforeLaunch(options: PuppeteerLaunchOption = {}): Promise<void | PuppeteerLaunchOption> {
      options.args = options.args || [];
      options.args.push('--foobar=true')
      options.timeout = 60 * 1000
      options.headless = true
    }
    afterLaunch(browser: any, opts: any) {
      FINAL_OPTIONS = opts.options
    }
  }
  const instance = new Plugin()
  puppeteer.use(instance)
  const browser = await puppeteer.launch({
    args: [ ...PUPPETEER_ARGS ],
    headless: false
  })

  t.deepEqual(FINAL_OPTIONS, {
    headless: true,
    timeout: 60000,
    args: [ ...PUPPETEER_ARGS, '--foobar=true' ]
  })

  await browser.close()
  t.true(true)
})

test.serial('will modify puppeteer connect options through plugins', async t => {
  let FINAL_OPTIONS = null

  // Launch vanilla puppeteer browser with no plugins
  const puppeteerVanilla = require('puppeteer')
  const browserVanilla = await puppeteerVanilla.launch({
    args: [ ...PUPPETEER_ARGS ]
  })
  const browserWSEndpoint = browserVanilla.wsEndpoint()

  const puppeteer = require('puppeteer-extra')
  const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')
  const pluginName = 'hello-world'
  const pluginData = [{ name: 'foo', value: 'bar' }]
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts)
    }
    get name(): string {
      return pluginName
    }
    get data() {
      return pluginData
    }
    beforeConnect(options: any) {
      options.foo1 = 60 * 1000
      options.foo2 = true
    }
    afterConnect(browser: any, opts: any) {
      FINAL_OPTIONS = opts.options
    }
  }
  const instance = new Plugin()
  puppeteer.use(instance)
  const browser = await puppeteer.connect({ browserWSEndpoint })

  t.deepEqual(FINAL_OPTIONS, {
    foo1: 60 * 1000,
    foo2: true,
    browserWSEndpoint
  })

  await browser.close()
  t.true(true)
})
