import test, { beforeEach } from 'ava'
import puppeteer from 'puppeteer-extra'
import { PluginData, PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import puppeteerVanilla from 'puppeteer'

const PUPPETEER_ARGS: string[] = ['--no-sandbox', '--disable-setuid-sandbox']

beforeEach(t => {
  // Make sure we work with pristine modules
  try {
    delete require.cache[require.resolve('puppeteer-extra')]
    delete require.cache[require.resolve('puppeteer-extra-plugin')]
  } catch (error) {
    console.log(error)
  }
})

test('will modify puppeteer launch options through plugins', async t => {
  let FINAL_OPTIONS: any = null

  const pluginName = 'hello-world'
  const pluginData: PluginData[] = [{ name: 'foo', value: {foo: 'bar'} }]
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts)
    }
    get name(): string {
      return pluginName
    }
    get data(): PluginData[] {
      return pluginData
    }
    beforeLaunch(options: any): Promise<void> {
      options.args.push('--foobar=true')
      options.timeout = 60 * 1000
      options.headless = true
      return Promise.resolve();
    }
    afterLaunch(browser: any, opts: any): Promise<void> {
      FINAL_OPTIONS = opts.options
      return Promise.resolve();
    }
  }
  const instance = new Plugin()
  puppeteer.use(instance)
  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: false
  })

  t.deepEqual(FINAL_OPTIONS, {
    headless: true,
    timeout: 60000,
    args: [...PUPPETEER_ARGS, '--foobar=true']
  })

  await browser.close()
  t.true(true)
})

test('will modify puppeteer connect options through plugins', async t => {
  let FINAL_OPTIONS = null

  // Launch vanilla puppeteer browser with no plugins
  const browserVanilla = await puppeteerVanilla.launch({
    args: PUPPETEER_ARGS
  })
  const browserWSEndpoint = browserVanilla.wsEndpoint()

  const pluginName = 'hello-world'
  const pluginData: PluginData[] = [{ name: 'foo', value: {foo: 'bar'} }]
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts)
    }
    get name(): string {
      return pluginName
    }
    get data(): PluginData[] {
      return pluginData
    }
    beforeConnect(options: any): Promise<void> {
      options.foo1 = 60 * 1000
      options.foo2 = true
      return Promise.resolve();
    }
    afterConnect(browser: any, opts: any): Promise<void> {
      FINAL_OPTIONS = opts.options
      return Promise.resolve();
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
