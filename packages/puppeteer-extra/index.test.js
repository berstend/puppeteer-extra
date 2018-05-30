'use strict'

const { test } = require('ava')

const PuppeteerExtra = require('.')

test('is an object', async (t) => {
  t.is(typeof PuppeteerExtra, 'object')
})

test('is an instance of PuppeteerExtra', async (t) => {
  t.is(PuppeteerExtra.constructor.name, 'PuppeteerExtra')
})

test('should have the public class members', async (t) => {
  t.true(PuppeteerExtra.use instanceof Function)
  t.true(PuppeteerExtra.plugins instanceof Array)
  t.true(PuppeteerExtra.pluginNames instanceof Array)
  t.true(PuppeteerExtra.getPluginData instanceof Function)
})

test('should have the internal class members', async (t) => {
  t.true(PuppeteerExtra.getPluginsByProp instanceof Function)
  t.true(PuppeteerExtra.resolvePluginDependencies instanceof Function)
  t.true(PuppeteerExtra.orderPlugins instanceof Function)
  t.true(PuppeteerExtra.checkPluginRequirements instanceof Function)
  t.true(PuppeteerExtra.callPlugins instanceof Function)
  t.true(PuppeteerExtra.callPluginsWithValue instanceof Function)
})

test('should have the orginal puppeteer public class members', async (t) => {
  t.true(PuppeteerExtra.launch instanceof Function)
  t.true(PuppeteerExtra.connect instanceof Function)
  t.true(PuppeteerExtra.executablePath instanceof Function)
  t.true(PuppeteerExtra.defaultArgs instanceof Function)
  t.true(PuppeteerExtra.createBrowserFetcher instanceof Function)
})
