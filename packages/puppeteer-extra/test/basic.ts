import test from 'ava'

import puppeteer from '..'

test.serial('is an object', async t => {
  t.is(typeof puppeteer, 'object')
})

test.serial('is an instance of PuppeteerExtra', async t => {
  t.is(puppeteer.constructor.name, 'PuppeteerExtra')
})

test.serial('should have the public class members', async t => {
  t.true(puppeteer.use instanceof Function)
  t.true(puppeteer.plugins instanceof Array)
  t.true(puppeteer.pluginNames instanceof Array)
  t.true(puppeteer.getPluginData instanceof Function)
})

test.serial('should have the internal class members', async t => {
  t.true('getPluginsByProp' in puppeteer)
  t.true('resolvePluginDependencies' in puppeteer)
  t.true('orderPlugins' in puppeteer)
  t.true('checkPluginRequirements' in puppeteer)
  t.true('callPlugins' in puppeteer)
  t.true('callPluginsWithValue' in puppeteer)
})

test.serial('should have the orginal puppeteer public class members', async t => {
  t.true(puppeteer.launch instanceof Function)
  t.true(puppeteer.connect instanceof Function)
  t.true(puppeteer.executablePath instanceof Function)
  t.true(puppeteer.defaultArgs instanceof Function)
  t.true(puppeteer.createBrowserFetcher instanceof Function)
})
