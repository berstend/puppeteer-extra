import test from 'ava'

import puppeteer from '../src/index'

test('is an object', async t => {
  t.is(typeof puppeteer, 'object')
})

test('is an instance of PuppeteerExtra', async t => {
  t.is(puppeteer.constructor.name, 'PuppeteerExtra')
})

test('should have the public class members', async t => {
  t.true(puppeteer.use instanceof Function)
  t.true(puppeteer.plugins instanceof Array)
  t.true(puppeteer.pluginNames instanceof Array)
  t.true(puppeteer.getPluginData instanceof Function)
})

test('should have the internal class members', async t => {
  t.true('getPluginsByProp' in puppeteer)
  t.true('resolvePluginDependencies' in puppeteer)
  t.true('orderPlugins' in puppeteer)
  t.true('checkPluginRequirements' in puppeteer)
  t.true('callPlugins' in puppeteer)
  t.true('callPluginsWithValue' in puppeteer)
})

test('should have the orginal puppeteer public class members', async t => {
  t.true(puppeteer.launch instanceof Function)
  t.true(puppeteer.connect instanceof Function)
  t.true(puppeteer.executablePath instanceof Function)
  t.true(puppeteer.defaultArgs instanceof Function)
  t.true(puppeteer.createBrowserFetcher instanceof Function)
})
