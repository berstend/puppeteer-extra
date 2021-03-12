import test from 'ava'

import { PuppeteerExtra } from '../src/index'

const launcher = new PuppeteerExtra()

test('is an object', async t => {
  t.is(typeof launcher, 'object')
})

test('is an instance of PuppeteerExtra', async t => {
  t.is(launcher.constructor.name, 'PuppeteerExtra')
})

test('should have the public class members', async t => {
  t.true(launcher.use instanceof Function)
  t.true(launcher.plugins instanceof Object)
  t.true(launcher.plugins.list instanceof Array)
  t.true(launcher.plugins.names instanceof Array)
})

test('should have the orginal puppeteer public class members', async t => {
  t.true(launcher.launch instanceof Function)
  t.true(launcher.connect instanceof Function)
  t.true(launcher.executablePath instanceof Function)
  t.true(launcher.defaultArgs instanceof Function)
  t.true(launcher.createBrowserFetcher instanceof Function)
})
