'use strict'

import test, { beforeEach } from 'ava'

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

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
  let FINAL_OPTIONS = null

  const puppeteer = require('puppeteer-extra')
  const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')
  const pluginName = 'hello-world'
  const pluginData = [{ name: 'foo', value: 'bar' }]
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts)
    }
    get name() {
      return pluginName
    }
    get data() {
      return pluginData
    }
    beforeLaunch(options) {
      options.args.push('--foobar=true')
      options.timeout = 60 * 1000
      options.headless = true
    }
    afterLaunch(browser, opts) {
      FINAL_OPTIONS = opts.options
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
    args: [].concat(PUPPETEER_ARGS, ['--foobar=true'])
  })

  await browser.close()
  t.true(true)
})

test('will modify puppeteer connect options through plugins', async t => {
  let FINAL_OPTIONS = null

  // Launch vanilla puppeteer browser with no plugins
  const puppeteerVanilla = require('puppeteer')
  const browserVanilla = await puppeteerVanilla.launch({
    args: PUPPETEER_ARGS
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
    get name() {
      return pluginName
    }
    get data() {
      return pluginData
    }
    beforeConnect(options) {
      options.foo1 = 60 * 1000
      options.foo2 = true
    }
    afterConnect(browser, opts) {
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
