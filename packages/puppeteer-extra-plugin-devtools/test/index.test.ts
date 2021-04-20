const PLUGIN_NAME = 'devtools'

import test from 'ava'

import Plugin from '../src'

test('is a function', async t => {
  t.is(typeof Plugin, 'function')
})

test('should have the basic class members', async t => {
  const instance = Plugin()
  t.is(instance.name, PLUGIN_NAME)
  t.true(instance._isPuppeteerExtraPlugin)
})

test('should have opts with default values', async t => {
  const instance = Plugin()
  t.is(instance.opts.prefix, 'devtools-tunnel')
  t.is(instance.opts.auth.user, 'user')
  t.is(instance.opts.auth.pass.length, 40)
})

test('will throw without browser when creating a tunnel', async t => {
  const instance = Plugin()
  let error = null
  try {
    await (instance as any).createTunnel()
  } catch (err) {
    error = err
  }
  t.is(error.name, `ArgumentError`)
})

test('will accept a browser when creating a tunnel', async t => {
  const instance = Plugin({ auth: { user: 'bob', pass: 'yup' } })
  const fakeBrowser = { wsEndpoint: () => 'ws://foobar:1337' }
  await instance.createTunnel(fakeBrowser)
  t.is(true, true)
})
