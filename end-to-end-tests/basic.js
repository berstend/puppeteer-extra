'use strict'

const { test } = require('ava')

const puppeteer = require('puppeteer-extra')
const PuppeteerExtraPlugin = require('puppeteer-extra-plugin')

test('will launch the browser normally', async (t) => {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('http://example.com', {waitUntil: 'domcontentloaded'})
  await browser.close()
  t.true(true)
})

test('will launch puppeteer with plugin support', async (t) => {
  const pluginName = 'hello-world'
  const pluginData = [ { name: 'foo', value: 'bar' } ]
  class Plugin extends PuppeteerExtraPlugin {
    constructor (opts = { }) { super(opts) }
    get name () { return pluginName }
    get data () { return pluginData }
  }
  const instance = new Plugin()
  puppeteer.use(instance)
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  t.is(puppeteer.plugins.length, 1)
  t.is(puppeteer.plugins[0].name, pluginName)
  t.is(puppeteer.pluginNames.length, 1)
  t.is(puppeteer.pluginNames[0], pluginName)
  t.is(puppeteer.getPluginData().length, 1)
  t.deepEqual(puppeteer.getPluginData()[0], pluginData[0])
  t.deepEqual(puppeteer.getPluginData('foo')[0], pluginData[0])
  t.is(puppeteer.getPluginData('not-existing').length, 0)

  await page.goto('http://example.com', {waitUntil: 'domcontentloaded'})
  await browser.close()
  t.true(true)
})
