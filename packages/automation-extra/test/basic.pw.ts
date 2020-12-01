import test from 'ava'

import { PlaywrightExtra } from '../src/index'

const launcher = new PlaywrightExtra('chromium')

test('is an object', async t => {
  t.is(typeof launcher, 'object')
})

test('is an instance of PlaywrightExtra', async t => {
  t.is(launcher.constructor.name, 'PlaywrightExtra')
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
  t.true(launcher.launchPersistentContext instanceof Function)
  t.true(launcher.launchServer instanceof Function)
})
