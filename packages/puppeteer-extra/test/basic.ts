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
  t.true(puppeteer.plugins.list instanceof Array)
  t.true(puppeteer.plugins.names instanceof Array)
})

test('plugins should have the internal class members', async t => {
  t.true('add' in puppeteer.plugins)
  t.true('dispatch' in puppeteer.plugins)
  t.true('dispatchBlocking' in puppeteer.plugins)
  t.true('order' in puppeteer.plugins)
  t.true('checkRequirements' in puppeteer.plugins)
  t.true('resolveDependencies' in puppeteer.plugins)
})

test('should have the orginal puppeteer public class members', async t => {
  t.true(puppeteer.launch instanceof Function)
  t.true(puppeteer.connect instanceof Function)
  t.true(puppeteer.executablePath instanceof Function)
  t.true(puppeteer.defaultArgs instanceof Function)
  t.true(puppeteer.createBrowserFetcher instanceof Function)
})
